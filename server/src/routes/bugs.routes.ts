import express from 'express';
import { db } from '../config/database.js';
import { bugReports } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { settings } from '../db/schema.js';
import { sendWhatsApp } from '../services/whatsapp.service.js';
import { env } from '../config/env.js';

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
router.get('/', async (req, res) => {
  try {
    const reports = await db.select().from(bugReports).orderBy(desc(bugReports.createdAt));
    res.json(reports);
  } catch (error) {
    console.error('Error fetching bugs:', error);
    res.status(500).json({ error: 'Gagal memuat laporan' });
  }
});

// Admin marks a report as read/resolved
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(bugReports).set({ isRead: true }).where(eq(bugReports.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui status' });
  }
});

// Admin deletes a report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(bugReports).where(eq(bugReports.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus laporan' });
  }
});

// ═══ Sentry Webhook — Forward errors to WhatsApp ═══
router.post('/sentry-webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Parse Sentry webhook payload
    const eventTitle = payload?.data?.event?.title || payload?.message || 'Unknown Error';
    const eventUrl = payload?.data?.event?.web_url || payload?.url || '-';
    const projectName = payload?.data?.event?.project || payload?.project_name || 'infaqLy';
    const level = payload?.data?.event?.level || payload?.level || 'error';
    const environment = payload?.data?.event?.environment || 'production';
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    // Extract error location if available
    const exception = payload?.data?.event?.exception?.values?.[0];
    const errorType = exception?.type || 'Error';
    const errorValue = exception?.value || eventTitle;
    const stackFrame = exception?.stacktrace?.frames?.slice(-1)?.[0];
    const errorFile = stackFrame?.filename || '-';
    const errorLine = stackFrame?.lineno || '-';

    // Format WhatsApp message
    const waMessage = [
      `🚨 *SENTRY ALERT — ${projectName.toUpperCase()}*`,
      ``,
      `⚠️ *Level:* ${level.toUpperCase()}`,
      `🌐 *Environment:* ${environment}`,
      `⏰ *Waktu:* ${timestamp}`,
      ``,
      `📛 *Error:* ${errorType}`,
      `📝 *Detail:* ${errorValue.substring(0, 300)}`,
      `📂 *File:* ${errorFile}:${errorLine}`,
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
