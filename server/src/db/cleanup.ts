import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql, lt, eq, or, and, inArray } from 'drizzle-orm';
import * as schema from './schema.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infaqly',
});

const db = drizzle(pool, { schema });

async function cleanup() {
  const midtransEnv = process.env.MIDTRANS_ENV || 'sandbox';
  console.log(`\n🧹 Database Cleanup — Mode: ${midtransEnv.toUpperCase()}`);
  console.log('─'.repeat(50));

  // ═══════════════════════════════════════════════════
  // 1. Bersihkan OTP yang sudah kadaluarsa atau terpakai
  // ═══════════════════════════════════════════════════
  const deletedOtp = await db.delete(schema.otpCodes)
    .where(or(
      eq(schema.otpCodes.used, true),
      lt(schema.otpCodes.expiresAt, new Date()),
    ))
    .returning();
  console.log(`   🗑️  OTP usang dihapus: ${deletedOtp.length} record`);

  // ═══════════════════════════════════════════════════
  // 2. Bersihkan donasi sandbox (pending/failed/expired) yang sudah lebih dari 24 jam
  // ═══════════════════════════════════════════════════
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deletedDonations = await db.delete(schema.donations)
    .where(and(
      inArray(schema.donations.paymentStatus, ['pending', 'failed', 'expired']),
      lt(schema.donations.createdAt, cutoff24h),
    ))
    .returning();
  console.log(`   🗑️  Donasi usang (pending/failed/expired > 24jam) dihapus: ${deletedDonations.length} record`);

  // ═══════════════════════════════════════════════════
  // 3. Reset dana terkumpul sesuai environment
  // ═══════════════════════════════════════════════════
  if (midtransEnv === 'production') {
    // PRODUCTION: Set collected dan donors ke 0 (mulai bersih)
    const updated = await db.update(schema.campaigns)
      .set({ collected: 0, donors: 0, updatedAt: new Date() })
      .returning();
    console.log(`   💰 PRODUCTION — Dana terkumpul di-reset ke Rp 0 untuk ${updated.length} campaign`);
  } else {
    // SANDBOX: Reset collected ke 50.000.000 agar tidak penuh
    const updated = await db.update(schema.campaigns)
      .set({ collected: 50_000_000, donors: 25, updatedAt: new Date() })
      .returning();
    console.log(`   💰 SANDBOX — Dana terkumpul di-reset ke Rp 50.000.000 untuk ${updated.length} campaign`);
  }

  // ═══════════════════════════════════════════════════
  // 4. Bersihkan donasi test/dummy (order_id berawalan INF-TEST)
  // ═══════════════════════════════════════════════════
  const deletedTestDonations = await db.execute(
    sql`DELETE FROM donations WHERE order_id LIKE 'INF-TEST-%'`
  );
  console.log(`   🗑️  Donasi test (INF-TEST) dihapus`);

  console.log('─'.repeat(50));
  console.log('✨ Cleanup selesai!\n');

  await pool.end();
  process.exit(0);
}

cleanup().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
