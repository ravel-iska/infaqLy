import { db } from '../config/database.js';
import { withdrawals, campaigns, donations, settings } from '../db/schema.js';
import { desc, eq, and, sql } from 'drizzle-orm';

/**
 * Helper: Get current midtrans env from DB settings
 */
async function getCurrentEnv(): Promise<'sandbox' | 'production'> {
  const [row] = await db.select().from(settings).where(eq(settings.key, 'midtrans_env')).limit(1);
  const val = row?.value;
  return (val === 'production' || val === 'sandbox') ? val : 'sandbox';
}

/**
 * List all withdrawals (with campaign info)
 */
export async function listWithdrawals() {
  const allWithdrawals = await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  
  // Enrich with campaign title
  const enriched = await Promise.all(allWithdrawals.map(async (w) => {
    let campaignTitle = 'Global (Legacy)';
    if (w.campaignId) {
      const [camp] = await db.select({ title: campaigns.title }).from(campaigns).where(eq(campaigns.id, w.campaignId)).limit(1);
      if (camp) campaignTitle = camp.title;
    }
    return { ...w, campaignTitle };
  }));

  return enriched;
}

/**
 * Get balance summary per campaign (for crowdfunding withdrawal)
 * Only campaigns that have reached their target are eligible for withdrawal
 */
export async function getCampaignBalances() {
  const currentEnv = await getCurrentEnv();
  const allCampaigns = await db.select().from(campaigns);
  
  const balances = await Promise.all(allCampaigns.map(async (campaign) => {
    // Total successful donations for this campaign in current env
    const donationRows = await db.select({ amount: donations.amount })
      .from(donations)
      .where(and(
        eq(donations.campaignId, campaign.id),
        eq(donations.paymentStatus, 'success'),
        eq(donations.env, currentEnv),
      ));
    const totalDonated = donationRows.reduce((s, d) => s + d.amount, 0);

    // Total already withdrawn from this campaign
    const withdrawalRows = await db.select({ amount: withdrawals.amount })
      .from(withdrawals)
      .where(eq(withdrawals.campaignId, campaign.id));
    const totalWithdrawn = withdrawalRows.reduce((s, w) => s + w.amount, 0);

    const available = totalDonated - totalWithdrawn;
    const reachedTarget = campaign.collected >= campaign.target && campaign.target > 0;

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
  }));

  return balances;
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

  // Check if campaign has reached target
  if (campaign.collected < campaign.target) {
    throw new Error(`Penarikan ditolak: Kampanye "${campaign.title}" belum mencapai target (${campaign.collected}/${campaign.target}).`);
  }

  // Calculate available balance for this campaign
  const currentEnv = await getCurrentEnv();
  const donationRows = await db.select({ amount: donations.amount })
    .from(donations)
    .where(and(
      eq(donations.campaignId, data.campaignId),
      eq(donations.paymentStatus, 'success'),
      eq(donations.env, currentEnv),
    ));
  const totalDonated = donationRows.reduce((s, d) => s + d.amount, 0);

  const withdrawalRows = await db.select({ amount: withdrawals.amount })
    .from(withdrawals)
    .where(eq(withdrawals.campaignId, data.campaignId));
  const totalWithdrawn = withdrawalRows.reduce((s, w) => s + w.amount, 0);

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
    createdBy: data.createdBy,
  }).returning();

  return withdrawal;
}
