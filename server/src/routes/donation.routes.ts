import { Router, Request, Response } from 'express';
import * as donationService from '../services/donation.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/donations — admin list all
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, search, campaignId } = req.query;
    const donations = await donationService.listDonations({
      status: status as string,
      search: search as string,
      campaignId: campaignId ? Number(campaignId) : undefined,
    });
    return res.json({ donations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/donations/me — user's own donations
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const donations = await donationService.getUserDonations(req.user!.id);
    return res.json({ donations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/donations/stats — admin dashboard stats
router.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await donationService.getDonationStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/donations/export — CSV export
router.get('/export', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const csv = await donationService.exportDonationsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=infaqly_transaksi.csv');
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/donations/:orderId — get single donation by order ID (authenticated user)
router.get('/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const donation = await donationService.getDonationByOrderId(req.params.orderId as string);
    if (!donation) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    // Only allow the owner or admin to see the donation
    if (donation.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    return res.json({ donation });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/donations — create new donation (user)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { campaignId, orderId, amount, donorName, donorEmail, donorPhone, isAnonymous, message } = req.body;
    if (!campaignId || !orderId || !amount) {
      return res.status(400).json({ error: 'campaignId, orderId, dan amount wajib diisi' });
    }
    const donation = await donationService.createDonation({
      campaignId: Number(campaignId),
      userId: req.user!.id,
      orderId,
      amount: Number(amount),
      donorName: donorName || req.user!.username,
      donorEmail: donorEmail || req.user!.email,
      donorPhone: donorPhone || req.user!.whatsapp,
      isAnonymous: !!isAnonymous,
      message: message || null,
    });
    return res.status(201).json({ donation });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PATCH /api/donations/:orderId/status — update donation status
router.patch('/:orderId/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status wajib diisi' });
    const donation = await donationService.updateDonationStatus(orderId as string, status);
    return res.json({ donation });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/donations/expire — manually expire old pending donations (admin)
router.post('/expire', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const count = await donationService.expirePendingDonations();
    return res.json({ message: `${count} donasi expired`, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
