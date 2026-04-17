import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { donations, campaigns, settings } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Get Midtrans config from database settings → env fallback.
 * Admin saves keys via /api/settings (persisted in DB).
 * This ensures keys survive browser cookie/localStorage clears.
 */
async function getMidtransConfig() {
  let serverKey = '';
  let clientKey = '';
  let merchantId = '';
  let midtransEnv: 'sandbox' | 'production' = 'sandbox';

  try {
    const rows4 = await db.select().from(settings).where(
      eq(settings.key, 'midtrans_env')
    ).limit(1);
    const dbEnv = rows4[0]?.value;
    if (dbEnv === 'production' || dbEnv === 'sandbox') midtransEnv = dbEnv;

    const prefix = midtransEnv === 'production' ? 'midtrans_prod_' : 'midtrans_sandbox_';

    // SERVER KEY
    const r1 = await db.select().from(settings).where(eq(settings.key, prefix + 'server_key')).limit(1);
    serverKey = r1[0]?.value || '';
    if (!serverKey) {
      const fb = await db.select().from(settings).where(eq(settings.key, 'midtrans_server_key')).limit(1);
      serverKey = fb[0]?.value || '';
    }

    // CLIENT KEY
    const r2 = await db.select().from(settings).where(eq(settings.key, prefix + 'client_key')).limit(1);
    clientKey = r2[0]?.value || '';
    if (!clientKey) {
      const fb = await db.select().from(settings).where(eq(settings.key, 'midtrans_client_key')).limit(1);
      clientKey = fb[0]?.value || '';
    }

    // MERCHANT ID
    const r3 = await db.select().from(settings).where(eq(settings.key, prefix + 'merchant_id')).limit(1);
    merchantId = r3[0]?.value || '';
    if (!merchantId) {
      const fb = await db.select().from(settings).where(eq(settings.key, 'midtrans_merchant_id')).limit(1);
      merchantId = fb[0]?.value || '';
    }
  } catch (err) {
    console.warn('[Midtrans] Failed to read settings from DB, using env fallback');
  }

  // Fallback to env vars if DB didn't have them
  if (!serverKey) serverKey = env.MIDTRANS_SERVER_KEY;
  if (!clientKey) clientKey = env.MIDTRANS_CLIENT_KEY;
  if (!merchantId) merchantId = env.MIDTRANS_MERCHANT_ID;
  if (!serverKey && !clientKey) midtransEnv = env.MIDTRANS_ENV;

  return { serverKey, clientKey, merchantId, env: midtransEnv };
}

/**
 * Generate Order ID
 */
export function generateOrderId(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INF-${date}-${rand}`;
}

/**
 * Create Snap Token via Midtrans API.
 * Reads server key from DB settings (set by admin via Settings page).
 */
export async function createSnapToken(data: {
  orderId: string; amount: number; donorName: string; donorEmail: string; donorPhone: string; programName: string;
}) {
  const config = await getMidtransConfig();

  if (!config.serverKey) {
    throw new Error('Midtrans Server Key belum dikonfigurasi. Buka Admin → Pengaturan → Midtrans.');
  }

  const SNAP_BASE_URL = config.env === 'production'
    ? 'https://app.midtrans.com/snap/v1'
    : 'https://app.sandbox.midtrans.com/snap/v1';

  const transactionData = {
    transaction_details: { order_id: data.orderId, gross_amount: data.amount },
    item_details: [{
      id: 'donation', price: data.amount, quantity: 1,
      name: data.programName.length > 50 ? data.programName.slice(0, 47) + '...' : data.programName,
    }],
    customer_details: {
      first_name: data.donorName,
      email: data.donorEmail || 'donor@infaqly.com',
      phone: data.donorPhone || '',
    },
  };

  const auth = Buffer.from(config.serverKey + ':').toString('base64');

  const response = await fetch(`${SNAP_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(transactionData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_messages?.[0] || `Midtrans error (${response.status})`);
  }

  const result = await response.json();
  return { token: result.token, redirectUrl: result.redirect_url };
}

/**
 * Get client key (for frontend Snap.js script) from DB settings.
 * This is called via a public API so the frontend can load the correct Snap script.
 */
export async function getClientConfig() {
  const config = await getMidtransConfig();
  return {
    clientKey: config.clientKey,
    env: config.env,
  };
}

/**
 * Handle Midtrans Webhook Notification
 */
export async function handleNotification(body: any) {
  const orderId = body.order_id;
  const transactionStatus = body.transaction_status;
  const fraudStatus = body.fraud_status;

  // Validate Midtrans Signature Key to prevent Webhook Spoofing
  const config = await getMidtransConfig();
  if (body.signature_key && config.serverKey) {
    const hashString = orderId + body.status_code + body.gross_amount + config.serverKey;
    const generatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    if (generatedHash !== body.signature_key) {
      throw new Error('SECURITY_ERROR: Manipulasi webhook terdeteksi! (Signature Mismatch)');
    }
  }

  // Map Midtrans status to our status
  let status: 'success' | 'pending' | 'expired' | 'failed' = 'pending';
  if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
    status = fraudStatus === 'accept' || !fraudStatus ? 'success' : 'failed';
  } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
    status = 'failed';
  } else if (transactionStatus === 'expire') {
    status = 'expired';
  }

  // Get current status before updating (to prevent double-counting and sandbox overrides)
  const [existing] = await db.select({ paymentStatus: donations.paymentStatus })
    .from(donations).where(eq(donations.orderId, orderId)).limit(1);
  const wasAlreadySuccess = existing?.paymentStatus === 'success';

  // SECURITY: Jika status lokal sudah success (baik asli maupun simulasi Sandbox), 
  // ABAIKAN webhook Midtrans yang mencoba menurunkannya kembali jadi pending/gagal!
  if (wasAlreadySuccess && status !== 'success') {
    return { orderId, status: 'success', donation: existing, isNewSuccess: false };
  }

  // Update donation record
  const [donation] = await db.update(donations)
    .set({
      paymentStatus: status,
      paymentMethod: body.payment_type || null,
      midtransResponse: body,
      paidAt: status === 'success' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(donations.orderId, orderId))
    .returning();

  // If transitioning TO success (and wasn't already success), update campaign
  let isNewSuccess = false;
  if (status === 'success' && donation && !wasAlreadySuccess) {
    isNewSuccess = true;
    await db.execute(
      sql`UPDATE campaigns SET collected = collected + ${donation.amount}, donors = donors + 1, updated_at = NOW() WHERE id = ${donation.campaignId}`
    );
  }

  return { orderId, status, donation, isNewSuccess };
}

/**
 * Check transaction status directly from Midtrans API.
 * Used as fallback when webhooks don't fire.
 */
export async function checkTransactionStatus(orderId: string) {
  const config = await getMidtransConfig();
  if (!config.serverKey) return null;

  const BASE_URL = config.env === 'production'
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

  const auth = Buffer.from(config.serverKey + ':').toString('base64');

  try {
    const response = await fetch(`${BASE_URL}/${orderId}/status`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Simulate Payment Success (Developer Sandbox Mode)
 * Bypasses Midtrans and forces a transaction to success.
 */
export async function simulateSuccess(orderId: string) {
  // Security lock: Only allow in Sandbox mode
  const config = await getMidtransConfig();
  if (config.env === 'production') {
    throw new Error('SECURITY ALERT: Opsi Developer ditolak. Website Anda sedang dalam mode Production!');
  }

  // Check existing transaction
  const [existing] = await db.select().from(donations).where(eq(donations.orderId, orderId)).limit(1);
  if (!existing) throw new Error('Opsi Developer: Transaksi tidak ditemukan di database.');
  
  if (existing.paymentStatus === 'success') {
    throw new Error('Opsi Developer: Transaksi ini sudah berstatus success.');
  }

  // Update donation to success
  const [donation] = await db.update(donations)
    .set({
      paymentStatus: 'success',
      paymentMethod: 'sandbox_simulation',
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(donations.orderId, orderId))
    .returning();

  // Increment campaign collected amount
  await db.execute(
    sql`UPDATE campaigns SET collected = collected + ${donation.amount}, donors = donors + 1, updated_at = NOW() WHERE id = ${donation.campaignId}`
  );

  return { orderId, status: 'success', donation, isNewSuccess: true };
}

