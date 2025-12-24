import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  integer,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";

// Enums
export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "yearly",
  "one-time",
  "trial",
]);

export const statusEnum = pgEnum("status", ["active", "cancelled", "expired"]);

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Clerk user ID
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IDR"),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  startDate: date("start_date").notNull(),
  nextPaymentDate: date("next_payment_date").notNull(),
  reminderDays: integer("reminder_days").notNull().default(3),
  paymentMethodProvider: text("payment_method_provider"),
  paymentMethodNumber: text("payment_method_number"), // Masked: "**** 1234"
  accountEmail: text("account_email"),
  accountLoginMethod: text("account_login_method"), // google, email, github, other
  accountPasswordEncrypted: text("account_password_encrypted"),
  notes: text("notes"),
  category: text("category"), // Changed from enum to text for custom categories
  url: text("url"), // Subscription URL (optional)
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TypeScript types inferred from schema
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// Billing Cycle Type
export type BillingCycle = "monthly" | "yearly" | "one-time" | "trial";

// Status Type
export type Status = "active" | "cancelled" | "expired";

// Category Type (now supports custom categories)
export type Category = string;
