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
 * - One-time prices are counted as-is (full amount)
 * - Trial subscriptions are excluded (free)
 * - Voucher subscriptions are counted as-is (one-time value)
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
      const subscriptionType = (sub as any).subscriptionType;
      
      if (isNaN(price)) {
        return total;
      }

      // Trial subscriptions are free, don't count them
      if (subscriptionType === "trial") {
        return total;
      }

      // Voucher subscriptions - count full value
      if (subscriptionType === "voucher") {
        return total + price;
      }

      // Regular subscriptions - calculate based on billing cycle
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
 * - subscriptionType is 'trial' OR billingCycle is 'trial'
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
    const subscriptionType = (sub as any).subscriptionType;
    
    // Check if it's a trial (either by subscriptionType or billingCycle)
    if (subscriptionType !== "trial" && sub.billingCycle !== "trial") {
      return false;
    }

    const nextPaymentDate = new Date(sub.nextPaymentDate);
    nextPaymentDate.setHours(0, 0, 0, 0);

    const daysUntilEnd = differenceInDays(nextPaymentDate, today);

    // Include trials ending within threshold days (including today and past due)
    return daysUntilEnd >= 0 && daysUntilEnd <= thresholdDays;
  });
}
