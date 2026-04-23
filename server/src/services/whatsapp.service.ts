import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { generateCertificatePDF } from './pdf.service.js';

function sanitizePhone(phone: string): string {
  let num = phone.replace(/[\s\-\+]/g, '');
  if (num.startsWith('0')) num = '62' + num.slice(1);
  if (!num.startsWith('62')) num = '62' + num;
  return num;
}

async function getFonnteToken(): Promise<string> {
  let token = env.FONNTE_TOKEN;
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'fonnte_token')).limit(1);
    if (row && row.value) token = row.value;
  } catch {}
  return token;
}

/**
 * Send WhatsApp message — Powered by Fonnte 3rd Party API
 * Allows sending files via `url` parameter (works on Free plan according to Fonnte JS SDK)
 */
export async function sendWhatsApp(target: string, message: string, fileUrl?: string, filename?: string) {
  const phone = sanitizePhone(target);
  const token = await getFonnteToken();

  if (!token) {
    console.warn(`[WA Fonnte] ❌ FONNTE_TOKEN is not set. Cannot send to ${phone}`);
    return { success: false, message: 'Fonnte Token tidak ditemukan' };
  }

  try {
    let response;

    if (fileUrl) {
      // Use FormData for attachments (Fonnte's documented way for JS)
      const form = new FormData();
      form.append('target', phone);
      form.append('message', message);
      form.append('url', fileUrl);
      if (filename) form.append('filename', filename);

      response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: form
      });
    } else {
      // Use URLSearchParams for text-only
      response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ target: phone, message })
      });
    }

    const result = await response.json();
    console.log(`[WA Fonnte] Response for ${phone}:`, JSON.stringify(result));
    
    if (result.status) {
      console.log(`[WA Fonnte] ✅ Message sent to ${phone}`);
      return { success: true, message: 'Terkirim via Fonnte' };
    } else {
      console.warn(`[WA Fonnte] ❌ Failed for ${phone}:`, result.reason);
      // Fallback to text-only if file fails
      if (fileUrl) {
         console.log(`[WA Fonnte] 🔁 Fallback: attempting to send text-only without attachment`);
         return sendWhatsApp(target, message);
      }
      return { success: false, message: result.reason || 'Gagal API Fonnte' };
    }
  } catch (err: any) {
    console.error(`[WA Fonnte] ❌ Crash API for ${phone}:`, err.message);
    if (fileUrl) {
       console.log(`[WA Fonnte] 🔁 Fallback: attempting to send text-only without attachment`);
       return sendWhatsApp(target, message);
    }
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
  const baseUrl = env.FRONTEND_URL.replace(/\/+$/, '');
  const receiptUrl = `${baseUrl}/receipt/${orderId}`;
  
  const msg = [
    `🕌 *infaqLy — Konfirmasi Donasi*`,
    ``,
    `Assalamu'alaikum ${donorName},`,
    ``,
    `Terima kasih atas donasi Anda! ❤️`,
    ``,
    `📋 *Detail:*`,
    `• Program: ${program}`,
    `• Nominal: Rp ${fmt}`,
    `• Order ID: ${orderId}`,
    `• Status: ✅ Berhasil`,
    ``,
    `📜 *Kuitansi Digital Anda:*`,
    `${receiptUrl}`,
    ``,
    `_Klik link di atas untuk melihat, mencetak, atau mengunduh kuitansi donasi Anda dalam format PDF._`,
    ``,
    `Semoga Allah membalas kebaikan Anda. Aamiin. 🤲`,
    ``,
    `_Pesan otomatis dari infaqLy_`,
  ].join('\n');
  
  const pdfUrl = `${baseUrl}/api/donations/${orderId}/pdf`;
  const filename = `Kuitansi-InfaqLy-${orderId}.pdf`;
  
  console.log(`[WA] 📤 Sending donation receipt link + attachment request to ${donorName} (${donorPhone})`);
  return sendWhatsApp(donorPhone, msg, pdfUrl, filename);
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
