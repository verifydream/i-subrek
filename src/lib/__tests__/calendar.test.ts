import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateGoogleCalendarUrl } from "../calendar";
import type { Subscription, BillingCycle, Category, Status } from "@/db/schema";

// Arbitrary generators for subscription fields
const billingCycleArb = fc.constantFrom<BillingCycle>(
  "monthly",
  "yearly",
  "one-time",
  "trial"
);

const statusArb = fc.constantFrom<Status>("active", "cancelled", "expired");

const categoryArb = fc.constantFrom<Category | null>(
  "Entertainment",
  "Tools",
  "Work",
  "Utilities",
  null
);

// Date string generator (DB stores dates as strings in YYYY-MM-DD format)
const dateStringArb = fc
  .date({
    min: new Date("2020-01-01"),
    max: new Date("2030-12-31"),
    noInvalidDate: true,
  })
  .map((d) => d.toISOString().split("T")[0]);

// Timestamp generator for createdAt/updatedAt
const timestampArb = fc.date({
  min: new Date("2020-01-01"),
  max: new Date("2030-12-31"),
  noInvalidDate: true,
});

// UUID v4 generator
const uuidArb = fc.uuid();

// Nullable string generator
const nullableStringArb = fc.option(
  fc.string({ minLength: 1, maxLength: 100 }),
  { nil: null }
);

// Subscription name generator - non-empty strings
const nameArb = fc.string({ minLength: 1, maxLength: 100 });

// Full subscription arbitrary matching DB schema
const subscriptionArb: fc.Arbitrary<Subscription> = fc.record({
  id: uuidArb,
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  name: nameArb,
  price: fc
    .integer({ min: 1, max: 9999999999 })
    .map((n) => (n / 100).toFixed(2)),
  currency: fc.constantFrom("IDR", "USD"),
  billingCycle: billingCycleArb,
  startDate: dateStringArb,
  nextPaymentDate: dateStringArb,
  reminderDays: fc.integer({ min: 0, max: 30 }),
  paymentMethodProvider: nullableStringArb,
  paymentMethodNumber: nullableStringArb,
  accountEmail: fc.option(fc.emailAddress(), { nil: null }),
  accountPasswordEncrypted: nullableStringArb,
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  category: categoryArb,
  status: statusArb,
  createdAt: timestampArb,
  updatedAt: timestampArb,
});

describe("Google Calendar URL Generation", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 13: Google Calendar URL Generation**
   *
   * *For any* subscription, the generated Google Calendar URL SHALL contain:
   * - Event title in format "Renew [subscription name]"
   * - Date parameter matching the subscription's nextPaymentDate
   * - Description containing subscription details
   *
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  describe("Property 13: Google Calendar URL Generation", () => {
    it("should generate URL with event title 'Renew [subscription name]'", () => {
      fc.assert(
        fc.property(subscriptionArb, (subscription) => {
          const url = generateGoogleCalendarUrl(subscription);

          // Decode URL to check the text parameter
          const urlObj = new URL(url);
          const textParam = urlObj.searchParams.get("text");

          // Event title should be "Renew [name]" (Requirement 7.1)
          expect(textParam).toBe(`Renew ${subscription.name}`);
        }),
        { numRuns: 100 }
      );
    });

    it("should include nextPaymentDate as the event date", () => {
      fc.assert(
        fc.property(subscriptionArb, (subscription) => {
          const url = generateGoogleCalendarUrl(subscription);

          // Parse the URL
          const urlObj = new URL(url);
          const datesParam = urlObj.searchParams.get("dates");

          // Convert nextPaymentDate to expected format (YYYYMMDD)
          const nextDate = new Date(subscription.nextPaymentDate);
          const year = nextDate.getFullYear();
          const month = String(nextDate.getMonth() + 1).padStart(2, "0");
          const day = String(nextDate.getDate()).padStart(2, "0");
          const expectedDateStr = `${year}${month}${day}`;

          // Dates param should contain the nextPaymentDate (Requirement 7.2)
          expect(datesParam).toContain(expectedDateStr);
        }),
        { numRuns: 100 }
      );
    });

    it("should include subscription details in description", () => {
      fc.assert(
        fc.property(subscriptionArb, (subscription) => {
          const url = generateGoogleCalendarUrl(subscription);

          // Parse the URL
          const urlObj = new URL(url);
          const detailsParam = urlObj.searchParams.get("details");

          // Description should contain subscription details (Requirement 7.3)
          expect(detailsParam).not.toBeNull();
          expect(detailsParam).toContain(subscription.name);
          expect(detailsParam).toContain(subscription.price);
          expect(detailsParam).toContain(subscription.currency);
          expect(detailsParam).toContain(subscription.billingCycle);
        }),
        { numRuns: 100 }
      );
    });

    it("should generate valid Google Calendar URL format", () => {
      fc.assert(
        fc.property(subscriptionArb, (subscription) => {
          const url = generateGoogleCalendarUrl(subscription);

          // Should be a valid URL
          expect(() => new URL(url)).not.toThrow();

          // Should use Google Calendar base URL
          expect(url).toContain("https://calendar.google.com/calendar/render");

          // Should have action=TEMPLATE for creating new event
          const urlObj = new URL(url);
          expect(urlObj.searchParams.get("action")).toBe("TEMPLATE");
        }),
        { numRuns: 100 }
      );
    });

    it("should include category in description when present", () => {
      // Filter to only subscriptions with a category
      const subscriptionWithCategoryArb = subscriptionArb.filter(
        (s) => s.category !== null
      );

      fc.assert(
        fc.property(subscriptionWithCategoryArb, (subscription) => {
          const url = generateGoogleCalendarUrl(subscription);
          const urlObj = new URL(url);
          const detailsParam = urlObj.searchParams.get("details");

          expect(detailsParam).toContain(subscription.category!);
        }),
        { numRuns: 100 }
      );
    });

    it("should include notes in description when present", () => {
      // Filter to only subscriptions with notes
      const subscriptionWithNotesArb = subscriptionArb.filter(
        (s) => s.notes !== null && s.notes.length > 0
      );

      fc.assert(
        fc.property(subscriptionWithNotesArb, (subscription) => {
          const url = generateGoogleCalendarUrl(subscription);
          const urlObj = new URL(url);
          const detailsParam = urlObj.searchParams.get("details");

          expect(detailsParam).toContain(subscription.notes!);
        }),
        { numRuns: 100 }
      );
    });
  });
});
