/**
 * Campaign Service — connects to Express.js backend
 * Replaces mockCampaigns.js with real API calls to PostgreSQL
 */
import api from './api.js';

/** Ambil semua kampanye (admin — semua status) */
export async function getAllCampaigns(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  const data = await api.get(`/campaigns${qs ? '?' + qs : ''}`);
  return data.campaigns;
}

/** Ambil kampanye aktif saja (untuk user) */
export async function getActiveCampaigns() {
  const data = await api.get('/campaigns/active');
  return data.campaigns;
}

/** Ambil kampanye berdasarkan ID */
export async function getCampaignById(id) {
  const data = await api.get(`/campaigns/${id}`);
  return data.campaign;
}

/** Buat kampanye baru */
export async function createCampaign(campaignData) {
  const data = await api.upload('/campaigns', campaignData);
  return { success: true, campaign: data.campaign };
}

/** Update kampanye */
export async function updateCampaign(id, campaignData) {
  const data = await api.upload(`/campaigns/${id}`, campaignData, { method: 'PATCH' });
  return { success: true, campaign: data.campaign };
}

/** Hapus kampanye */
export async function deleteCampaign(id) {
  await api.delete(`/campaigns/${id}`);
  return { success: true };
}

/** Stats untuk dashboard */
export async function getCampaignStats() {
  return api.get('/campaigns/stats');
}

/** Hitung sisa hari */
export function daysRemaining(endDate) {
  if (!endDate) return 999;
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}
