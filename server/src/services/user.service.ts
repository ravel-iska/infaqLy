import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { eq, ne, or, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sanitizeUser } from './auth.service.js';

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ? sanitizeUser(user) : null;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, data: { username?: string; email?: string; whatsapp?: string; avatarUrl?: string | null }) {
  // Check duplicates (exclude self)
  if (data.username || data.email || data.whatsapp) {
    const conditions = [];
    if (data.username) conditions.push(eq(users.username, data.username.toLowerCase()));
    if (data.email) conditions.push(eq(users.email, data.email.toLowerCase()));
    if (data.whatsapp) conditions.push(eq(users.whatsapp, data.whatsapp));

    if (conditions.length > 0) {
      const existing = await db.select({ id: users.id, username: users.username, email: users.email, whatsapp: users.whatsapp })
        .from(users)
        .where(and(ne(users.id, userId), or(...conditions)))
        .limit(1);

      if (existing.length > 0) {
        const dup = existing[0];
        if (data.username && dup.username === data.username.toLowerCase()) throw new Error('Username sudah digunakan');
        if (data.email && dup.email === data.email.toLowerCase()) throw new Error('Email sudah terdaftar');
        if (data.whatsapp && dup.whatsapp === data.whatsapp) throw new Error('Nomor WhatsApp sudah terdaftar');
      }
    }
  }

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.username) updateData.username = data.username.toLowerCase();
  if (data.email) updateData.email = data.email.toLowerCase();
  if (data.whatsapp) updateData.whatsapp = data.whatsapp;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

  const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
  return sanitizeUser(updated);
}

/**
 * Change password
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User tidak ditemukan');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error('Password lama salah');

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) throw new Error('Password baru tidak boleh sama dengan password sebelumnya');

  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, userId));
}

/**
 * Find account by email or whatsapp (for password reset)
 */
export async function findAccount(identifier: string) {
  const [user] = await db.select({ id: users.id, email: users.email, whatsapp: users.whatsapp })
    .from(users)
    .where(or(eq(users.email, identifier.toLowerCase()), eq(users.whatsapp, identifier)))
    .limit(1);

  if (!user) throw new Error('Akun tidak ditemukan');
  return user;
}

/**
 * Reset password (after OTP verified)
 */
export async function resetPassword(userId: string, newPassword: string) {
  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User tidak ditemukan');

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) throw new Error('Password baru tidak boleh sama dengan password sebelumnya');

  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, userId));
}
