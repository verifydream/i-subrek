ALTER TABLE "subscriptions" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "account_login_method" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "url" text;--> statement-breakpoint
DROP TYPE "public"."category";