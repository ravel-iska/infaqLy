import { Router, Request, Response } from 'express';
import * as paymentService from '../services/payment.service.js';
import * as donationService from '../services/donation.service.js';
import * as campaignService from '../services/campaign.service.js';
import { sendDonationNotification, sendErrorAlert } from '../services/whatsapp.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/payment/client-config — public endpoint for frontend Snap.js
// Returns client key + environment from DB settings (no secrets exposed)
router.get('/client-config', async (_req: Request, res: Response) => {
  try {
    const config = await paymentService.getClientConfig();
    return res.json(config);
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

    // Create Snap Token (reads server key from DB settings)
    const snap = await paymentService.createSnapToken({
      orderId,
      amount: Number(amount),
      donorName,
      donorEmail: user.email,
      donorPhone: user.whatsapp,
      programName: campaign.title,
    });

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
      snapToken: snap.token,
      snapRedirectUrl: snap.redirectUrl,
    });

    return res.json({ token: snap.token, redirectUrl: snap.redirectUrl, orderId });
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

    // Send WA notification on newly completed successful transaction
    if (result.status === 'success' && result.isNewSuccess && result.donation) {
      const d = result.donation;
      const campaign = await campaignService.getCampaignById(d.campaignId);
      sendDonationNotification(
        d.donorName, d.donorPhone || '', campaign?.title || '', d.amount, d.orderId
      ).catch(() => {});
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook Error]', err.message);
    sendErrorAlert(`POST /api/payment/notification`, `Midtrans Webhook Error: ${err.message}`).catch(() => {});
    return res.status(500).json({ error: err.message });
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
      return res.json({ status: 'success', data: { status: 'success' }, orderId });
    }

    const statusResult = await paymentService.checkTransactionStatus(orderId);
    
    // Update DB with latest status from Midtrans
    if (statusResult) {
      const result = await paymentService.handleNotification(statusResult);
      
      // Send WA notification on relatively new success
      if (result.status === 'success' && result.isNewSuccess && result.donation) {
        const d = result.donation;
        const campaign = await campaignService.getCampaignById(d.campaignId);
        sendDonationNotification(
          d.donorName, d.donorPhone || '', campaign?.title || '', d.amount, d.orderId
        ).catch(() => {});
      }
      
      return res.json({ status: result.status, data: { status: result.status }, orderId });
    }
    
    return res.json({ status: 'pending', data: { status: 'pending' }, orderId });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('midtrans')) {
      sendErrorAlert(`GET /api/payment/check-status`, `Midtrans Polling Error: ${err.message}`).catch(() => {});
    }
    return res.status(400).json({ error: err.message });
  }
});

export default router;
