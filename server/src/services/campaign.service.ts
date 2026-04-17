import { db } from '../config/database.js';
import { campaigns, donations, settings } from '../db/schema.js';
import { eq, ilike, and, or, desc, sql } from 'drizzle-orm';

/**
 * Helper: Get current midtrans env from DB settings
 */
async function getCurrentEnv(): Promise<'sandbox' | 'production'> {
  const [row] = await db.select().from(settings).where(eq(settings.key, 'midtrans_env')).limit(1);
  const val = row?.value;
  return (val === 'production' || val === 'sandbox') ? val : 'sandbox';
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

/**
 * List campaigns with optional filters
 */
export async function listCampaigns(filters?: { status?: string; category?: string; search?: string }) {
  const conditions = [];
  if (filters?.status) conditions.push(eq(campaigns.status, filters.status as any));
  if (filters?.category) conditions.push(eq(campaigns.category, filters.category as any));
  if (filters?.search) conditions.push(ilike(campaigns.title, `%${filters.search}%`));

  const query = conditions.length > 0
    ? db.select().from(campaigns).where(and(...conditions)).orderBy(desc(campaigns.createdAt))
    : db.select().from(campaigns).orderBy(desc(campaigns.createdAt));

  return query;
}

/**
 * Get active campaigns only (for user-facing pages)
 */
export async function getActiveCampaigns() {
  return db.select().from(campaigns).where(eq(campaigns.status, 'active')).orderBy(desc(campaigns.createdAt));
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(id: number) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return campaign || null;
}

/**
 * Get recent donors for a campaign (public)
 */
export async function getRecentDonors(campaignId: number, limit = 5) {
  const currentEnv = await getCurrentEnv();
  return db.select({
    donorName: donations.donorName,
    amount: donations.amount,
    isAnonymous: donations.isAnonymous,
    createdAt: donations.createdAt,
  })
    .from(donations)
    .where(and(
      eq(donations.campaignId, campaignId),
      eq(donations.paymentStatus, 'success'),
      eq(donations.env, currentEnv),
    ))
    .orderBy(desc(donations.createdAt))
    .limit(limit);
}

/**
 * Get monthly donation stats for chart (last 6 months)
 */
export async function getMonthlyStats() {
  const currentEnv = await getCurrentEnv();
  const all = await db.select({
    amount: donations.amount,
    status: donations.paymentStatus,
    createdAt: donations.createdAt,
  }).from(donations).where(eq(donations.env, currentEnv));

  const months: Record<string, { total: number; count: number }> = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
    months[key] = { total: 0, count: 0 };
  }

  // Fill with real data
  for (const d of all) {
    const dt = new Date(d.createdAt);
    const key = dt.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
    if (months[key]) {
      months[key].total += d.amount;
      months[key].count += 1;
    }
  }

  return Object.entries(months).map(([month, data]) => ({
    month,
    total: data.total,
    count: data.count,
  }));
}

/**
 * Create campaign
 */
export async function createCampaign(data: {
  title: string; category?: string; target: number; status?: string;
  imageUrl?: string; description?: string; endDate?: string;
}) {
  const [campaign] = await db.insert(campaigns).values({
    title: data.title,
    slug: slugify(data.title),
    category: (data.category || 'infaq') as any,
    target: data.target,
    status: (data.status || 'draft') as any,
    imageUrl: data.imageUrl || null,
    description: data.description || '',
    endDate: data.endDate || null,
  }).returning();

  return campaign;
}

/**
 * Update campaign
 */
export async function updateCampaign(id: number, data: Partial<{
  title: string; category: string; target: number; status: string;
  imageUrl: string | null; description: string; endDate: string;
}>) {
  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.target !== undefined) updateData.target = data.target;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;

  const [updated] = await db.update(campaigns).set(updateData).where(eq(campaigns.id, id)).returning();
  if (!updated) throw new Error('Kampanye tidak ditemukan');
  return updated;
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: number) {
  const [deleted] = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
  if (!deleted) throw new Error('Kampanye tidak ditemukan');
  return deleted;
}

/**
 * Get campaign stats for dashboard
 */
export async function getCampaignStats() {
  const all = await db.select().from(campaigns);
  const active = all.filter(c => c.status === 'active');
  const totalCollected = all.reduce((s, c) => s + c.collected, 0);
  const totalDonors = all.reduce((s, c) => s + c.donors, 0);
  const totalTarget = active.reduce((s, c) => s + c.target, 0);

  return { total: all.length, active: active.length, totalCollected, totalDonors, totalTarget };
}
