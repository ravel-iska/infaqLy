import { db } from '../config/database.js';
import { withdrawals, campaigns } from '../db/schema.js';
import { desc, sql } from 'drizzle-orm';

/**
 * List all withdrawals
 */
export async function listWithdrawals() {
  return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
}

/**
 * Create a new withdrawal
 */
export async function createWithdrawal(data: {
  amount: number; bankInfo: string; note?: string; evidenceUrl?: string; createdBy: string;
}) {
  const balance = await getBalance();
  if (data.amount <= 0) throw new Error('Nominal penarikan tidak valid.');
  if (data.amount > balance.available) {
    throw new Error(`Penarikan ditolak: Saldo platform tidak mencukupi (Tersedia: ${balance.available})`);
  }

  const [withdrawal] = await db.insert(withdrawals).values({
    amount: data.amount,
    bankInfo: data.bankInfo,
    note: data.note || null,
    evidenceUrl: data.evidenceUrl || null,
    status: 'completed',
    createdBy: data.createdBy,
  }).returning();

  return withdrawal;
}

/**
 * Get balance summary
 */
export async function getBalance() {
  // Total collected from all campaigns
  const campaignRows = await db.select({ collected: campaigns.collected }).from(campaigns);
  const totalCollected = campaignRows.reduce((s, c) => s + c.collected, 0);

  // Total withdrawn
  const withdrawalRows = await db.select({ amount: withdrawals.amount }).from(withdrawals);
  const totalWithdrawn = withdrawalRows.reduce((s, w) => s + w.amount, 0);

  return {
    settled: totalCollected,
    withdrawn: totalWithdrawn,
    available: totalCollected - totalWithdrawn,
  };
}
