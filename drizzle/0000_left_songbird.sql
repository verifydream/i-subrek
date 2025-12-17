CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'yearly', 'one-time', 'trial');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('Entertainment', 'Tools', 'Work', 'Utilities');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"start_date" date NOT NULL,
	"next_payment_date" date NOT NULL,
	"reminder_days" integer DEFAULT 3 NOT NULL,
	"payment_method_provider" text,
	"payment_method_number" text,
	"account_email" text,
	"account_password_encrypted" text,
	"notes" text,
	"category" "category",
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
