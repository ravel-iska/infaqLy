import express from 'express';
import { db } from '../config/database.js';
import { bugReports } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { settings } from '../db/schema.js';
import { sendWhatsApp } from '../services/whatsapp.service.js';
import { env } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// User submits a bug report
router.post('/', async (req, res) => {
  try {
    const { userName, userEmail, path, message } = req.body;
    
    if (!userName || !userEmail || !message) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const [newReport] = await db.insert(bugReports).values({
      userName,
      userEmail,
      path: path || '/',
      message,
    }).returning();

    // Send WhatsApp notification
    const alertMessage = `🚨 *Laporan Bug Baru [InfaqLy]*\n\n*Pelapor:* ${userName} (${userEmail})\n*URL:* ${path}\n*Keluhan:*\n${message}\n\nMohon segera diperiksa di Admin Panel.`;
    
    try {
      let adminPhone = '';
      const [row] = await db.select().from(settings).where(eq(settings.key, 'system_alert_phone')).limit(1);
      adminPhone = row?.value || '';
      if (!adminPhone) adminPhone = env.ADMIN_PHONE || '';

      if (adminPhone) {
        await sendWhatsApp(adminPhone, alertMessage);
      }
    } catch (e) {
      console.error('Failed to send WA report', e);
    }

    res.status(201).json({ success: true, message: 'Laporan berhasil dikirim. Terima kasih!' });
  } catch (error) {
    console.error('Error submitting bug:', error);
    res.status(500).json({ error: 'Gagal mengirim laporan' });
  }
});

// Admin gets bug reports
router.get('/', requireAdmin, async (req, res) => {
  try {
    const reports = await db.select().from(bugReports).orderBy(desc(bugReports.createdAt));
    res.json(reports);
  } catch (error) {
    console.error('Error fetching bugs:', error);
    res.status(500).json({ error: 'Gagal memuat laporan' });
  }
});

// Admin marks a report as read/resolved
router.patch('/:id/read', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.update(bugReports).set({ isRead: true }).where(eq(bugReports.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui status' });
  }
});

// Admin deletes a report
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(bugReports).where(eq(bugReports.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus laporan' });
  }
});

// ═══ Sentry Webhook — Forward errors to WhatsApp ═══
const recentSentryAlerts = new Map<string, number>();
const SENTRY_SPAM_COOLDOWN = 10 * 60 * 1000; // 10 menit cooldown untuk error yang persis sama

router.post('/sentry-webhook', async (req, res) => {
  try {
    // Basic Webhook Auth
    if (req.query.secret && req.query.secret !== env.BETTER_AUTH_SECRET) {
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }

    const payload = req.body;
    
    // Parse Sentry webhook payload
    const event = payload?.data?.event || {};
    const eventTitle = event?.title || payload?.message || 'Unknown Error';
    const eventUrl = event?.web_url || payload?.url || '-';
    const projectName = event?.project || payload?.project_name || 'infaqLy';
    const level = event?.level || payload?.level || 'error';
    const environment = event?.environment || 'production';
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    // Extract error location and stack trace
    const exception = event?.exception?.values?.[0] || {};
    const errorType = exception?.type || payload?.level || 'Error';
    const errorValue = exception?.value || eventTitle;
    
    let stackInfo = 'Tidak ada stack trace terdeteksi';
    let errorFile = '-';
    let errorLine = '-';
    
    // Sentry frames usually have the most recent call at the end of the array
    const frames = exception?.stacktrace?.frames || event?.stacktrace?.frames || [];
    if (frames && frames.length > 0) {
      // Mengambil maksimal 4 urutan proses terakhir untuk memudahkan navigasi eror (dari mana ke mana)
      const topFrames = frames.slice(-4).reverse();
      stackInfo = topFrames.map((f: any) => `  ↳ ${f.filename || f.module || 'Unknown'}:${f.lineno || '?'}`).join('\n');
      
      errorFile = topFrames[0].filename || '-';
      errorLine = String(topFrames[0].lineno || '-');
    }

    // 🛑 Anti-Spam System (Deduplikasi)
    const alertKey = `${projectName}:${errorType}:${errorFile}:${errorLine}`;
    const now = Date.now();
    const lastSeen = recentSentryAlerts.get(alertKey);
    
    if (lastSeen && (now - lastSeen) < SENTRY_SPAM_COOLDOWN) {
        console.log(`[Sentry→WA] 🚫 Spam Alert Prevented for: ${alertKey} (Cooldown: 10m)`);
        return res.status(200).json({ ok: true, spam_prevented: true });
    }
    
    // Set we've just seen this alert
    recentSentryAlerts.set(alertKey, now);

    // Format WhatsApp message
    const waMessage = [
      `🚨 *SENTRY ALERT — ${String(projectName).toUpperCase()}*`,
      ``,
      `⚠️ *Level:* ${String(level).toUpperCase()}`,
      `🌐 *Environment:* ${environment}`,
      `⏰ *Waktu:* ${timestamp}`,
      ``,
      `📛 *Error:* ${errorType}`,
      `📝 *Detail:* ${errorValue.substring(0, 300)}`,
      ``,
      `📂 *File Utama (Penyebab):*`,
      `${errorFile}:${errorLine}`,
      ``,
      `🔄 *Execution Path (Jejak Proses):*`,
      stackInfo,
      ``,
      `🔗 *Sentry Link:*`,
      eventUrl,
      ``,
      `_Laporan otomatis dari Sentry × infaqLy Bot_`,
    ].join('\n');

    // Send to admin WhatsApp
    let adminPhone = '';
    const [row] = await db.select().from(settings).where(eq(settings.key, 'system_alert_phone')).limit(1);
    adminPhone = row?.value || '';
    if (!adminPhone) adminPhone = env.ADMIN_PHONE || '';

    if (adminPhone) {
      await sendWhatsApp(adminPhone, waMessage);
      console.log(`[Sentry→WA] ✅ Alert sent to ${adminPhone}: ${errorType}`);
    } else {
      console.warn('[Sentry→WA] No admin phone configured');
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[Sentry→WA] Webhook error:', error);
    res.status(200).json({ ok: true }); // Always return 200 to Sentry
  }
});

export default router;
