import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  serializeSubscription,
  deserializeSubscription,
  type SerializableSubscription,
} from "../serialization";
import type { BillingCycle, Category, Status } from "@/db/schema";

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

const dateArb = fc.date({
  min: new Date("2020-01-01"),
  max: new Date("2030-12-31"),
  noInvalidDate: true,
});

// UUID v4 generator using fc.uuid()
const uuidArb = fc.uuid();

// Nullable string generator
const nullableStringArb = fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
  nil: null,
});

// Full subscription arbitrary
const subscriptionArb: fc.Arbitrary<SerializableSubscription> = fc.record({
  id: uuidArb,
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc
    .integer({ min: 1, max: 9999999999 })
    .map((n) => (n / 100).toFixed(2)),
  currency: fc.constantFrom("IDR", "USD"),
  billingCycle: billingCycleArb,
  startDate: dateArb,
  nextPaymentDate: dateArb,
  reminderDays: fc.integer({ min: 0, max: 30 }),
  paymentMethodProvider: nullableStringArb,
  paymentMethodNumber: nullableStringArb,
  accountEmail: fc.option(fc.emailAddress(), { nil: null }),
  accountPasswordEncrypted: nullableStringArb,
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  category: categoryArb,
  status: statusArb,
  createdAt: dateArb,
  updatedAt: dateArb,
});

describe("Subscription Serialization", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 6: Subscription Serialization Round-Trip**
   *
   * *For any* valid Subscription object, serializing to JSON and then deserializing
   * SHALL produce an object equivalent to the original.
   *
   * **Validates: Requirements 2.7, 2.8**
   */
  describe("Property 6: Subscription Serialization Round-Trip", () => {
    it("should produce equivalent object after serialize then deserialize", () => {
      fc.assert(
        fc.property(subscriptionArb, (subscription) => {
          const serialized = serializeSubscription(subscription);
          const deserialized = deserializeSubscription(serialized);

          // Compare all fields
          expect(deserialized.id).toBe(subscription.id);
          expect(deserialized.userId).toBe(subscription.userId);
          expect(deserialized.name).toBe(subscription.name);
          expect(deserialized.price).toBe(subscription.price);
          expect(deserialized.currency).toBe(subscription.currency);
          expect(deserialized.billingCycle).toBe(subscription.billingCycle);
          expect(deserialized.reminderDays).toBe(subscription.reminderDays);
          expect(deserialized.paymentMethodProvider).toBe(
            subscription.paymentMethodProvider
          );
          expect(deserialized.paymentMethodNumber).toBe(
            subscription.paymentMethodNumber
          );
          expect(deserialized.accountEmail).toBe(subscription.accountEmail);
          expect(deserialized.accountPasswordEncrypted).toBe(
            subscription.accountPasswordEncrypted
          );
          expect(deserialized.notes).toBe(subscription.notes);
          expect(deserialized.category).toBe(subscription.category);
          expect(deserialized.status).toBe(subscription.status);

          // Compare dates (using getTime for exact comparison)
          expect(deserialized.startDate.getTime()).toBe(
            subscription.startDate.getTime()
          );
          expect(deserialized.nextPaymentDate.getTime()).toBe(
            subscription.nextPaymentDate.getTime()
          );
          expect(deserialized.createdAt.getTime()).toBe(
            subscription.createdAt.getTime()
          );
          expect(deserialized.updatedAt.getTime()).toBe(
            subscription.updatedAt.getTime()
          );
        })
      );
    });

    it("should produce valid JSON string", () => {
      fc.assert(
        fc.property(subscriptionArb, (subscription) => {
          const serialized = serializeSubscription(subscription);

          // Should be valid JSON
          expect(() => JSON.parse(serialized)).not.toThrow();

          // Should contain expected fields
          const parsed = JSON.parse(serialized);
          expect(parsed).toHaveProperty("id");
          expect(parsed).toHaveProperty("startDate");
          expect(typeof parsed.startDate).toBe("string");
        })
      );
    });

    it("should preserve date precision through round-trip", () => {
      fc.assert(
        fc.property(dateArb, (date) => {
          const subscription: SerializableSubscription = {
            id: "test-id",
            userId: "user-1",
            name: "Test",
            price: "9.99",
            currency: "USD",
            billingCycle: "monthly",
            startDate: date,
            nextPaymentDate: date,
            reminderDays: 3,
            paymentMethodProvider: null,
            paymentMethodNumber: null,
            accountEmail: null,
            accountPasswordEncrypted: null,
            notes: null,
            category: null,
            status: "active",
            createdAt: date,
            updatedAt: date,
          };

          const serialized = serializeSubscription(subscription);
          const deserialized = deserializeSubscription(serialized);

          // Dates should be exactly equal
          expect(deserialized.startDate.getTime()).toBe(date.getTime());
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle subscription with all null optional fields", () => {
      const subscription: SerializableSubscription = {
        id: "test-id",
        userId: "user-1",
        name: "Test Subscription",
        price: "9.99",
        currency: "USD",
        billingCycle: "monthly",
        startDate: new Date("2024-01-01"),
        nextPaymentDate: new Date("2024-02-01"),
        reminderDays: 3,
        paymentMethodProvider: null,
        paymentMethodNumber: null,
        accountEmail: null,
        accountPasswordEncrypted: null,
        notes: null,
        category: null,
        status: "active",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const serialized = serializeSubscription(subscription);
      const deserialized = deserializeSubscription(serialized);

      expect(deserialized.paymentMethodProvider).toBeNull();
      expect(deserialized.paymentMethodNumber).toBeNull();
      expect(deserialized.accountEmail).toBeNull();
      expect(deserialized.notes).toBeNull();
      expect(deserialized.category).toBeNull();
    });

    it("should handle special characters in string fields", () => {
      const subscription: SerializableSubscription = {
        id: "test-id",
        userId: "user-1",
        name: 'Test "Subscription" with <special> & chars',
        price: "9.99",
        currency: "USD",
        billingCycle: "monthly",
        startDate: new Date("2024-01-01"),
        nextPaymentDate: new Date("2024-02-01"),
        reminderDays: 3,
        paymentMethodProvider: null,
        paymentMethodNumber: null,
        accountEmail: null,
        accountPasswordEncrypted: null,
        notes: "Notes with\nnewlines\tand\ttabs",
        category: null,
        status: "active",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const serialized = serializeSubscription(subscription);
      const deserialized = deserializeSubscription(serialized);

      expect(deserialized.name).toBe(subscription.name);
      expect(deserialized.notes).toBe(subscription.notes);
    });
  });
});
