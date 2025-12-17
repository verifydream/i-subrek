import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  calculateTotalMonthlySpending,
  countActiveSubscriptions,
  getTrialsEndingSoon,
} from "../calculations";
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

// Arbitrary for category
const categoryArb = fc.constantFrom<Category | null>(
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
  startDate: fc.string(), // Will be overwritten
  nextPaymentDate: fc.string(), // Will be overwritten
  reminderDays: fc.integer({ min: 0, max: 30 }),
  paymentMethodProvider: fc.option(fc.string(), { nil: null }),
  paymentMethodNumber: fc.option(fc.string(), { nil: null }),
  accountEmail: fc.option(fc.emailAddress(), { nil: null }),
  accountPasswordEncrypted: fc.option(fc.string(), { nil: null }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  category: categoryArb,
  status: statusArb,
  createdAt: dateArb,
  updatedAt: dateArb,
}) as fc.Arbitrary<Subscription>;


describe("Dashboard Calculation Utilities", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 9: Total Monthly Spending Calculation**
   *
   * *For any* set of active subscriptions, the total monthly spending calculation
   * SHALL equal the sum of: monthly prices as-is, yearly prices divided by 12,
   * and one-time/trial prices as-is.
   *
   * **Validates: Requirements 5.1**
   */
  describe("Property 9: Total Monthly Spending Calculation", () => {
    it("should calculate total monthly spending correctly for active subscriptions", () => {
      fc.assert(
        fc.property(fc.array(subscriptionArb, { maxLength: 20 }), (subscriptions) => {
          const result = calculateTotalMonthlySpending(subscriptions);

          // Calculate expected value manually
          const expected = subscriptions
            .filter((sub) => sub.status === "active")
            .reduce((total, sub) => {
              const price = parseFloat(sub.price);
              if (isNaN(price)) return total;

              switch (sub.billingCycle) {
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

          // Use approximate equality due to floating point
          expect(result).toBeCloseTo(expected, 2);
        }),
        { numRuns: 100 }
      );
    });

    it("should return 0 for empty subscription list", () => {
      expect(calculateTotalMonthlySpending([])).toBe(0);
    });

    it("should exclude non-active subscriptions", () => {
      fc.assert(
        fc.property(
          fc.array(subscriptionArb, { maxLength: 20 }),
          (subscriptions) => {
            // Force all subscriptions to be non-active
            const nonActiveSubscriptions = subscriptions.map((sub) => ({
              ...sub,
              status: fc.sample(fc.constantFrom<Status>("cancelled", "expired"))[0],
            }));

            const result = calculateTotalMonthlySpending(nonActiveSubscriptions);
            expect(result).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: isubrek-subscription-tracker, Property 10: Active Subscription Count**
   *
   * *For any* set of subscriptions, the active count SHALL equal the number
   * of subscriptions where status equals 'active'.
   *
   * **Validates: Requirements 5.2**
   */
  describe("Property 10: Active Subscription Count", () => {
    it("should count only active subscriptions", () => {
      fc.assert(
        fc.property(fc.array(subscriptionArb, { maxLength: 50 }), (subscriptions) => {
          const result = countActiveSubscriptions(subscriptions);

          // Calculate expected count manually
          const expected = subscriptions.filter((sub) => sub.status === "active").length;

          expect(result).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it("should return 0 for empty subscription list", () => {
      expect(countActiveSubscriptions([])).toBe(0);
    });

    it("should return 0 when no subscriptions are active", () => {
      fc.assert(
        fc.property(
          fc.array(subscriptionArb, { minLength: 1, maxLength: 20 }),
          (subscriptions) => {
            // Force all subscriptions to be non-active
            const nonActiveSubscriptions = subscriptions.map((sub) => ({
              ...sub,
              status: fc.sample(fc.constantFrom<Status>("cancelled", "expired"))[0],
            }));

            const result = countActiveSubscriptions(nonActiveSubscriptions);
            expect(result).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should count all when all subscriptions are active", () => {
      fc.assert(
        fc.property(
          fc.array(subscriptionArb, { minLength: 1, maxLength: 20 }),
          (subscriptions) => {
            // Force all subscriptions to be active
            const activeSubscriptions = subscriptions.map((sub) => ({
              ...sub,
              status: "active" as Status,
            }));

            const result = countActiveSubscriptions(activeSubscriptions);
            expect(result).toBe(activeSubscriptions.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: isubrek-subscription-tracker, Property 11: Trials Ending Soon Filter**
   *
   * *For any* set of subscriptions and a threshold number of days, the trials
   * ending soon filter SHALL return only subscriptions where billingCycle is 'trial'
   * AND nextPaymentDate is within the threshold days from current date.
   *
   * **Validates: Requirements 5.3**
   */
  describe("Property 11: Trials Ending Soon Filter", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return only trials within threshold days", () => {
      fc.assert(
        fc.property(
          fc.array(subscriptionArb, { maxLength: 20 }),
          fc.integer({ min: 1, max: 30 }),
          (subscriptions, thresholdDays) => {
            const today = new Date("2024-06-15");
            vi.setSystemTime(today);

            // Create subscriptions with controlled nextPaymentDate
            const testSubscriptions = subscriptions.map((sub, index) => {
              const nextPaymentDate = new Date(today);
              // Alternate between within threshold and outside
              if (index % 2 === 0) {
                nextPaymentDate.setDate(today.getDate() + (index % (thresholdDays + 1)));
              } else {
                nextPaymentDate.setDate(today.getDate() + thresholdDays + index + 1);
              }
              return {
                ...sub,
                nextPaymentDate: nextPaymentDate.toISOString().split("T")[0],
              };
            });

            const result = getTrialsEndingSoon(testSubscriptions, thresholdDays);

            // Verify all results are trials
            result.forEach((sub) => {
              expect(sub.billingCycle).toBe("trial");
            });

            // Verify all results are within threshold
            result.forEach((sub) => {
              const nextPaymentDate = new Date(sub.nextPaymentDate);
              nextPaymentDate.setHours(0, 0, 0, 0);
              const todayNormalized = new Date(today);
              todayNormalized.setHours(0, 0, 0, 0);
              const daysDiff = Math.floor(
                (nextPaymentDate.getTime() - todayNormalized.getTime()) / (1000 * 60 * 60 * 24)
              );
              expect(daysDiff).toBeGreaterThanOrEqual(0);
              expect(daysDiff).toBeLessThanOrEqual(thresholdDays);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return empty array when no trials exist", () => {
      fc.assert(
        fc.property(
          fc.array(subscriptionArb, { maxLength: 20 }),
          fc.integer({ min: 1, max: 30 }),
          (subscriptions, thresholdDays) => {
            const today = new Date("2024-06-15");
            vi.setSystemTime(today);

            // Force all subscriptions to be non-trial
            const nonTrialSubscriptions = subscriptions.map((sub) => ({
              ...sub,
              billingCycle: fc.sample(
                fc.constantFrom<BillingCycle>("monthly", "yearly", "one-time")
              )[0],
            }));

            const result = getTrialsEndingSoon(nonTrialSubscriptions, thresholdDays);
            expect(result).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return empty array for empty subscription list", () => {
      expect(getTrialsEndingSoon([], 7)).toHaveLength(0);
    });
  });
});
