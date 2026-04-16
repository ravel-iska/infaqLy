import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/settings/public - get public settings (open for all)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(settings);
    const settingsMap: Record<string, string> = {};
    for (const row of rows) {
      settingsMap[row.key] = row.value || '';
    }

    const phone = settingsMap['fonnte_admin_phone'] || '';
    const hasWa = !!phone;

    return res.json({ 
      hasWa,
      settings: {
        maintenance_mode: settingsMap['maintenance_mode'] || 'false'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/settings — get all settings (admin only)
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value || '';
    }
    return res.json({ settings: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings — save all settings (admin only)
router.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = req.body as Record<string, string>;

    for (const [key, value] of Object.entries(data)) {
      const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      if (existing.length > 0) {
        await db.update(settings).set({ value: String(value), updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: String(value) });
      }
    }

    return res.json({ message: 'Settings berhasil disimpan' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/whatsapp-redirect - Obfuscated WhatsApp link redirect to hide phone number
router.get('/whatsapp-redirect', async (req: Request, res: Response) => {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'fonnte_admin_phone')).limit(1);
    const phone = row?.value || '';
    if (!phone) {
      return res.status(404).send('WhatsApp Help Center is not configured');
    }
    const cleanPhone = phone.replace(/^0/, '62').replace(/\D/g, '');
    return res.redirect(`https://wa.me/${cleanPhone}?text=Halo%20Admin%20Pusat%20Bantuan`);
  } catch (err: any) {
    return res.status(500).send('Internal Error');
  }
});

export default router;
