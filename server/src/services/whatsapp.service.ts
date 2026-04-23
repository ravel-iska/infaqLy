import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

function sanitizePhone(phone: string): string {
  let num = phone.replace(/[\s\-\+]/g, '');
  if (num.startsWith('0')) num = '62' + num.slice(1);
  if (!num.startsWith('62')) num = '62' + num;
  return num;
}

/**
 * Send WhatsApp message — Powered by Fonnte 3rd Party API
 */
export async function sendWhatsApp(target: string, message: string) {
  const phone = sanitizePhone(target);
  const token = env.FONNTE_TOKEN;
  
  if (!token) {
    console.warn(`[WA Fonnte] ❌ FONNTE_TOKEN is not set. Cannot send to ${phone}`);
    return { success: false, message: 'Fonnte Token tidak ditemukan' };
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        target: phone,
        message: message,
      })
    });

    const result = await response.json();
    if (result.status) {
      console.log(`[WA Fonnte] ✅ Sent to ${phone}`);
      return { success: true, message: 'Terkirim via Fonnte' };
    } else {
      console.warn(`[WA Fonnte] ❌ Failed for ${phone}:`, result.reason);
      return { success: false, message: result.reason || 'Gagal API Fonnte' };
    }
  } catch (err: any) {
    console.error(`[WA Fonnte] ❌ Crash API for ${phone}:`, err.message);
    return { success: false, message: 'Kesalahan Jaringan Fonnte' };
  }
}

/** Welcome notification for new users */
export async function sendWelcomeNotification(name: string, phone: string) {
  const msg = `🕌 *Assalamu'alaikum, ${name}!*\n\nSelamat datang di *infaqLy* — Platform Donasi Infaq & Wakaf Digital. 🎉\n\nAkun Anda berhasil terdaftar!\n✅ Jelajahi program donasi\n✅ Berdonasi via berbagai metode\n✅ Pantau riwayat donasi di profil\n\n_Pesan otomatis dari infaqLy_`;
  console.log(`[WA] 📤 Sending welcome to ${name} (${phone})...`);
  return sendWhatsApp(phone, msg);
}

/** Donation success notification */
export async function sendDonationNotification(donorName: string, donorPhone: string, program: string, amount: number, orderId: string) {
  const fmt = new Intl.NumberFormat('id-ID').format(amount);
  const msg = `🕌 *infaqLy — Konfirmasi Donasi*\n\nAssalamu'alaikum ${donorName},\n\nTerima kasih atas donasi Anda! ❤️\n\n📋 *Detail:*\n• Program: ${program}\n• Nominal: Rp ${fmt}\n• Order ID: ${orderId}\n• Status: ✅ Berhasil\n\n_Catatan: Kuitansi digital donasi berformat PDF dapat Anda unduh kapan saja melalui Dasbor Profil Akun Anda._\n\nSemoga Allah membalas kebaikan Anda. Aamiin. 🤲\n\n_Pesan otomatis dari infaqLy_`;
  console.log(`[WA] 📤 Sending donation receipt to ${donorName} (${donorPhone})...`);
  
  return sendWhatsApp(donorPhone, msg);
}

/** OTP notification for password reset */
export async function sendOtpNotification(phone: string, otp: string) {
  const msg = `🔐 *infaqLy — Reset Password*\n\nKode verifikasi Anda: *${otp}*\n\nBerlaku 5 menit. Jangan berikan ke siapapun.\n\n_Pesan otomatis dari infaqLy_`;
  console.log(`[WA] 📤 Sending Password Reset OTP to ${phone}...`);
  return sendWhatsApp(phone, msg);
}

/** OTP notification for new account registration */
export async function sendRegistrationOtpNotification(name: string, phone: string, otp: string) {
  const msg = `🕌 *Assalamu'alaikum, ${name}!*\n\nSelamat datang di *infaqLy*! Silakan verifikasi nomor WhatsApp Anda dengan kode OTP berikut:\n\n*${otp}*\n\nKode berlaku 5 menit.\nJazakumullahu khairan. 🤲\n\n_Pesan otomatis dari infaqLy_`;
  console.log(`[WA] 📤 Sending Registration OTP to ${phone}...`);
  return sendWhatsApp(phone, msg);
}

/** Withdrawal notification to admin */
export async function sendWithdrawalNotification(amount: number, bank: string, note: string) {
  let adminPhone = '';
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'system_alert_phone')).limit(1);
    adminPhone = row?.value || '';
  } catch {}
  if (!adminPhone) adminPhone = env.ADMIN_PHONE || '';
  if (!adminPhone) return { success: false, message: 'Admin phone not set' };

  const fmt = new Intl.NumberFormat('id-ID').format(amount);
  return sendWhatsApp(adminPhone, `💸 *infaqLy — Penarikan Dana*\n\n• Nominal: Rp ${fmt}\n• Rekening: ${bank}\n• Keterangan: ${note}\n• Waktu: ${new Date().toLocaleString('id-ID')}\n\n_Pesan otomatis dari infaqLy_`);
}

/** Transaction update notification to admin */
export async function sendAdminTransactionUpdate(orderId: string, status: string, amount: number, donorName: string, program: string) {
  let adminPhone = '';
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'system_alert_phone')).limit(1);
    adminPhone = row?.value || '';
  } catch {}
  if (!adminPhone) adminPhone = env.ADMIN_PHONE || '';
  if (!adminPhone) return { success: false, message: 'Admin phone not set' };

  const fmt = new Intl.NumberFormat('id-ID').format(amount);
  
  let idStatus = status;
  let icon = '🔄';
  if (status === 'success') { idStatus = 'Berhasil'; icon = '✅'; }
  else if (status === 'pending') { idStatus = 'Menunggu Pembayaran'; icon = '⏳'; }
  else if (status === 'failed') { idStatus = 'Gagal'; icon = '❌'; }
  else if (status === 'expired') { idStatus = 'Kedaluwarsa'; icon = '⏱️'; }

  const msg = `${icon} *infaqLy Admin — Update Transaksi*\n\nBerlaku perubahan status pada transaksi donasi:\n\n• Order ID: ${orderId}\n• Program: ${program}\n• Donatur: ${donorName}\n• Nominal: Rp ${fmt}\n• Status Baru: *${idStatus}*\n\nSilakan pantau halaman Transaksi di Admin Panel secara detail.\n\n_Sistem Notifikasi infaqLy_`;
  
  return sendWhatsApp(adminPhone, msg);
}

/** Error / Crash Alert to admin */
export async function sendErrorAlert(endpoint: string, errorMessage: string) {
  let adminPhone = '';
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'system_alert_phone')).limit(1);
    adminPhone = row?.value || '';
  } catch {}
  if (!adminPhone) adminPhone = env.ADMIN_PHONE || '';
  if (!adminPhone) return { success: false, message: 'Admin phone not set' };

  const msg = `🚨 *infaqLy API ALERT* 🚨\n\nTerjadi kesalahan fatal (Crash) pada sistem server!\n\n*Endpoint:* ${endpoint}\n*Error:* ${errorMessage}\n*Waktu:* ${new Date().toLocaleString('id-ID')}\n\n_Harap segera cek log pada dashboard Railway Anda._`;
  return sendWhatsApp(adminPhone, msg);
}
