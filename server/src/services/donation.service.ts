import { db } from '../config/database.js';
import { donations, campaigns, settings } from '../db/schema.js';
import { eq, desc, ilike, and, sql, lt } from 'drizzle-orm';

/**
 * Helper: Get current active environment from DB settings
 * Segregates Sandbox data by gateway (doku_sandbox vs sandbox) but groups production data
 */
async function getCurrentEnv(): Promise<string> {
  const [gwRow] = await db.select().from(settings).where(eq(settings.key, 'active_payment_gateway')).limit(1);
  const activeGateway = gwRow?.value || 'midtrans';

  const envKey = activeGateway === 'doku' ? 'doku_env' : 'midtrans_env';
  const [envRow] = await db.select().from(settings).where(eq(settings.key, envKey)).limit(1);
  return envRow?.value === 'sandbox' ? 'sandbox' : 'production';
}

/**
 * List all donations with filters — filtered by current env
 */
export async function listDonations(filters?: { status?: string; search?: string; campaignId?: number }) {
  const currentEnv = await getCurrentEnv();
  const conditions = [eq(donations.env, currentEnv)];
  if (filters?.status) conditions.push(eq(donations.paymentStatus, filters.status as any));
  if (filters?.campaignId) conditions.push(eq(donations.campaignId, filters.campaignId));
  if (filters?.search) conditions.push(ilike(donations.donorName, `%${filters.search}%`));

  return db.select().from(donations).where(and(...conditions)).orderBy(desc(donations.createdAt));
}

/**
 * Get donations for a specific user — filtered by current env
 */
export async function getUserDonations(userId: string) {
  const currentEnv = await getCurrentEnv();
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
  }).from(donations).where(and(eq(donations.userId, userId), eq(donations.env, currentEnv))).orderBy(desc(donations.createdAt));
}

/**
 * Get a specific donation by order ID
 */
export async function getDonationByOrderId(orderId: string) {
  const rows = await db.select().from(donations).where(eq(donations.orderId, orderId)).limit(1);
  return rows[0] || null;
}

/**
 * Create a new donation record (status: pending)
 * Automatically stamps current midtrans env
 */
export async function createDonation(data: {
  orderId: string; userId?: string; campaignId: number; donorName: string;
  donorEmail?: string; donorPhone?: string; amount: number;
  isAnonymous?: boolean; snapToken?: string; snapRedirectUrl?: string;
  message?: string | null;
}) {
  const currentEnv = await getCurrentEnv();
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
    env: currentEnv,
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
 * Get donation stats for admin dashboard — filtered by current env
 */
export async function getDonationStats() {
  const currentEnv = await getCurrentEnv();
  const all = await db.select().from(donations).where(eq(donations.env, currentEnv));
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
 * Export donations as CSV string — filtered by current env
 */
export async function exportDonationsCsv() {
  const currentEnv = await getCurrentEnv();
  const all = await db.select().from(donations).where(eq(donations.env, currentEnv)).orderBy(desc(donations.createdAt));
  
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
