import { Router, Request, Response } from 'express';
import { sendWhatsApp } from '../services/whatsapp.service.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/whatsapp/send
router.post('/send', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { target, message } = req.body;
    if (!target || !message) return res.status(400).json({ error: 'Target dan message wajib diisi' });

    const result = await sendWhatsApp(target, message);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/test
router.post('/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: 'Nomor tujuan wajib diisi' });

    const result = await sendWhatsApp(
      target,
      `✅ *Test Koneksi infaqLy*\n\nKoneksi Fonnte WhatsApp API berhasil!\nWaktu: ${new Date().toLocaleString('id-ID')}`
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
