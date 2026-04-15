import { pgTable, serial, varchar, text, bigint, integer, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const campaignCategoryEnum = pgEnum('campaign_category', ['infaq', 'wakaf']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'completed', 'archived']);

export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  category: campaignCategoryEnum('category').notNull().default('infaq'),
  target: bigint('target', { mode: 'number' }).notNull().default(0),
  collected: bigint('collected', { mode: 'number' }).notNull().default(0),
  donors: integer('donors').notNull().default(0),
  status: campaignStatusEnum('status').notNull().default('draft'),
  imageUrl: text('image_url'),
  description: text('description'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
