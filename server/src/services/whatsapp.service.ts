import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import * as wabot from './wabot.service.js';
import { generateCertificatePDF } from './pdf.service.js';
import fs from 'fs';

const FONNTE_API_URL = 'https://api.fonnte.com/send';

function sanitizePhone(phone: string): string {
  let num = phone.replace(/[\s\-\+]/g, '');
  if (num.startsWith('0')) num = '62' + num.slice(1);
  if (!num.startsWith('62')) num = '62' + num;
  return num;
}

/** Get Fonnte token — tries DB settings first, then .env fallback */
async function getFonnteToken(): Promise<string | null> {
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'fonnte_token')).limit(1);
    if (row?.value) return row.value;
  } catch {}
  return env.FONNTE_TOKEN || null;
}

/**
 * Send WhatsApp message via Fonnte API (fallback)
 */
async function sendViaFonnte(target: string, message: string) {
  const token = await getFonnteToken();
  if (!token) {
    return { success: false, message: 'Token Fonnte belum dikonfigurasi' };
  }

  const phoneNumber = sanitizePhone(target);

  try {
    const body = new URLSearchParams();
    body.append('target', phoneNumber);
    body.append('message', message);
    body.append('countryCode', '0');

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: { 'Authorization': token },
      body,
    });

    const data = await response.json();
    return data.status === true
      ? { success: true, message: 'Pesan WhatsApp terkirim via Fonnte', data }
      : { success: false, message: data.reason || 'Gagal mengirim via Fonnte', data };
  } catch (error: any) {
    return { success: false, message: 'Fonnte error: ' + error.message };
  }
}

/**
 * Send WhatsApp message — WABot first, Fonnte fallback
 * Prioritas: WABot (Baileys self-hosted) → Fonnte API
 */
export async function sendWhatsApp(target: string, message: string) {
  // 1. Try WABot (Baileys) first
  const botStatus = wabot.getStatus();
  if (botStatus.connected) {
    const result = await wabot.sendMessage(target, message);
    if (result.success) {
      console.log(`[WA] ✅ Sent via WABot to ${sanitizePhone(target)}`);
      return result;
    }
    console.warn(`[WA] WABot send failed, trying Fonnte...`);
  }

  // 2. Fallback to Fonnte
  const fonnteResult = await sendViaFonnte(target, message);
  if (fonnteResult.success) {
    console.log(`[WA] ✅ Sent via Fonnte to ${sanitizePhone(target)}`);
  } else {
    console.warn(`[WA] ❌ Both WABot and Fonnte failed for ${sanitizePhone(target)}`);
  }
  return fonnteResult;
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
  const msg = `🕌 *infaqLy — Konfirmasi Donasi*\n\nAssalamu'alaikum ${donorName},\n\nTerima kasih atas donasi Anda! ❤️\n\n📋 *Detail:*\n• Program: ${program}\n• Nominal: Rp ${fmt}\n• Order ID: ${orderId}\n• Status: ✅ Berhasil\n\nSemoga Allah membalas kebaikan Anda. Aamiin. 🤲\n\n_Pesan otomatis dari infaqLy_`;
  console.log(`[WA] 📤 Sending donation receipt to ${donorName} (${donorPhone})...`);
  
  // Kirim struk teks utama terlebih dahulu
  const result = await sendWhatsApp(donorPhone, msg);

  // Jika WA bot native (Baileys) tersambung, kita buat & kirim Certificate PDF
  const botStatus = wabot.getStatus();
  if (botStatus.connected) {
    let pdfPath = '';
    try {
      console.log(`[WA] 📄 Generating PDF certificate for ${orderId}...`);
      pdfPath = await generateCertificatePDF({
        orderId,
        donorName,
        amount,
        programName: program,
        date: new Date(),
      });

      console.log(`[WA] 📤 Sending PDF certificate to ${donorPhone}...`);
      await wabot.sendDocument(
        donorPhone, 
        pdfPath, 
        `Kuitansi-Donasi-${orderId}.pdf`, 
        `Berikut adalah kuitansi digital untuk donasi Anda.`
      );
    } catch (err: any) {
      console.error(`[WA] ❌ Failed to generate/send PDF:`, err);
    } finally {
      // Hapus file sementara agar tidak menumpuk memenuhi memori/storage server
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log(`[WA] 🗑️ Temporary PDF file deleted: ${pdfPath}`);
      }
    }
  }

  return result;
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
  if (!adminPhone) adminPhone = env.FONNTE_ADMIN_PHONE || '';
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
  if (!adminPhone) adminPhone = env.FONNTE_ADMIN_PHONE || '';
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
  if (!adminPhone) adminPhone = env.FONNTE_ADMIN_PHONE || '';
  if (!adminPhone) return { success: false, message: 'Admin phone not set' };

  const msg = `🚨 *infaqLy API ALERT* 🚨\n\nTerjadi kesalahan fatal (Crash) pada sistem server!\n\n*Endpoint:* ${endpoint}\n*Error:* ${errorMessage}\n*Waktu:* ${new Date().toLocaleString('id-ID')}\n\n_Harap segera cek log pada dashboard Railway Anda._`;
  return sendWhatsApp(adminPhone, msg);
}
