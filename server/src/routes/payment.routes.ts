import { Router, Request, Response } from 'express';
import * as paymentService from '../services/payment.service.js';
import * as donationService from '../services/donation.service.js';
import * as campaignService from '../services/campaign.service.js';
import { sendDonationNotification, sendErrorAlert, sendAdminTransactionUpdate } from '../services/whatsapp.service.js';
import * as dokuService from '../services/doku.service.js';
import { db } from '../config/database.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/payment/client-config — public endpoint for frontend Snap.js
// Returns client key + environment from DB settings (no secrets exposed)
router.get('/client-config', async (_req: Request, res: Response) => {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'active_payment_gateway')).limit(1);
    const activeGateway = row?.value || 'midtrans';

    if (activeGateway === 'doku') {
       const [dokuEnvRow] = await db.select().from(settings).where(eq(settings.key, 'doku_env')).limit(1);
       const dokuEnv = dokuEnvRow?.value || 'production';
       return res.json({ gateway: 'doku', env: dokuEnv });
    }

    const config = await paymentService.getClientConfig();
    return res.json({ ...config, gateway: 'midtrans' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/create-token — create Snap token
router.post('/create-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const { campaignId, amount, isAnonymous } = req.body;
    if (!campaignId || !amount) {
      return res.status(400).json({ error: 'campaignId dan amount wajib diisi' });
    }

    // Verify campaign exists and is active
    const campaign = await campaignService.getCampaignById(Number(campaignId));
    if (!campaign) return res.status(404).json({ error: 'Kampanye tidak ditemukan' });
    if (campaign.status !== 'active') return res.status(400).json({ error: 'Kampanye tidak aktif' });

    const user = req.user!;
    const donorName = isAnonymous ? 'Hamba Allah' : user.username;
    const orderId = paymentService.generateOrderId();

    // Check active gateway
    const [row] = await db.select().from(settings).where(eq(settings.key, 'active_payment_gateway')).limit(1);
    const activeGateway = row?.value || 'midtrans';

    let token = '';
    let redirectUrl = '';

    if (activeGateway === 'doku') {
      const dokuConfig = await dokuService.createCheckoutUrl({
        orderId, amount: Number(amount), donorName, donorEmail: user.email, donorPhone: user.whatsapp, programName: campaign.title, campaignId: campaign.id
      });
      redirectUrl = dokuConfig.checkoutUrl;
    } else {
      const snap = await paymentService.createSnapToken({
        orderId, amount: Number(amount), donorName, donorEmail: user.email, donorPhone: user.whatsapp, programName: campaign.title
      });
      token = snap.token;
      redirectUrl = snap.redirectUrl;
    }

    // Save donation record (pending)
    await donationService.createDonation({
      orderId,
      userId: user.id,
      campaignId: campaign.id,
      donorName,
      donorEmail: user.email,
      donorPhone: user.whatsapp,
      amount: Number(amount),
      isAnonymous: isAnonymous || false,
      snapToken: token,
      snapRedirectUrl: redirectUrl,
    });

    return res.json({ token, redirectUrl, orderId, gateway: activeGateway });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('midtrans')) {
      sendErrorAlert(`POST /api/payment/create-token`, `Midtrans API Error: ${err.message}`).catch(() => {});
    }
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/payment/notification — Midtrans webhook
router.post('/notification', async (req: Request, res: Response) => {
  try {
    const result = await paymentService.handleNotification(req.body);

    // Fetch campaign title for use in notifications
    let programTitle = 'Program Donasi InfaqLy';
    if (result.donation) {
      const campaign = await campaignService.getCampaignById(result.donation.campaignId);
      if (campaign) programTitle = campaign.title;

      // 1. ADMIN NOTIFICATION: Send to admin on ANY status update from Midtrans
      sendAdminTransactionUpdate(
        result.orderId, 
        result.status, 
        result.donation.amount, 
        result.donation.donorName, 
        programTitle
      ).catch(() => {});
    }

    // 2. DONOR NOTIFICATION: Send WA to the donor ONLY on newly completed successful transaction
    if (result.status === 'success' && result.isNewSuccess && result.donation) {
      const d = result.donation;
      sendDonationNotification(
        d.donorName, d.donorPhone || '', programTitle, d.amount, d.orderId
      ).catch(() => {});
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook Error]', err.message);
    if (err.message && err.message.includes('Mismatched') || err.message.includes('SECURITY_ERROR')) {
       // Return 200 so Midtrans stops retrying on invalid signatures
       return res.status(200).send('OK'); 
    }
    sendErrorAlert(`POST /api/payment/notification`, `Midtrans Webhook Error: ${err.message}`).catch(() => {});
    // Midtrans REQUIRES HTTP 200 OK. If we return 500 or anything else, 
    // it will endlessly retry and send the merchant "We are having difficulty..." emails.
    return res.status(200).json({ error: err.message, status: 'absorbed' });
  }
});

// POST /api/payment/simulate-success/:orderId — Developer Sandbox mode
// Only allowed for Admins to bypass Midtrans simulator
router.post('/simulate-success/:orderId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const result = await paymentService.simulateSuccess(orderId);

    // Send WA notification on simulated success
    if (result.isNewSuccess && result.donation) {
      const d = result.donation;
      const campaign = await campaignService.getCampaignById(d.campaignId);
      sendDonationNotification(
        d.donorName, d.donorPhone || '', campaign?.title || '', d.amount, d.orderId
      ).catch(() => {});
    }

    return res.json({ status: 'ok', orderId });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/payment/doku-notification — DOKU webhook implementation
router.post('/doku-notification', async (req: Request, res: Response) => {
  try {
    const result = await dokuService.handleNotification(req.body, req.headers);

    let programTitle = 'Program Donasi InfaqLy';
    if (result.donation) {
      const campaign = await campaignService.getCampaignById(result.donation.campaignId);
      if (campaign) programTitle = campaign.title;

      sendAdminTransactionUpdate(
        result.orderId, 
        result.status, 
        result.donation.amount, 
        result.donation.donorName, 
        programTitle
      ).catch(() => {});
    }

    if (result.status === 'success' && result.isNewSuccess && result.donation) {
      const d = result.donation;
      sendDonationNotification(
        d.donorName, d.donorPhone || '', programTitle, d.amount, d.orderId
      ).catch(() => {});
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[DOKU Webhook Error]', err.message);
    sendErrorAlert(`POST /api/payment/doku-notification`, `DOKU Webhook Error: ${err.message}`).catch(() => {});
    return res.status(200).json({ error: err.message, status: 'absorbed' });
  }
});

// GET /api/payment/check-status/:orderId — poll Midtrans API for real-time status
// Called by frontend after Snap popup closes to ensure DB is updated
router.get('/check-status/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    
    // Developer Sandbox Fix: 
    // Jika transaksi sudah keburu disimulasikan "success" via Admin Developer Tools,
    // JANGAN tanya ke midtrans lagi, karena Midtrans pasti bilangnya "pending" dan akan me-reset statusnya!
    const localDonation = await donationService.getDonationByOrderId(orderId);
    if (localDonation && localDonation.paymentStatus === 'success') {
      return res.json({ status: 'success', orderId, data: { status: 'success' } });
    }

    // Get active gateway to know which API to poll
    const [row] = await db.select().from(settings).where(eq(settings.key, 'active_payment_gateway')).limit(1);
    const activeGateway = row?.value || 'midtrans';

    let statusResult = null;
    let result = null;

    if (activeGateway === 'doku') {
      statusResult = await dokuService.checkTransactionStatus(orderId);
      if (statusResult) {
        result = await dokuService.handleNotification(statusResult, {});
      }
    } else {
      statusResult = await paymentService.checkTransactionStatus(orderId);
      if (statusResult) {
        result = await paymentService.handleNotification(statusResult);
      }
    }
    
    // Update DB with latest status
    if (result) {
      
      // Send WA notification on relatively new success
      if (result.status === 'success' && result.isNewSuccess && result.donation) {
        const d = result.donation;
        const campaign = await campaignService.getCampaignById(d.campaignId);
        sendDonationNotification(
          d.donorName, d.donorPhone || '', campaign?.title || '', d.amount, d.orderId
        ).catch(() => {});
      }
      
      return res.json({ status: result.status, orderId, data: { status: result.status } });
    }
    
    return res.json({ status: 'pending', orderId, data: { status: 'pending' } });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('midtrans')) {
      sendErrorAlert(`GET /api/payment/check-status`, `Midtrans Polling Error: ${err.message}`).catch(() => {});
    }
    return res.status(400).json({ error: err.message });
  }
});

export default router;
