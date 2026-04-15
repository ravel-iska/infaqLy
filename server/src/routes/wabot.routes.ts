/**
 * WhatsApp Bot Routes
 * Manage the self-hosted WA bot connection
 */
import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import * as wabot from '../services/wabot.service.js';

const router = Router();

// GET /api/wabot/status — get bot connection status + QR
router.get('/status', requireAdmin, (_req: Request, res: Response) => {
  const status = wabot.getStatus();
  return res.json(status);
});

// POST /api/wabot/connect — start bot connection (generate QR)
router.post('/connect', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await wabot.startBot();
    // Wait a moment for QR to generate
    await new Promise(r => setTimeout(r, 2000));
    return res.json(wabot.getStatus());
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/wabot/disconnect — logout and clear session
router.post('/disconnect', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await wabot.logout();
    return res.json({ message: 'Bot disconnected' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/wabot/test — send test message
router.post('/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Nomor tujuan wajib diisi' });

    const result = await wabot.sendMessage(phone, `🧪 *Test dari infaqLy Bot*\n\nJika Anda menerima pesan ini, WhatsApp Bot sudah terhubung! ✅\n\n_${new Date().toLocaleString('id-ID')}_`);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
