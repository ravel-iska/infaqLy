import { pgTable, serial, integer, bigint, varchar, text, uuid, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { campaigns } from './campaigns.js';

export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'completed']);

export const withdrawals = pgTable('withdrawals', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  bankInfo: varchar('bank_info', { length: 255 }).notNull(),
  note: text('note'),
  evidenceUrl: text('evidence_url'),
  status: withdrawalStatusEnum('status').notNull().default('completed'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    campaignIdx: index('withdrawals_campaign_id_idx').on(table.campaignId)
  };
});

export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
