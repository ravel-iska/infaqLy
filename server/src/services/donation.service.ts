import { db } from '../config/database.js';
import { donations, campaigns } from '../db/schema.js';
import { eq, desc, ilike, and, sql, lt } from 'drizzle-orm';

/**
 * List all donations with filters
 */
export async function listDonations(filters?: { status?: string; search?: string; campaignId?: number }) {
  const conditions = [];
  if (filters?.status) conditions.push(eq(donations.paymentStatus, filters.status as any));
  if (filters?.campaignId) conditions.push(eq(donations.campaignId, filters.campaignId));
  if (filters?.search) conditions.push(ilike(donations.donorName, `%${filters.search}%`));

  return conditions.length > 0
    ? db.select().from(donations).where(and(...conditions)).orderBy(desc(donations.createdAt))
    : db.select().from(donations).orderBy(desc(donations.createdAt));
}

/**
 * Get donations for a specific user
 */
export async function getUserDonations(userId: string) {
  return db.select({
    id: donations.id,
    orderId: donations.orderId,
    campaignId: donations.campaignId,
    donorName: donations.donorName,
    amount: donations.amount,
    paymentMethod: donations.paymentMethod,
    paymentStatus: donations.paymentStatus,
    isAnonymous: donations.isAnonymous,
    snapToken: donations.snapToken,
    paidAt: donations.paidAt,
    createdAt: donations.createdAt,
  }).from(donations).where(eq(donations.userId, userId)).orderBy(desc(donations.createdAt));
}

/**
 * Create a new donation record (status: pending)
 */
export async function createDonation(data: {
  orderId: string; userId?: string; campaignId: number; donorName: string;
  donorEmail?: string; donorPhone?: string; amount: number;
  isAnonymous?: boolean; snapToken?: string; snapRedirectUrl?: string;
  message?: string | null;
}) {
  const [donation] = await db.insert(donations).values({
    orderId: data.orderId,
    userId: data.userId || null,
    campaignId: data.campaignId,
    donorName: data.donorName,
    donorEmail: data.donorEmail || null,
    donorPhone: data.donorPhone || null,
    amount: data.amount,
    isAnonymous: data.isAnonymous || false,
    snapToken: data.snapToken || null,
    snapRedirectUrl: data.snapRedirectUrl || null,
    paymentStatus: 'pending',
  }).returning();

  return donation;
}

/**
 * Update donation payment status by order ID
 */
export async function updateDonationStatus(orderId: string, status: string, paymentMethod?: string) {
  const updateData: Record<string, any> = { paymentStatus: status };
  if (status === 'success') updateData.paidAt = new Date();
  if (paymentMethod) updateData.paymentMethod = paymentMethod;

  const [updated] = await db.update(donations)
    .set(updateData)
    .where(eq(donations.orderId, orderId))
    .returning();

  return updated;
}

/**
 * Get donation stats for admin dashboard
 */
export async function getDonationStats() {
  const all = await db.select().from(donations);
  const success = all.filter(d => d.paymentStatus === 'success');
  const pending = all.filter(d => d.paymentStatus === 'pending');

  return {
    totalTransactions: all.length,
    successCount: success.length,
    pendingCount: pending.length,
    totalRevenue: success.reduce((s, d) => s + d.amount, 0),
  };
}

/**
 * Export donations as CSV string
 */
export async function exportDonationsCsv() {
  const all = await db.select().from(donations).orderBy(desc(donations.createdAt));
  
  const header = 'Order ID,Nama Donatur,Email,Program ID,Nominal,Metode,Status,Tanggal\n';
  const rows = all.map(d =>
    `${d.orderId},"${d.donorName}",${d.donorEmail || '-'},${d.campaignId},${d.amount},${d.paymentMethod || '-'},${d.paymentStatus},${d.createdAt.toISOString()}`
  ).join('\n');

  return '\uFEFF' + header + rows; // BOM for Excel compatibility
}

/**
 * Auto-expire pending donations older than 23 hours.
 * Called periodically by the server cron job.
 * Returns the number of expired donations.
 */
export async function expirePendingDonations(): Promise<number> {
  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000); // 23 hours ago

  const expired = await db.update(donations)
    .set({
      paymentStatus: 'expired',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(donations.paymentStatus, 'pending'),
        lt(donations.createdAt, cutoff)
      )
    )
    .returning({ id: donations.id, orderId: donations.orderId });

  return expired.length;
}

