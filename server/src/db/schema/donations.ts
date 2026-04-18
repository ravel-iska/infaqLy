import { pgTable, serial, varchar, text, bigint, boolean, timestamp, jsonb, uuid, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { campaigns } from './campaigns.js';

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'expired', 'failed']);

export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 50 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  campaignId: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  donorName: varchar('donor_name', { length: 100 }).notNull(),
  donorEmail: varchar('donor_email', { length: 255 }),
  donorPhone: varchar('donor_phone', { length: 20 }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  snapToken: varchar('snap_token', { length: 500 }),
  snapRedirectUrl: text('snap_redirect_url'),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  midtransResponse: jsonb('midtrans_response'),
  env: varchar('env', { length: 20 }).notNull().default('sandbox'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    campaignIdx: index('donations_campaign_id_idx').on(table.campaignId),
    userIdx: index('donations_user_id_idx').on(table.userId),
    statusIdx: index('donations_payment_status_idx').on(table.paymentStatus)
  };
});

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
