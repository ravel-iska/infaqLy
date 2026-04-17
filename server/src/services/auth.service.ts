import { db } from '../config/database.js';
import { users, sessions } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const USER_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
const ADMIN_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days

/**
 * Register a new user
 */
export async function registerUser(data: { username: string; email: string; whatsapp: string; password: string }) {
  // Check duplicates
  const existing = await db.select({ id: users.id, username: users.username, email: users.email, whatsapp: users.whatsapp })
    .from(users)
    .where(or(
      eq(users.username, data.username.toLowerCase()),
      eq(users.email, data.email.toLowerCase()),
      eq(users.whatsapp, data.whatsapp)
    ))
    .limit(1);

  if (existing.length > 0) {
    const dup = existing[0];
    if (dup.username === data.username.toLowerCase()) throw new Error('Username sudah terdaftar. Silakan login dengan akun yang sudah ada.');
    if (dup.email === data.email.toLowerCase()) throw new Error('Email sudah terdaftar. Silakan login dengan akun yang sudah ada.');
    if (dup.whatsapp === data.whatsapp) throw new Error('Nomor WhatsApp sudah terdaftar. Silakan login dengan akun yang sudah ada.');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const [user] = await db.insert(users).values({
    username: data.username.toLowerCase(),
    email: data.email.toLowerCase(),
    whatsapp: data.whatsapp,
    passwordHash,
    role: 'user',
  }).returning();

  const token = await createSession(user.id, 'user');
  return { user: sanitizeUser(user), token };
}

/**
 * Login with username/whatsapp + password
 */
export async function loginUser(identifier: string, password: string) {
  const [user] = await db.select()
    .from(users)
    .where(or(
      eq(users.username, identifier.toLowerCase()),
      eq(users.whatsapp, identifier)
    ))
    .limit(1);

  if (!user) throw new Error('Akun tidak ditemukan');
  if (user.role === 'admin') throw new Error('Gunakan halaman login admin untuk akun admin');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Password salah');

  const token = await createSession(user.id, 'user');
  return { user: sanitizeUser(user), token };
}

/**
 * Admin login (separate from user login)
 */
export async function loginAdmin(username: string, password: string) {
  const [user] = await db.select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);

  if (!user || user.role !== 'admin') throw new Error('Username atau password admin salah');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Username atau password admin salah');

  const token = await createSession(user.id, 'admin');
  return { user: sanitizeUser(user), token };
}

/**
 * Logout — delete session
 */
export async function logoutUser(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Admin re-login via PIN — creates a new 30-day session without password
 * Used when session expires and admin has set a PIN for quick re-authentication
 */
export async function loginAdminBypass(userId: string) {
  const token = await createSession(userId, 'admin');
  return { token };
}

/**
 * Create a new session
 */
async function createSession(userId: string, role: 'user' | 'admin' = 'user'): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex');
  const duration = role === 'admin' ? ADMIN_SESSION_DURATION_MS : USER_SESSION_DURATION_MS;
  const expiresAt = new Date(Date.now() + duration);

  await db.insert(sessions).values({ userId, token, expiresAt });
  return token;
}

/**
 * Remove sensitive fields from user object
 */
export function sanitizeUser(user: typeof users.$inferSelect) {
  // Only remove truly sensitive data (password hash)
  const { passwordHash, ...safe } = user;
  return safe;
}
