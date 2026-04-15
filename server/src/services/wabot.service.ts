/**
 * WhatsApp Bot Service using Baileys
 * Self-hosted WA bot — hanya untuk OTP
 * Tidak butuh Fonnte atau layanan pihak ketiga
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.resolve(__dirname, '../../.wa-session');

// Silent logger for Baileys
const logger = pino({ level: 'silent' });

// ═══ State ═══
let sock: ReturnType<typeof makeWASocket> | null = null;
let qrDataUrl: string | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'qr' | 'connected' = 'disconnected';
let retryCount = 0;
const MAX_RETRIES = 3;

/**
 * Format phone number to WhatsApp JID
 */
function toJid(phone: string): string {
  let num = phone.replace(/[\s\-\+]/g, '');
  if (num.startsWith('0')) num = '62' + num.slice(1);
  if (!num.startsWith('62')) num = '62' + num;
  return num + '@s.whatsapp.net';
}

/**
 * Start the WhatsApp bot connection
 */
export async function startBot(): Promise<void> {
  if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
    console.log('[WABot] Already connecting/connected, skipping...');
    return;
  }

  connectionStatus = 'connecting';
  qrDataUrl = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      browser: ['InfaqLy Bot', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60_000,
    });

    // Handle connection events
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Generate QR as data URL for frontend
        try {
          qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          connectionStatus = 'qr';
          console.log('[WABot] 📱 QR Code ready — scan di Admin Panel → Pengaturan');
        } catch (err) {
          console.error('[WABot] QR generation error:', err);
        }
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        console.log(`[WABot] Connection closed. Reason: ${reason}. Reconnect: ${shouldReconnect}`);
        connectionStatus = 'disconnected';
        qrDataUrl = null;
        sock = null;

        if (shouldReconnect && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`[WABot] Reconnecting... (attempt ${retryCount}/${MAX_RETRIES})`);
          setTimeout(() => startBot(), 3000);
        } else if (reason === DisconnectReason.loggedOut) {
          console.log('[WABot] Logged out — scan QR lagi di Admin Panel');
          retryCount = 0;
        }
      }

      if (connection === 'open') {
        connectionStatus = 'connected';
        qrDataUrl = null;
        retryCount = 0;
        const user = sock?.user;
        const phoneNum = user?.id?.split(':')[0] || '';
        console.log(`[WABot] ✅ Connected as ${user?.name || phoneNum}`);
        
        // Send confirmation message to self
        if (sock && phoneNum) {
          try {
            await sock.sendMessage(`${phoneNum}@s.whatsapp.net`, {
              text: `✅ *infaqLy Bot Terhubung!*\n\nWhatsApp Bot berhasil terhubung.\n📱 Nomor: ${phoneNum}\n⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\nBot ini akan mengirim:\n• Pesan selamat datang saat user registrasi\n• Konfirmasi donasi berhasil\n• Kode OTP reset password\n\n_infaqLy Bot — Self-hosted via Baileys_`
            });
            console.log(`[WABot] 📨 Confirmation message sent to self (${phoneNum})`);
          } catch (err) {
            console.warn('[WABot] Could not send self-test message:', err);
          }
        }
      }
    });

    // Save auth credentials when updated
    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    console.error('[WABot] Start error:', err);
    connectionStatus = 'disconnected';
  }
}

/**
 * Send a WhatsApp message via the bot
 */
export async function sendMessage(phone: string, message: string): Promise<{ success: boolean; message: string }> {
  if (!sock || connectionStatus !== 'connected') {
    return { success: false, message: 'WhatsApp bot belum terhubung. Scan QR di Pengaturan Admin.' };
  }

  try {
    const jid = toJid(phone);
    await sock.sendMessage(jid, { text: message });
    return { success: true, message: 'Pesan terkirim via WA Bot' };
  } catch (err: any) {
    console.error('[WABot] Send error:', err);
    return { success: false, message: 'Gagal kirim: ' + (err.message || 'unknown error') };
  }
}

/**
 * Send OTP message
 */
export async function sendOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  const msg = `🔐 *infaqLy — Reset Password*\n\nKode verifikasi Anda: *${otp}*\n\nBerlaku 5 menit. Jangan berikan ke siapapun.\n\n_Pesan otomatis dari infaqLy Bot_`;
  return sendMessage(phone, msg);
}

/**
 * Get bot status
 */
export function getStatus() {
  return {
    status: connectionStatus,
    qr: qrDataUrl,
    connected: connectionStatus === 'connected',
    phone: sock?.user?.id?.split(':')[0] || null,
    name: sock?.user?.name || null,
  };
}

/**
 * Disconnect and logout (clear session)
 */
export async function logout(): Promise<void> {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch {}
  sock = null;
  connectionStatus = 'disconnected';
  qrDataUrl = null;

  // Delete session files
  const fs = await import('fs');
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  console.log('[WABot] Logged out & session cleared');
}
