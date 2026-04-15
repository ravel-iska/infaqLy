import { Router, Request, Response } from 'express';
import * as campaignService from '../services/campaign.service.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// GET /api/campaigns — list (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, search } = req.query;
    const campaigns = await campaignService.listCampaigns({
      status: status as string,
      category: category as string,
      search: search as string,
    });
    return res.json({ campaigns });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/active — active only (user-facing)
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const campaigns = await campaignService.getActiveCampaigns();
    return res.json({ campaigns });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/stats — dashboard stats (admin)
router.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await campaignService.getCampaignStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/monthly-stats — monthly donation chart (admin)
router.get('/monthly-stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await campaignService.getMonthlyStats();
    return res.json({ months: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/:id — single campaign (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaignById(Number(req.params.id));
    if (!campaign) return res.status(404).json({ error: 'Kampanye tidak ditemukan' });
    return res.json({ campaign });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/:id/donors — recent donors (public)
router.get('/:id/donors', async (req: Request, res: Response) => {
  try {
    const donors = await campaignService.getRecentDonors(Number(req.params.id));
    return res.json({ donors });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns — create (admin)
router.post('/', requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { title, category, target, status, description, endDate } = req.body;
    if (!title || !target) return res.status(400).json({ error: 'Judul dan target wajib diisi' });

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || null;

    const campaign = await campaignService.createCampaign({
      title, category, target: Number(target), status, imageUrl, description, endDate,
    });
    return res.status(201).json({ campaign });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PATCH /api/campaigns/:id — update (admin)
router.patch('/:id', requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const data: any = { ...req.body };
    if (data.target) data.target = Number(data.target);
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

    const campaign = await campaignService.updateCampaign(Number(req.params.id), data);
    return res.json({ campaign });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/campaigns/:id — delete (admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await campaignService.deleteCampaign(Number(req.params.id));
    return res.json({ message: 'Kampanye berhasil dihapus' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
