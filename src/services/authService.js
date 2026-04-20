/**
 * Auth Service — connects to Express.js backend
 * Replaces mockAuth.js with real API calls to PostgreSQL
 */
import api from './api.js';

/**
 * Register user baru
 */
export async function register({ username, email, whatsapp, password }) {
  const data = await api.post('/auth/register', { username, email, whatsapp, password });
  return { success: true, user: data.user, token: data.token };
}

/**
 * Login user (username/WA + password)
 */
export async function login({ identifier, password }) {
  const data = await api.post('/auth/login', { identifier, password });
  return { success: true, user: data.user, token: data.token };
}

/**
 * Admin login
 */
export async function adminLogin({ username, password }) {
  const data = await api.post('/auth/admin/login', { username, password });
  return { success: true, user: data.user, token: data.token };
}


/**
 * Update profil user
 */
export async function updateProfile(updates) {
  const data = await api.patch('/users/me', updates);
  return { success: true, user: data.user };
}

/**
 * Upload avatar
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const data = await api.upload('/users/me/avatar', formData, { method: 'PATCH' });
  return { success: true, user: data.user };
}

/**
 * Delete avatar
 */
export async function deleteAvatar() {
  const data = await api.delete('/users/me/avatar');
  return { success: true, user: data.user };
}

/**
 * Ubah password
 */
export async function changePassword({ currentPassword, newPassword }) {
  await api.post('/users/me/password', { currentPassword, newPassword });
  return { success: true, message: 'Password berhasil diubah' };
}

