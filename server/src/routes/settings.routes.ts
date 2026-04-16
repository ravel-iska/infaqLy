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
    let waUrl = '';
    let displayPhone = '+62 21 555 1234';
    if (phone) {
      let cleanPhone = phone.replace(/^0/, '62').replace(/\D/g, '');
      waUrl = `https://wa.me/${cleanPhone}`;
      displayPhone = phone;
    }

    return res.json({ 
      waUrl, 
      phone: displayPhone,
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

export default router;
