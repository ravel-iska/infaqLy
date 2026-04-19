import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { settings, campaigns, donations } from '../db/schema.js';
import { eq, and, lt, inArray, sql } from 'drizzle-orm';
import { invalidateEnvCache } from '../utils/envHelper.js';

function maskSecret(val: string) {
  if (!val) return '';
  if (val.length <= 8) return '********';
  return val.slice(0, 4) + '********' + val.slice(-4);
}

const SENSITIVE_KEYS = [
  'midtrans_server_key',
  'midtrans_client_key',
  'midtrans_sandbox_server_key',
  'midtrans_sandbox_client_key',
  'midtrans_prod_server_key',
  'midtrans_prod_client_key',
  'doku_sandbox_secret_key',
  'doku_prod_secret_key'
];

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
        maintenance_mode: settingsMap['maintenance_mode'] || 'false',
        active_payment_gateway: settingsMap['active_payment_gateway'] || 'midtrans',
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
      if (row.key === 'admin_logout_pin') continue; // NEVER send PIN hash to client
      if (SENSITIVE_KEYS.includes(row.key)) {
        result[row.key] = maskSecret(row.value || '');
      } else {
        result[row.key] = row.value || '';
      }
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

    let envSwitched = false;
    let newEnv = '';
    
    // Check if any env is changing based on payload
    const checkEnvChange = async (key: string, newValue: string) => {
      const [currentEnvRow] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      const currentEnv = currentEnvRow?.value || 'sandbox';
      if (currentEnv !== newValue) {
        envSwitched = true;
        newEnv = newValue;
      }
    };

    if (data.midtrans_env) await checkEnvChange('midtrans_env', data.midtrans_env);
    if (!envSwitched && data.doku_env) await checkEnvChange('doku_env', data.doku_env);

    const inserts = [];
    for (const [key, value] of Object.entries(data)) {
      // Skip untouched/masked passwords
      if (typeof value === 'string' && value.includes('********')) {
        continue;
      }
      inserts.push({
        key,
        value: String(value)
      });
    }

    if (inserts.length > 0) {
      await db.insert(settings)
        .values(inserts)
        .onConflictDoUpdate({
          target: settings.key,
          set: { 
            value: sql`EXCLUDED.value`,
            updatedAt: new Date()
          }
        });
    }

    // ═══ Auto-Reset Dana saat pindah mode ═══
    if (envSwitched) {
      if (newEnv === 'production') {
        // Pindah ke PRODUCTION: reset dana terkumpul ke 0 (bersih, siap live)
        await db.update(campaigns).set({ collected: 0, donors: 0, updatedAt: new Date() });
        console.log('[Settings] Mode → PRODUCTION: Dana kampanye di-reset ke Rp 0');
      } else {
        // Pindah ke SANDBOX: reset dana ke 50.000.000 (testing)
        await db.update(campaigns).set({ collected: 50_000_000, donors: 25, updatedAt: new Date() });
        console.log('[Settings] Mode → SANDBOX: Dana kampanye di-reset ke Rp 50.000.000');
      }

      // Bersihkan donasi sandbox/test yang usang (pending/failed/expired > 24 jam)
      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await db.delete(donations).where(
        and(
          inArray(donations.paymentStatus, ['pending', 'failed', 'expired']),
          lt(donations.createdAt, cutoff24h),
        )
      );
      console.log('[Settings] Donasi usang (>24 jam) dibersihkan');
    }

    return res.json({ message: 'Settings berhasil disimpan' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  } finally {
    // Always invalidate env cache after settings change
    invalidateEnvCache();
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
