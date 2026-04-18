import { pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const dailyVisitors = pgTable('daily_visitors', {
  date: varchar('date', { length: 10 }).primaryKey(), // Format YYYY-MM-DD
  count: integer('count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
