import { pgTable, serial, bigint, varchar, text, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'completed']);

export const withdrawals = pgTable('withdrawals', {
  id: serial('id').primaryKey(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  bankInfo: varchar('bank_info', { length: 255 }).notNull(),
  note: text('note'),
  evidenceUrl: text('evidence_url'),
  status: withdrawalStatusEnum('status').notNull().default('completed'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
