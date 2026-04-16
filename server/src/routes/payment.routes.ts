import { Router, Request, Response } from 'express';
import * as paymentService from '../services/payment.service.js';
import * as donationService from '../services/donation.service.js';
import * as campaignService from '../services/campaign.service.js';
import { sendDonationNotification } from '../services/whatsapp.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

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
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/check-status/:orderId — poll Midtrans API for real-time status
// Called by frontend after Snap popup closes to ensure DB is updated
router.get('/check-status/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
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
      
      return res.json({ status: result.status, orderId });
    }
    
    return res.json({ status: 'pending', orderId });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
