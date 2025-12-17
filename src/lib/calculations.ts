/**
 * Dashboard calculation utilities
 * Provides functions for calculating spending summaries and filtering subscriptions
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import { differenceInDays } from "date-fns";
import type { Subscription, BillingCycle } from "@/db/schema";

/**
 * Calculates the total monthly spending from a list of subscriptions.
 * 
 * - Monthly prices are counted as-is
 * - Yearly prices are divided by 12
 * - One-time and trial prices are counted as-is (full amount)
 *
 * Only active subscriptions are included in the calculation.
 *
 * @param subscriptions - Array of subscriptions to calculate spending from
 * @returns Total monthly spending as a number
 */
export function calculateTotalMonthlySpending(
  subscriptions: Subscription[]
): number {
  return subscriptions
    .filter((sub) => sub.status === "active")
    .reduce((total, sub) => {
      const price = parseFloat(sub.price);
      
      if (isNaN(price)) {
        return total;
      }

      switch (sub.billingCycle as BillingCycle) {
        case "monthly":
          return total + price;
        case "yearly":
          return total + price / 12;
        case "one-time":
        case "trial":
          return total + price;
        default:
          return total;
      }
    }, 0);
}

/**
 * Counts the number of active subscriptions.
 *
 * @param subscriptions - Array of subscriptions to count
 * @returns Number of subscriptions with status 'active'
 */
export function countActiveSubscriptions(subscriptions: Subscription[]): number {
  return subscriptions.filter((sub) => sub.status === "active").length;
}


/**
 * Gets subscriptions that are trials ending soon.
 * 
 * Returns subscriptions where:
 * - billingCycle is 'trial'
 * - nextPaymentDate is within thresholdDays from current date
 *
 * @param subscriptions - Array of subscriptions to filter
 * @param thresholdDays - Number of days to consider as "ending soon"
 * @returns Array of trial subscriptions ending within the threshold
 */
export function getTrialsEndingSoon(
  subscriptions: Subscription[],
  thresholdDays: number
): Subscription[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return subscriptions.filter((sub) => {
    if (sub.billingCycle !== "trial") {
      return false;
    }

    const nextPaymentDate = new Date(sub.nextPaymentDate);
    nextPaymentDate.setHours(0, 0, 0, 0);

    const daysUntilEnd = differenceInDays(nextPaymentDate, today);

    // Include trials ending within threshold days (including today and past due)
    return daysUntilEnd >= 0 && daysUntilEnd <= thresholdDays;
  });
}
