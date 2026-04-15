import { pgTable, serial, uuid, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const otpTypeEnum = pgEnum('otp_type', ['reset_password', 'verify_phone']);

export const otpCodes = pgTable('otp_codes', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 10 }).notNull(),
  type: otpTypeEnum('type').notNull(),
  used: boolean('used').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
