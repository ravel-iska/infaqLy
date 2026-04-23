import { Router, Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import * as otpService from '../services/otp.service.js';
import { sendOtpNotification } from '../services/whatsapp.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// GET /api/users/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user!.id);
  return res.json({ user });
});

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await userService.updateProfile(req.user!.id, req.body);
    return res.json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PATCH /api/users/me/avatar
router.patch('/me/avatar', requireAuth, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File avatar diperlukan' });
    const b64 = req.file.buffer.toString('base64');
    const avatarUrl = `data:${req.file.mimetype};base64,${b64}`;
    const user = await userService.updateProfile(req.user!.id, { avatarUrl });
    return res.json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/me/avatar
router.delete('/me/avatar', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await userService.updateProfile(req.user!.id, { avatarUrl: null });
    return res.json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/users/me/password
router.post('/me/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Password lama dan baru wajib diisi' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });

    await userService.changePassword(req.user!.id, currentPassword, newPassword);
    return res.json({ message: 'Password berhasil diubah' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/users/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Email atau nomor WhatsApp wajib diisi' });

    const account = await userService.findAccount(identifier);
    const otp = await otpService.generateOtp(account.id, 'reset_password');

    // Unified sending logic (WABot first, Fonnte fallback)
    const result = await sendOtpNotification(account.whatsapp, otp);
    
    if (result.success) {
      return res.json({ message: 'Kode OTP telah dikirim via WhatsApp', userId: account.id, whatsapp: account.whatsapp });
    }

    // Failed
    console.log(`[OTP] Code for ${account.whatsapp}: ${otp} (use manually)`);
    return res.status(500).json({
      error: 'Gagal mengirim OTP. Pastikan WhatsApp Bot sudah terhubung (scan QR).',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/users/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'userId dan kode OTP wajib diisi' });

    // Validate but DO NOT burn the OTP yet (wait until reset-password)
    const valid = await otpService.verifyOtp(userId, code, 'reset_password', false);
    if (!valid) return res.status(400).json({ error: 'Kode OTP salah atau sudah expired' });

    return res.json({ message: 'OTP terverifikasi', verified: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/users/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { userId, code, newPassword } = req.body;
    if (!userId || !newPassword || !code) return res.status(400).json({ error: 'Data tidak lengkap (wajib sertakan OTP)' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });

    // Verify AND burn the OTP in one swift motion
    const valid = await otpService.verifyOtp(userId, code, 'reset_password', true);
    if (!valid) return res.status(400).json({ error: 'Sesi reset password tidak valid atau sudah daluwarsa' });

    await userService.resetPassword(userId, newPassword);
    return res.json({ message: 'Password berhasil direset' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
