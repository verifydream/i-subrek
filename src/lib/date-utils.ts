/**
 * Date calculation utilities for subscription payment dates
 * Uses date-fns for reliable date manipulation
 *
 * Requirements: 2.2, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { addMonths, addYears, differenceInDays } from "date-fns";
import type { BillingCycle } from "@/db/schema";

/**
 * Calculates the next payment date based on start date and billing cycle.
 *
 * - Monthly: one month from start date
 * - Yearly: one year from start date
 * - One-time: equals start date
 * - Trial: equals start date (trial end)
 *
 * @param startDate - The subscription start date
 * @param billingCycle - The billing cycle type
 * @returns The calculated next payment date
 */
export function calculateNextPaymentDate(
  startDate: Date,
  billingCycle: BillingCycle
): Date {
  switch (billingCycle) {
    case "monthly":
      return addMonths(startDate, 1);
    case "yearly":
      return addYears(startDate, 1);
    case "one-time":
    case "trial":
      return startDate;
    default:
      // Exhaustive check
      const _exhaustive: never = billingCycle;
      throw new Error(`Unknown billing cycle: ${_exhaustive}`);
  }
}

/**
 * Checks if a payment date is within the reminder threshold.
 *
 * @param nextPaymentDate - The next payment date
 * @param reminderDays - Number of days before payment to trigger reminder
 * @returns True if the payment is within reminderDays from today
 */
export function isWithinReminderDays(
  nextPaymentDate: Date,
  reminderDays: number
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paymentDate = new Date(nextPaymentDate);
  paymentDate.setHours(0, 0, 0, 0);

  const daysUntilPayment = differenceInDays(paymentDate, today);

  return daysUntilPayment >= 0 && daysUntilPayment <= reminderDays;
}

/**
 * Advances the payment date to the next cycle.
 * Used when current date passes the next payment date.
 *
 * @param currentNextDate - The current next payment date
 * @param billingCycle - The billing cycle type
 * @returns The advanced payment date
 */
export function advancePaymentDate(
  currentNextDate: Date,
  billingCycle: BillingCycle
): Date {
  switch (billingCycle) {
    case "monthly":
      return addMonths(currentNextDate, 1);
    case "yearly":
      return addYears(currentNextDate, 1);
    case "one-time":
    case "trial":
      // One-time and trial don't advance
      return currentNextDate;
    default:
      const _exhaustive: never = billingCycle;
      throw new Error(`Unknown billing cycle: ${_exhaustive}`);
  }
}
