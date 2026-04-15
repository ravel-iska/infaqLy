import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { sendWelcomeNotification } from '../services/whatsapp.service.js';
import { db } from '../config/database.js';
import { settings, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, whatsapp, password } = req.body;
    if (!username || !email || !whatsapp || !password) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const result = await authService.registerUser({ username, email, whatsapp, password });

    // Set USER session cookie (separate from admin)
    res.cookie('infaqly_session', result.token, {
      httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send welcome WA notification (background)
    sendWelcomeNotification(username, whatsapp).catch(() => {});

    return res.status(201).json({ user: result.user, token: result.token });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/WA dan password wajib diisi' });
    }

    const result = await authService.loginUser(identifier, password);

    // Set USER session cookie (separate from admin)
    res.cookie('infaqly_session', result.token, {
      httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: result.user, token: result.token });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const result = await authService.loginAdmin(username, password);

    // Set ADMIN session cookie — 30 days (longer than user session)
    res.cookie('infaqly_admin_session', result.token, {
      httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: result.user, token: result.token });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.sessionToken) {
      await authService.logoutUser(req.sessionToken);
    }
    // Clear both cookies to be safe
    res.clearCookie('infaqly_session');
    res.clearCookie('infaqly_admin_session');
    return res.json({ message: 'Berhasil logout' });
  } catch {
    return res.status(500).json({ error: 'Gagal logout' });
  }
});

// GET /api/auth/session
router.get('/session', requireAuth, (req: Request, res: Response) => {
  return res.json({ user: authService.sanitizeUser(req.user!) });
});

// ═══════════════════════════════════════
// ADMIN PIN — Quick Re-Login after Session Expires
// ═══════════════════════════════════════

// GET /api/auth/admin/pin-status — check if admin PIN is set (public — used on login page)
router.get('/admin/pin-status', async (_req: Request, res: Response) => {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'admin_logout_pin')).limit(1);
    return res.json({ hasPin: !!(row?.value) });
  } catch {
    return res.json({ hasPin: false });
  }
});

// POST /api/auth/admin/set-pin — set or update admin PIN (requires admin auth)
router.post('/admin/set-pin', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4 || pin.length > 8) {
      return res.status(400).json({ error: 'PIN harus 4-8 digit' });
    }
    if (!/^\d+$/.test(pin)) {
      return res.status(400).json({ error: 'PIN hanya boleh berisi angka' });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    // Upsert into settings
    const existing = await db.select().from(settings).where(eq(settings.key, 'admin_logout_pin')).limit(1);
    if (existing.length > 0) {
      await db.update(settings).set({ value: pinHash, updatedAt: new Date() }).where(eq(settings.key, 'admin_logout_pin'));
    } else {
      await db.insert(settings).values({ key: 'admin_logout_pin', value: pinHash });
    }

    return res.json({ message: 'PIN berhasil disimpan' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin/pin-login — re-login with PIN (public — used when session expired)
// This creates a new 30-day admin session without needing username+password
router.post('/admin/pin-login', async (req: Request, res: Response) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ error: 'Username dan PIN wajib diisi' });
    }

    // Verify admin exists
    const [user] = await db.select().from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Admin tidak ditemukan' });
    }

    // Verify PIN
    const [row] = await db.select().from(settings).where(eq(settings.key, 'admin_logout_pin')).limit(1);
    if (!row?.value) {
      return res.status(400).json({ error: 'PIN belum diatur. Silakan login dengan password.' });
    }

    const valid = await bcrypt.compare(pin, row.value);
    if (!valid) {
      return res.status(403).json({ error: 'PIN salah' });
    }

    // Create new admin session (30 days)
    const result = await authService.loginAdminBypass(user.id);

    // Set admin cookie
    res.cookie('infaqly_admin_session', result.token, {
      httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: authService.sanitizeUser(user), token: result.token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/admin/pin — remove PIN (requires admin auth)
router.delete('/admin/pin', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.delete(settings).where(eq(settings.key, 'admin_logout_pin'));
    return res.json({ message: 'PIN berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;


