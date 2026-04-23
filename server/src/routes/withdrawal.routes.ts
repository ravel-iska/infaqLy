import { Router, Request, Response } from 'express';
import * as withdrawalService from '../services/withdrawal.service.js';
import { sendWithdrawalNotification } from '../services/whatsapp.service.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { db } from '../config/database.js';
import { campaigns } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/withdrawals
router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const withdrawals = await withdrawalService.listWithdrawals();
    return res.json({ withdrawals });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/withdrawals/balance
router.get('/balance', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const balance = await withdrawalService.getBalance();
    return res.json(balance);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/withdrawals/campaign-balances — per-campaign balances for crowdfunding UI
router.get('/campaign-balances', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const balances = await withdrawalService.getCampaignBalances();
    return res.json({ balances });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/withdrawals
router.post('/', requireAdmin, upload.single('evidence'), async (req: Request, res: Response) => {
  try {
    const { amount, bankInfo, note, campaignId } = req.body;
    if (!amount || !bankInfo) return res.status(400).json({ error: 'Nominal dan info rekening wajib diisi' });
    if (!campaignId) return res.status(400).json({ error: 'Pilih kampanye yang ingin ditarik dananya' });

    // SECURITY: Verify user owns this campaign or is admin
    const [campaign] = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, Number(campaignId)))
      .limit(1);

    if (!campaign) {
      return res.status(404).json({ error: 'Kampanye tidak ditemukan' });
    }

    // Check if user is campaign creator or system admin
    if (campaign.createdBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        error: 'Anda tidak memiliki izin untuk penarikan kampanye ini. Hanya pemilik kampanye atau admin yang dapat melakukan penarikan.'
      });
    }

    let evidenceUrl: string | undefined = undefined;
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      evidenceUrl = `data:${req.file.mimetype};base64,${b64}`;
    }

    const withdrawal = await withdrawalService.createWithdrawal({
      amount: Number(amount),
      bankInfo,
      note: note || undefined,
      evidenceUrl,
      createdBy: req.user!.id,
      campaignId: Number(campaignId),
    });

    // Send WA notification to admin
    sendWithdrawalNotification(Number(amount), bankInfo, note || '-').catch(() => {});

    return res.status(201).json({ withdrawal });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
