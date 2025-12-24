/**
 * Subscription filtering utilities
 * Provides functions for filtering subscriptions by category, status, and type
 *
 * Requirements: 9.2, 9.3
 */

import type { Subscription, Category, Status, SubscriptionType } from "@/db/schema";

/**
 * Filters subscriptions by category.
 *
 * @param subscriptions - Array of subscriptions to filter
 * @param category - The category to filter by
 * @returns Array of subscriptions matching the specified category
 */
export function filterByCategory(
  subscriptions: Subscription[],
  category: Category
): Subscription[] {
  return subscriptions.filter((sub) => sub.category === category);
}

/**
 * Filters subscriptions by status.
 *
 * @param subscriptions - Array of subscriptions to filter
 * @param status - The status to filter by
 * @returns Array of subscriptions matching the specified status
 */
export function filterByStatus(
  subscriptions: Subscription[],
  status: Status
): Subscription[] {
  return subscriptions.filter((sub) => sub.status === status);
}

/**
 * Filters subscriptions by subscription type.
 *
 * @param subscriptions - Array of subscriptions to filter
 * @param type - The subscription type to filter by (trial, voucher, subscription)
 * @returns Array of subscriptions matching the specified type
 */
export function filterBySubscriptionType(
  subscriptions: Subscription[],
  type: SubscriptionType
): Subscription[] {
  return subscriptions.filter((sub) => (sub as any).subscriptionType === type);
}
