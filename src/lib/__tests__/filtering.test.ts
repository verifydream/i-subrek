import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterByCategory, filterByStatus } from "../filtering";
import type { Subscription, BillingCycle, Status, Category } from "@/db/schema";

// Arbitrary for billing cycles
const billingCycleArb = fc.constantFrom<BillingCycle>(
  "monthly",
  "yearly",
  "one-time",
  "trial"
);

// Arbitrary for status
const statusArb = fc.constantFrom<Status>("active", "cancelled", "expired");

// Arbitrary for category (non-null for filtering tests)
const categoryArb = fc.constantFrom<Category>(
  "Entertainment",
  "Tools",
  "Work",
  "Utilities"
);

// Arbitrary for category including null
const categoryWithNullArb = fc.constantFrom<Category | null>(
  "Entertainment",
  "Tools",
  "Work",
  "Utilities",
  null
);

// Arbitrary for valid prices (positive numbers with 2 decimal places)
const priceArb = fc
  .float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })
  .map((n) => n.toFixed(2));

// Arbitrary for valid dates
const dateArb = fc.date({
  min: new Date("2020-01-01"),
  max: new Date("2030-12-31"),
});

// Arbitrary for a complete subscription object
const subscriptionArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  price: priceArb,
  currency: fc.constantFrom("IDR", "USD"),
  billingCycle: billingCycleArb,
  startDate: fc.string(),
  nextPaymentDate: fc.string(),
  reminderDays: fc.integer({ min: 0, max: 30 }),
  paymentMethodProvider: fc.option(fc.string(), { nil: null }),
  paymentMethodNumber: fc.option(fc.string(), { nil: null }),
  accountEmail: fc.option(fc.emailAddress(), { nil: null }),
  accountPasswordEncrypted: fc.option(fc.string(), { nil: null }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  category: categoryWithNullArb,
  status: statusArb,
  createdAt: dateArb,
  updatedAt: dateArb,
}) as fc.Arbitrary<Subscription>;


describe("Filtering Utilities", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 14: Category and Status Filtering**
   *
   * *For any* set of subscriptions and filter criteria (category or status),
   * filtering SHALL return only subscriptions where the specified field
   * matches the filter value exactly.
   *
   * **Validates: Requirements 9.2, 9.3**
   */
  describe("Property 14: Category and Status Filtering", () => {
    describe("filterByCategory", () => {
      it("should return only subscriptions matching the specified category", () => {
        fc.assert(
          fc.property(
            fc.array(subscriptionArb, { maxLength: 50 }),
            categoryArb,
            (subscriptions, targetCategory) => {
              const result = filterByCategory(subscriptions, targetCategory);

              // All results should have the target category
              result.forEach((sub) => {
                expect(sub.category).toBe(targetCategory);
              });

              // Result count should match manual filter
              const expected = subscriptions.filter(
                (sub) => sub.category === targetCategory
              );
              expect(result.length).toBe(expected.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("should return empty array when no subscriptions match category", () => {
        fc.assert(
          fc.property(
            fc.array(subscriptionArb, { maxLength: 20 }),
            categoryArb,
            (subscriptions, targetCategory) => {
              // Force all subscriptions to have a different category
              const otherCategories: Category[] = (
                ["Entertainment", "Tools", "Work", "Utilities"] as Category[]
              ).filter((c) => c !== targetCategory);

              const modifiedSubscriptions = subscriptions.map((sub, index) => ({
                ...sub,
                category: otherCategories[index % otherCategories.length],
              }));

              const result = filterByCategory(modifiedSubscriptions, targetCategory);
              expect(result).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("should return all subscriptions when all match the category", () => {
        fc.assert(
          fc.property(
            fc.array(subscriptionArb, { minLength: 1, maxLength: 20 }),
            categoryArb,
            (subscriptions, targetCategory) => {
              // Force all subscriptions to have the target category
              const modifiedSubscriptions = subscriptions.map((sub) => ({
                ...sub,
                category: targetCategory,
              }));

              const result = filterByCategory(modifiedSubscriptions, targetCategory);
              expect(result.length).toBe(modifiedSubscriptions.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("should return empty array for empty subscription list", () => {
        const categories: Category[] = ["Entertainment", "Tools", "Work", "Utilities"];
        categories.forEach((category) => {
          expect(filterByCategory([], category)).toHaveLength(0);
        });
      });
    });


    describe("filterByStatus", () => {
      it("should return only subscriptions matching the specified status", () => {
        fc.assert(
          fc.property(
            fc.array(subscriptionArb, { maxLength: 50 }),
            statusArb,
            (subscriptions, targetStatus) => {
              const result = filterByStatus(subscriptions, targetStatus);

              // All results should have the target status
              result.forEach((sub) => {
                expect(sub.status).toBe(targetStatus);
              });

              // Result count should match manual filter
              const expected = subscriptions.filter(
                (sub) => sub.status === targetStatus
              );
              expect(result.length).toBe(expected.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("should return empty array when no subscriptions match status", () => {
        fc.assert(
          fc.property(
            fc.array(subscriptionArb, { maxLength: 20 }),
            statusArb,
            (subscriptions, targetStatus) => {
              // Force all subscriptions to have a different status
              const otherStatuses: Status[] = (
                ["active", "cancelled", "expired"] as Status[]
              ).filter((s) => s !== targetStatus);

              const modifiedSubscriptions = subscriptions.map((sub, index) => ({
                ...sub,
                status: otherStatuses[index % otherStatuses.length],
              }));

              const result = filterByStatus(modifiedSubscriptions, targetStatus);
              expect(result).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("should return all subscriptions when all match the status", () => {
        fc.assert(
          fc.property(
            fc.array(subscriptionArb, { minLength: 1, maxLength: 20 }),
            statusArb,
            (subscriptions, targetStatus) => {
              // Force all subscriptions to have the target status
              const modifiedSubscriptions = subscriptions.map((sub) => ({
                ...sub,
                status: targetStatus,
              }));

              const result = filterByStatus(modifiedSubscriptions, targetStatus);
              expect(result.length).toBe(modifiedSubscriptions.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("should return empty array for empty subscription list", () => {
        const statuses: Status[] = ["active", "cancelled", "expired"];
        statuses.forEach((status) => {
          expect(filterByStatus([], status)).toHaveLength(0);
        });
      });
    });
  });
});
