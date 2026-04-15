/**
 * Fonnte WhatsApp API Service
 * 
 * All WhatsApp messages are now sent via the backend API.
 * Token is stored in PostgreSQL (settings table), NOT localStorage.
 */

import api from '@/services/api';

/**
 * Kirim pesan WhatsApp via backend API
 */
export async function sendWhatsApp(target, message) {
  try {
    const result = await api.post('/whatsapp/send', { target, message });
    return result;
  } catch (err) {
    return { success: false, message: err.message || 'Gagal mengirim pesan WhatsApp' };
  }
}

/**
 * Test koneksi Fonnte (kirim pesan test via backend)
 */
export async function testFonnteConnection(targetPhone) {
  try {
    const result = await api.post('/whatsapp/test', { target: targetPhone });
    return result;
  } catch (err) {
    return { success: false, message: err.message || 'Gagal test koneksi' };
  }
}

/**
 * Kirim notifikasi donasi berhasil (via backend)
 */
export async function sendDonationNotification({ donorName, donorPhone, program, amount, orderId }) {
  return sendWhatsApp(donorPhone, `🕌 *infaqLy — Konfirmasi Donasi*\n\nAssalamu'alaikum ${donorName},\nTerima kasih atas donasi Anda! ❤️\n\n📋 *Detail:*\n• Program: ${program}\n• Nominal: Rp ${new Intl.NumberFormat('id-ID').format(amount)}\n• Order ID: ${orderId}\n• Status: ✅ Berhasil\n\n_Pesan otomatis dari infaqLy_`);
}
