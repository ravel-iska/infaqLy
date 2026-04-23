import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_USER, SMTP_PASS } = env;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[Email] ⚠️ SMTP_USER atau SMTP_PASS belum dikonfigurasi. Pengiriman email akan di-skip.');
    return null;
  }

  // Auto-detect SMTP Host based on provided username
  let smtpHost = 'smtp.gmail.com';
  let smtpPort = 465;
  if (SMTP_USER === 'resend') {
    smtpHost = 'smtp.resend.com';
  } else if (SMTP_USER.includes('brevo') || SMTP_USER.includes('sendinblue')) {
    smtpHost = 'smtp-relay.brevo.com';
    smtpPort = 587;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Mengirimkan Email Kuitansi Donasi beserta Lampiran PDF fisik yang di-attach di badan email.
 */
export async function sendDonationReceiptEmail(
  donorEmail: string,
  donorName: string,
  programName: string,
  amount: number,
  orderId: string,
  pdfBuffer: Buffer
) {
  const mailer = getTransporter();
  if (!mailer) return; // Skip silently if no email config is provided

  try {
    const fmt = new Intl.NumberFormat('id-ID').format(amount);
    
    // Patch domain otomatis untuk link tanda terima
    let baseUrl = env.FRONTEND_URL.replace(/\/+$/, '');
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    } else if (baseUrl.includes('infaqly-production.up.railway.app')) {
      baseUrl = baseUrl.replace('infaqly-production', 'infaqly');
    }
    const receiptUrl = `${baseUrl}/receipt/${orderId}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="text-align: center; padding: 20px; background-color: #059669; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">infaqLy</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Kuitansi Pembayaran Donasi</p>
        </div>
        
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Assalamu'alaikum <strong>${donorName}</strong>,</p>
          <p>Alhamdulillah, transaksi donasi Anda telah kami terima dengan detail sebagai berikut:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">No. Referensi</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${orderId}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Program</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${programName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Senilai</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #059669;">Rp ${fmt}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Status</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">✅ Berhasil</td></tr>
          </table>

          <p>Sebagai bukti sah atas kebaikan Anda, <strong>Kuitansi PDF resmi telah kami lampirkan bersama email ini</strong>.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${receiptUrl}" style="background-color: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Lihat Kuitansi di Web</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 13px; color: #6b7280; text-align: center;">Jazakallahu khairan atas partisipasi Anda.<br>Semoga Allah memberikan berkah berlipat ganda.</p>
        </div>
      </div>
    `;

    // Untuk Resend, SMTP_USER adalah "resend", bukan alamat email.
    // Jika SMTP_USER berbentuk email (ada '@'), pakai itu. Jika tidak, gunakan domain pengirim khusus.
    const senderEmail = env.SMTP_USER.includes('@') ? env.SMTP_USER : 'no-reply@tugasskripsibagus.web.id';

    const info = await mailer.sendMail({
      from: `"infaqLy Platform" <${senderEmail}>`,
      to: donorEmail,
      subject: `Kuitansi Donasi Anda: ${programName}`,
      html: htmlBody,
      attachments: [
        {
          filename: `Kuitansi-InfaqLy-${orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`[Email] ✅ Berhasil mengirim kuitansi ke ${donorEmail} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] ❌ Gagal mengirim kuitansi ke ${donorEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}
