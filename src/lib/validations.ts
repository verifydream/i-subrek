import { z } from "zod";

// Billing Cycle values
export const billingCycleValues = [
  "monthly",
  "yearly",
  "one-time",
  "trial",
] as const;

// Status values
export const statusValues = ["active", "cancelled", "expired"] as const;

// Category values
export const categoryValues = [
  "Entertainment",
  "Tools",
  "Work",
  "Utilities",
] as const;

// Currency values
export const currencyValues = ["IDR", "USD"] as const;

/**
 * Schema for creating a new subscription
 * Validates all required fields and optional fields with appropriate constraints
 */
export const createSubscriptionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  price: z.number().positive("Price must be positive"),
  currency: z.enum(currencyValues, {
    message: "Currency must be IDR or USD",
  }),
  billingCycle: z.enum(billingCycleValues, {
    message: "Billing cycle must be monthly, yearly, one-time, or trial",
  }),
  startDate: z.date({
    message: "Start date must be a valid date",
  }),
  reminderDays: z
    .number()
    .int("Reminder days must be a whole number")
    .min(0, "Reminder days cannot be negative")
    .max(30, "Reminder days cannot exceed 30")
    .default(3),
  paymentMethodProvider: z.string().optional(),
  paymentMethodNumber: z.string().optional(),
  accountEmail: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  accountPassword: z.string().optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  category: z.string().optional(),
});

/**
 * Schema for updating an existing subscription
 * All fields are optional, with status field added
 */
export const updateSubscriptionSchema = createSubscriptionSchema
  .partial()
  .extend({
    status: z
      .enum(statusValues, {
        message: "Status must be active, cancelled, or expired",
      })
      .optional(),
  });

// Type exports inferred from schemas
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

// Form input type (before Zod transforms/defaults are applied)
export type CreateSubscriptionFormInput = z.input<typeof createSubscriptionSchema>;
