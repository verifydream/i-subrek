/**
 * Subscription serialization utilities
 * Handles JSON serialization/deserialization with proper date handling
 *
 * Requirements: 2.7, 2.8
 */

import type { BillingCycle, Category, Status } from "@/db/schema";

/**
 * Subscription interface for serialization
 * Matches the database schema structure
 */
export interface SerializableSubscription {
  id: string;
  userId: string;
  name: string;
  price: string; // numeric stored as string in DB
  currency: string;
  billingCycle: BillingCycle;
  startDate: Date;
  nextPaymentDate: Date;
  reminderDays: number;
  paymentMethodProvider: string | null;
  paymentMethodNumber: string | null;
  accountEmail: string | null;
  accountPasswordEncrypted: string | null;
  notes: string | null;
  category: Category | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * JSON representation of a subscription
 * Dates are stored as ISO strings
 */
interface SubscriptionJSON {
  id: string;
  userId: string;
  name: string;
  price: string;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string; // ISO string
  nextPaymentDate: string; // ISO string
  reminderDays: number;
  paymentMethodProvider: string | null;
  paymentMethodNumber: string | null;
  accountEmail: string | null;
  accountPasswordEncrypted: string | null;
  notes: string | null;
  category: Category | null;
  status: Status;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Serializes a subscription object to JSON string.
 * Converts Date objects to ISO strings for proper JSON encoding.
 *
 * @param subscription - The subscription object to serialize
 * @returns JSON string representation
 */
export function serializeSubscription(
  subscription: SerializableSubscription
): string {
  const json: SubscriptionJSON = {
    ...subscription,
    startDate: subscription.startDate.toISOString(),
    nextPaymentDate: subscription.nextPaymentDate.toISOString(),
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  };

  return JSON.stringify(json);
}

/**
 * Deserializes a JSON string back to a subscription object.
 * Converts ISO date strings back to Date objects.
 *
 * @param json - The JSON string to deserialize
 * @returns The reconstructed subscription object
 */
export function deserializeSubscription(json: string): SerializableSubscription {
  const parsed: SubscriptionJSON = JSON.parse(json);

  return {
    ...parsed,
    startDate: new Date(parsed.startDate),
    nextPaymentDate: new Date(parsed.nextPaymentDate),
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
}
