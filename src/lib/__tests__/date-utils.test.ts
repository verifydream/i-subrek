import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  calculateNextPaymentDate,
  isWithinReminderDays,
  advancePaymentDate,
} from "../date-utils";
import { addMonths, addYears, differenceInDays } from "date-fns";
import type { BillingCycle } from "@/db/schema";

// Arbitrary for valid dates (reasonable range for subscriptions)
const dateArb = fc.date({
  min: new Date("2020-01-01"),
  max: new Date("2030-12-31"),
});

// Arbitrary for billing cycles
const billingCycleArb = fc.constantFrom<BillingCycle>(
  "monthly",
  "yearly",
  "one-time",
  "trial"
);

describe("Date Calculation Utilities", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 3: Next Payment Date Calculation**
   *
   * *For any* start date and billing cycle combination:
   * - Monthly cycle: next payment date SHALL be exactly one month after start date
   * - Yearly cycle: next payment date SHALL be exactly one year after start date
   * - One-time cycle: next payment date SHALL equal the start date
   * - Trial cycle: next payment date SHALL equal the start date (trial end)
   *
   * **Validates: Requirements 2.2, 2.3, 10.1, 10.2, 10.3, 10.4**
   */
  describe("Property 3: Next Payment Date Calculation", () => {
    it("monthly cycle should add exactly one month", () => {
      fc.assert(
        fc.property(dateArb, (startDate) => {
          const result = calculateNextPaymentDate(startDate, "monthly");
          const expected = addMonths(startDate, 1);

          expect(result.getTime()).toBe(expected.getTime());
        })
      );
    });

    it("yearly cycle should add exactly one year", () => {
      fc.assert(
        fc.property(dateArb, (startDate) => {
          const result = calculateNextPaymentDate(startDate, "yearly");
          const expected = addYears(startDate, 1);

          expect(result.getTime()).toBe(expected.getTime());
        })
      );
    });

    it("one-time cycle should equal start date", () => {
      fc.assert(
        fc.property(dateArb, (startDate) => {
          const result = calculateNextPaymentDate(startDate, "one-time");

          expect(result.getTime()).toBe(startDate.getTime());
        })
      );
    });

    it("trial cycle should equal start date", () => {
      fc.assert(
        fc.property(dateArb, (startDate) => {
          const result = calculateNextPaymentDate(startDate, "trial");

          expect(result.getTime()).toBe(startDate.getTime());
        })
      );
    });
  });

  /**
   * **Feature: isubrek-subscription-tracker, Property 12: Reminder Days Highlighting**
   *
   * *For any* subscription and current date, the isWithinReminderDays function
   * SHALL return true if and only if the difference between nextPaymentDate
   * and current date is less than or equal to reminderDays.
   *
   * **Validates: Requirements 5.6**
   */
  describe("Property 12: Reminder Days Highlighting", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true when payment is within reminder days", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // reminderDays
          fc.integer({ min: 0, max: 30 }), // daysUntilPayment (within range)
          (reminderDays, daysUntilPayment) => {
            // Only test when daysUntilPayment <= reminderDays
            fc.pre(daysUntilPayment <= reminderDays);

            const today = new Date("2024-06-15");
            vi.setSystemTime(today);

            const paymentDate = new Date(today);
            paymentDate.setDate(paymentDate.getDate() + daysUntilPayment);

            const result = isWithinReminderDays(paymentDate, reminderDays);
            expect(result).toBe(true);
          }
        )
      );
    });

    it("should return false when payment is beyond reminder days", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // reminderDays
          fc.integer({ min: 1, max: 365 }), // extra days beyond reminder
          (reminderDays, extraDays) => {
            const today = new Date("2024-06-15");
            vi.setSystemTime(today);

            const paymentDate = new Date(today);
            paymentDate.setDate(paymentDate.getDate() + reminderDays + extraDays);

            const result = isWithinReminderDays(paymentDate, reminderDays);
            expect(result).toBe(false);
          }
        )
      );
    });

    it("should return false for past payment dates", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // reminderDays
          fc.integer({ min: 1, max: 365 }), // days in the past
          (reminderDays, daysInPast) => {
            const today = new Date("2024-06-15");
            vi.setSystemTime(today);

            const paymentDate = new Date(today);
            paymentDate.setDate(paymentDate.getDate() - daysInPast);

            const result = isWithinReminderDays(paymentDate, reminderDays);
            expect(result).toBe(false);
          }
        )
      );
    });
  });

  /**
   * **Feature: isubrek-subscription-tracker, Property 15: Payment Date Advancement**
   *
   * *For any* subscription where the current date exceeds the nextPaymentDate,
   * recalculating SHALL advance the nextPaymentDate to the next cycle date
   * (current nextPaymentDate + 1 cycle period) for monthly/yearly cycles.
   *
   * **Validates: Requirements 10.5**
   */
  describe("Property 15: Payment Date Advancement", () => {
    it("monthly advancement should add exactly one month", () => {
      fc.assert(
        fc.property(dateArb, (currentNextDate) => {
          const result = advancePaymentDate(currentNextDate, "monthly");
          const expected = addMonths(currentNextDate, 1);

          expect(result.getTime()).toBe(expected.getTime());
        })
      );
    });

    it("yearly advancement should add exactly one year", () => {
      fc.assert(
        fc.property(dateArb, (currentNextDate) => {
          const result = advancePaymentDate(currentNextDate, "yearly");
          const expected = addYears(currentNextDate, 1);

          expect(result.getTime()).toBe(expected.getTime());
        })
      );
    });

    it("one-time and trial should not advance", () => {
      fc.assert(
        fc.property(
          dateArb,
          fc.constantFrom<BillingCycle>("one-time", "trial"),
          (currentNextDate, cycle) => {
            const result = advancePaymentDate(currentNextDate, cycle);

            expect(result.getTime()).toBe(currentNextDate.getTime());
          }
        )
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle month-end dates correctly for monthly cycle", () => {
      // Jan 31 + 1 month should be Feb 28/29
      const jan31 = new Date("2024-01-31");
      const result = calculateNextPaymentDate(jan31, "monthly");
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29); // 2024 is leap year
    });

    it("should handle leap year for yearly cycle", () => {
      const feb29 = new Date("2024-02-29");
      const result = calculateNextPaymentDate(feb29, "yearly");
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28); // 2025 is not leap year
    });
  });
});
