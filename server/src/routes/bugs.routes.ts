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

export default router;
