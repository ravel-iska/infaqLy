import { db } from '../config/database.js';
import { otpCodes } from '../db/schema.js';
import { eq, and, gt, desc } from 'drizzle-orm';

/**
 * Generate and store OTP with anti-spam protection (60s cooldown)
 */
export async function generateOtp(userId: string, type: 'reset_password' | 'verify_phone'): Promise<string> {
  // Check cooldown to prevent WA bombing / DOS
  const [lastOtp] = await db.select()
    .from(otpCodes)
    .where(and(eq(otpCodes.userId, userId), eq(otpCodes.type, type)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (lastOtp && lastOtp.createdAt.getTime() > Date.now() - 60000) {
    throw new Error('Mohon tunggu 60 detik sebelum meminta OTP baru.');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await db.insert(otpCodes).values({ userId, code, type, expiresAt });
  return code;
}

/**
 * Verify OTP
 */
export async function verifyOtp(userId: string, code: string, type: 'reset_password' | 'verify_phone', markUsed = true): Promise<boolean> {
  const [otp] = await db.select()
    .from(otpCodes)
    .where(and(
      eq(otpCodes.userId, userId),
      eq(otpCodes.code, code),
      eq(otpCodes.type, type),
      eq(otpCodes.used, false),
      gt(otpCodes.expiresAt, new Date())
    ))
    .limit(1);

  if (!otp) return false;

  // Mark as used if requested
  if (markUsed) {
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));
  }
  return true;
}
