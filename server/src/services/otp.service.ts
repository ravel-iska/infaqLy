import { db } from '../config/database.js';
import { otpCodes } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Generate and store OTP
 */
export async function generateOtp(userId: string, type: 'reset_password' | 'verify_phone'): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await db.insert(otpCodes).values({ userId, code, type, expiresAt });
  return code;
}

/**
 * Verify OTP
 */
export async function verifyOtp(userId: string, code: string, type: 'reset_password' | 'verify_phone'): Promise<boolean> {
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

  // Mark as used
  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));
  return true;
}
