import { Router, Request, Response } from 'express';
import fs from 'fs';
import * as donationService from '../services/donation.service.js';
import * as campaignService from '../services/campaign.service.js';
import { generateCertificatePDF } from '../services/pdf.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// ═══ Named routes FIRST (before /:orderId param catch-all) ═══

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
    // Auto-expire stale pending donations before returning the list
    await donationService.expirePendingDonations().catch(() => {});
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

// ═══ POST routes (before param routes) ═══

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

// POST /api/donations/expire — manually expire old pending donations (admin)
router.post('/expire', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const count = await donationService.expirePendingDonations();
    return res.json({ message: `${count} donasi expired`, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ═══ Param routes LAST ═══

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

// GET /api/donations/:orderId/pdf — generate and serve PDF receipt publicly (for Fonnte / WhatsApp)
router.get('/:orderId/pdf', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const donation = await donationService.getDonationByOrderId(orderId);
    if (!donation || donation.paymentStatus !== 'success') {
      return res.status(404).send('Kuitansi tidak ditemukan atau pembayaran belum berhasil.');
    }

    const campaign = await campaignService.getCampaignById(donation.campaignId);
    const pdfBuffer = await generateCertificatePDF({
      orderId: donation.orderId,
      donorName: donation.isAnonymous ? 'Hamba Allah' : donation.donorName,
      amount: donation.amount,
      programName: campaign?.title || 'Program Donasi InfaqLy',
      date: new Date(donation.paidAt || donation.createdAt)
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Kuitansi-${orderId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    return res.status(500).send('Gagal membuat PDF: ' + err.message);
  }
});

// GET /api/donations/:orderId — public status check for payment verification page
// ⚠️ MUST be LAST — catches any unmatched path as an orderId param
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    // Guard: reject reserved route names that somehow slipped through
    if (['me', 'stats', 'export', 'expire'].includes(orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }

    const donation = await donationService.getDonationByOrderId(orderId);
    if (!donation) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    // Return only safe public fields (no email, phone, or internal data)
    return res.json({
      donation: {
        orderId: donation.orderId,
        campaignId: donation.campaignId,
        donorName: donation.isAnonymous ? 'Hamba Allah' : donation.donorName,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
        paymentStatus: donation.paymentStatus,
        isAnonymous: donation.isAnonymous,
        paidAt: donation.paidAt,
        createdAt: donation.createdAt,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
