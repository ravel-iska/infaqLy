import { db } from '../config/database.js';
import { withdrawals, campaigns, donations, settings } from '../db/schema.js';
import { desc, eq, and, sql } from 'drizzle-orm';
import { getCurrentEnv } from '../utils/envHelper.js';

/**
 * List all withdrawals (with campaign info)
 */
export async function listWithdrawals() {
  const currentEnv = await getCurrentEnv();
  const allWithdrawals = await db.select().from(withdrawals)
    .where(eq(withdrawals.env, currentEnv as any))
    .orderBy(desc(withdrawals.createdAt));
  
  // Get all campaign titles in one query
  const allCampaigns = await db.select({ id: campaigns.id, title: campaigns.title }).from(campaigns);
  const campMap = new Map(allCampaigns.map(c => [c.id, c.title]));

  return allWithdrawals.map(w => ({
    ...w,
    campaignTitle: (w.campaignId && campMap.get(w.campaignId)) || 'Global (Legacy)',
  }));
}

/**
 * Get balance summary per campaign — uses aggregated queries (no N+1)
 */
export async function getCampaignBalances() {
  const currentEnv = await getCurrentEnv();
  const allCampaigns = await db.select().from(campaigns);

  // Aggregated donations per campaign in ONE query
  const donationAgg = await db.select({
    campaignId: donations.campaignId,
    total: sql<number>`COALESCE(SUM(${donations.amount}), 0)`.as('total'),
  })
    .from(donations)
    .where(and(eq(donations.paymentStatus, 'success'), eq(donations.env, currentEnv as any)))
    .groupBy(donations.campaignId);
  const donMap = new Map(donationAgg.map(d => [d.campaignId, Number(d.total)]));

  // Aggregated withdrawals per campaign in ONE query
  const withdrawalAgg = await db.select({
    campaignId: withdrawals.campaignId,
    total: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)`.as('total'),
  })
    .from(withdrawals)
    .where(eq(withdrawals.env, currentEnv as any))
    .groupBy(withdrawals.campaignId);
  const wdMap = new Map(withdrawalAgg.map(w => [w.campaignId!, Number(w.total)]));

  return allCampaigns.map((campaign) => {
    const totalDonated = donMap.get(campaign.id) || 0;
    const totalWithdrawn = wdMap.get(campaign.id) || 0;
    const available = totalDonated - totalWithdrawn;
    const reachedTarget = totalDonated >= campaign.target && campaign.target > 0;

    return {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      target: campaign.target,
      collected: campaign.collected,
      totalDonated,
      totalWithdrawn,
      available,
      reachedTarget,
      eligible: reachedTarget && available > 0,
    };
  });
}

/**
 * Get global balance (for summary cards)
 */
export async function getBalance() {
  const balances = await getCampaignBalances();
  
  const totalSettled = balances.reduce((s, b) => s + b.totalDonated, 0);
  const totalWithdrawn = balances.reduce((s, b) => s + b.totalWithdrawn, 0);

  return {
    settled: totalSettled,
    withdrawn: totalWithdrawn,
    available: totalSettled - totalWithdrawn,
  };
}

/**
 * Create a new withdrawal (crowdfunding: per-campaign, must reach target)
 */
export async function createWithdrawal(data: {
  amount: number; bankInfo: string; note?: string; evidenceUrl?: string; createdBy: string;
  campaignId: number;
}) {
  if (data.amount <= 0) throw new Error('Nominal penarikan tidak valid.');

  // Validate campaign exists
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, data.campaignId)).limit(1);
  if (!campaign) throw new Error('Kampanye tidak ditemukan.');

  // Calculate available balance for this campaign from actual donations
  const currentEnv = await getCurrentEnv();
  const [donAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${donations.amount}), 0)`.as('total'),
  })
    .from(donations)
    .where(and(
      eq(donations.campaignId, data.campaignId),
      eq(donations.paymentStatus, 'success'),
      eq(donations.env, currentEnv as any),
    ));
  const totalDonated = Number(donAgg?.total ?? 0);

  // Check if campaign has reached target based on actual donations
  if (totalDonated < campaign.target) {
    throw new Error(`Penarikan ditolak: Kampanye "${campaign.title}" belum mencapai target (${totalDonated}/${campaign.target}).`);
  }

  const [wdAgg] = await db.select({
    total: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)`.as('total'),
  })
    .from(withdrawals)
    .where(and(eq(withdrawals.campaignId, data.campaignId), eq(withdrawals.env, currentEnv as any)));
  const totalWithdrawn = Number(wdAgg?.total ?? 0);

  const available = totalDonated - totalWithdrawn;
  if (data.amount > available) {
    throw new Error(`Penarikan ditolak: Saldo kampanye tidak mencukupi (Tersedia: Rp ${available.toLocaleString('id-ID')}).`);
  }

  const [withdrawal] = await db.insert(withdrawals).values({
    campaignId: data.campaignId,
    amount: data.amount,
    bankInfo: data.bankInfo,
    note: data.note || null,
    evidenceUrl: data.evidenceUrl || null,
    status: 'completed',
    env: currentEnv as any,
    createdBy: data.createdBy,
  }).returning();

  return withdrawal;
}
