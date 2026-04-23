import { Resend } from 'resend';
import { env } from '../config/env.js';

let resendClient: Resend | null = null;

function getResendClient() {
  if (resendClient) return resendClient;

  // We enforce the Resend API Key inside SMTP_PASS since the user configured it there
  const resendApiKey = env.SMTP_PASS;

  if (!resendApiKey || !resendApiKey.startsWith('re_')) {
    console.warn('[Email] ⚠️ Kunci Resend API (SMTP_PASS) belum diset/tidak diawali "re_". Pengiriman email di-skip.');
    return null;
  }

  resendClient = new Resend(resendApiKey);
  return resendClient;
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
  const resend = getResendClient();
  if (!resend) return { success: false, error: 'Api key missing' };

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

    const senderEmail = env.SMTP_USER.includes('@') ? env.SMTP_USER : 'no-reply@tugasskripsibagus.web.id';

    const { data, error } = await resend.emails.send({
      from: `infaqLy Platform <${senderEmail}>`,
      to: [donorEmail],
      subject: `Kuitansi Donasi Anda: ${programName}`,
      html: htmlBody,
      attachments: [
        {
          filename: `Kuitansi-InfaqLy-${orderId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error(`[Email Resend] ❌ Gagal mengirim ke ${donorEmail}:`, error);
      return { success: false, error };
    }

    console.log(`[Email Resend] ✅ Berhasil terkirim! ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error(`[Email Resend] ❌ Crash gagal mengirim ke ${donorEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}
