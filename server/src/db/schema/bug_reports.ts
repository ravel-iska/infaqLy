import { pgTable, text, timestamp, varchar, uuid, boolean } from "drizzle-orm/pg-core";

export const bugReports = pgTable("bug_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  path: varchar("path", { length: 500 }).notNull().default('/'), // Current URL being reported
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
