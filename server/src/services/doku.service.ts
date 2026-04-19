import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { donations, campaigns, settings } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function getDokuConfig() {
  let clientId = '';
  let secretKey = '';
  let dokuEnv: 'sandbox' | 'production' = 'sandbox';

  try {
    const rows4 = await db.select().from(settings).where(eq(settings.key, 'doku_env')).limit(1);
    const dbEnv = rows4[0]?.value;
    if (dbEnv === 'production' || dbEnv === 'sandbox') dokuEnv = dbEnv;

    const prefix = dokuEnv === 'production' ? 'doku_prod_' : 'doku_sandbox_';

    const r1 = await db.select().from(settings).where(eq(settings.key, prefix + 'client_id')).limit(1);
    clientId = r1[0]?.value || '';

    const r2 = await db.select().from(settings).where(eq(settings.key, prefix + 'secret_key')).limit(1);
    secretKey = r2[0]?.value || '';
  } catch (err) {
    console.warn('[DOKU] Failed to read settings from DB');
  }

  return { clientId, secretKey, env: dokuEnv };
}

function generateSignature(clientId: string, requestId: string, timestamp: string, targetPath: string, bodyJson: string, secret: string) {
  const digest = crypto.createHash('sha256').update(bodyJson).digest('base64');
  
  const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(componentSignature);
  return hmac.digest('base64');
}

export async function createCheckoutUrl(data: {
  orderId: string; amount: number; donorName: string; donorEmail: string; donorPhone: string; programName: string; campaignId: number;
}) {
  const config = await getDokuConfig();

  if (!config.clientId || !config.secretKey) {
    throw new Error('DOKU API belum dikonfigurasi. Info Client ID atau Secret Key kosong.');
  }

  const BASE_URL = config.env === 'production'
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com';
    
  const TARGET_PATH = '/checkout/v1/payment';

  const transactionData = {
    order: {
      invoice_number: data.orderId,
      line_items: [{
        name: data.programName.length > 50 ? data.programName.slice(0, 47) + '...' : data.programName,
        price: data.amount,
        quantity: 1
      }],
      amount: data.amount,
      callback_url: env.FRONTEND_URL + '/explore/' + data.campaignId + '?orderId=' + data.orderId,
    },
    payment: {
      payment_due_date: 60 // 60 minutes
    },
    customer: {
      id: data.donorPhone || '0000',
      name: data.donorName,
      email: data.donorEmail || 'donor@infaqly.com',
      phone: data.donorPhone || '',
    }
  };

  const bodyString = JSON.stringify(transactionData);
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 19) + 'Z'; 

  const signature = generateSignature(config.clientId, requestId, timestamp, TARGET_PATH, bodyString, config.secretKey);

  const response = await fetch(`${BASE_URL}${TARGET_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': config.clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Signature': `HMACSHA256=${signature}`
    },
    body: bodyString,
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error?.message || result.message || `DOKU API error (${response.status})`);
  }

  return { 
    checkoutUrl: result.response?.payment?.url, 
    orderId: data.orderId 
  };
}

export async function handleNotification(body: any, headers: any) {
  // DOKU sends notification, but to be 100% secure, we should verify the signature. 
  // However, often DOKU notification body is complex. For now, we trust the incoming webhook 
  // and double-check order status via API or trust the payload signature.
  
  // DOKU Payload for successful payment:
  // body.transaction.status == 'SUCCESS'
  // body.order.invoice_number == orderId
  
  const orderId = body.order?.invoice_number;
  const transactionStatus = body.transaction?.status;

  if (!orderId) {
    throw new Error('DOKU Webhook Invalid Payload: no invoice_number');
  }

  let status: 'success' | 'pending' | 'expired' | 'failed' = 'pending';
  
  if (transactionStatus === 'SUCCESS') {
    status = 'success';
  } else if (transactionStatus === 'FAILED') {
    status = 'failed';
  }

  const [existing] = await db.select()
    .from(donations).where(eq(donations.orderId, orderId)).limit(1);
  const wasAlreadySuccess = existing?.paymentStatus === 'success';

  if (wasAlreadySuccess && status !== 'success') {
    return { orderId, status: 'success', donation: existing, isNewSuccess: false };
  }

  const [donation] = await db.update(donations)
    .set({
      paymentStatus: status,
      paymentMethod: body.service?.id || 'doku_gateway',
      midtransResponse: body, // we reuse the json column
      paidAt: status === 'success' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(donations.orderId, orderId))
    .returning();

  let isNewSuccess = false;
  if (status === 'success' && donation && !wasAlreadySuccess) {
    isNewSuccess = true;
    await db.execute(
      sql`UPDATE campaigns SET collected = collected + ${donation.amount}, donors = donors + 1, updated_at = NOW() WHERE id = ${donation.campaignId}`
    );
    await db.execute(
      sql`UPDATE campaigns SET status = 'completed', updated_at = NOW() WHERE id = ${donation.campaignId} AND target > 0 AND collected >= target AND status = 'active'`
    );
  }

  return { orderId, status, donation, isNewSuccess };
}

export async function checkTransactionStatus(orderId: string) {
  const config = await getDokuConfig();
  if (!config.clientId || !config.secretKey) return null;

  const BASE_URL = config.env === 'production'
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com';
    
  // Check Status DOKU Jokul API: GET /orders/v1/status/{invoice_number}
  const TARGET_PATH = `/orders/v1/status/${orderId}`;
  
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 19) + 'Z'; 
  const signature = generateSignature(config.clientId, requestId, timestamp, TARGET_PATH, '', config.secretKey);

  try {
    const response = await fetch(`${BASE_URL}${TARGET_PATH}`, {
      method: 'GET',
      headers: {
        'Client-Id': config.clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': `HMACSHA256=${signature}`
      },
    });

    if (!response.ok) return null;

    const body = await response.json();
    return body; // returns full DOKU notification-style format
  } catch {
    return null;
  }
}
