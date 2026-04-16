ALTER TABLE "campaigns" ALTER COLUMN "category" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "category" SET DEFAULT 'infaq';--> statement-breakpoint
DROP TYPE "public"."campaign_category";