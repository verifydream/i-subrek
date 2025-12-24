import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  billingCycleValues,
  statusValues,
  categoryValues,
  currencyValues,
} from "../validations";

// Arbitrary generators for valid values
const validBillingCycle = fc.constantFrom(...billingCycleValues);
const validStatus = fc.constantFrom(...statusValues);
const validCategory = fc.constantFrom(...categoryValues);
const validCurrency = fc.constantFrom(...currencyValues);

// Arbitrary for valid subscription name (1-100 chars)
const validName = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

// Arbitrary for valid price (positive number)
const validPrice = fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true });

// Arbitrary for valid reminder days (0-30)
const validReminderDays = fc.integer({ min: 0, max: 30 });

// Arbitrary for valid date (filter out invalid dates)
const validDate = fc
  .date({ min: new Date("2000-01-01"), max: new Date("2100-12-31") })
  .filter((d) => !isNaN(d.getTime()));

// Arbitrary for valid email
const validEmail = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/i.test(s)),
    fc.constantFrom("gmail.com", "yahoo.com", "outlook.com", "example.com")
  )
  .map(([local, domain]) => `${local}@${domain}`);

// Arbitrary for valid notes (0-500 chars)
const validNotes = fc.string({ minLength: 0, maxLength: 500 });

// Arbitrary for a complete valid create subscription input
const validCreateInput = fc.record({
  name: validName,
  price: validPrice,
  currency: validCurrency,
  billingCycle: validBillingCycle,
  startDate: validDate,
  reminderDays: validReminderDays,
});

describe("Zod Validation Schemas", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 5: Zod Validation Correctness**
   *
   * *For any* subscription input data, Zod schema validation SHALL accept all inputs
   * conforming to the schema constraints and reject all inputs violating any constraint,
   * returning appropriate error messages.
   *
   * **Validates: Requirements 2.6**
   */
  describe("Property 5: Zod Validation Correctness", () => {
    it("should accept all valid create subscription inputs", () => {
      fc.assert(
        fc.property(validCreateInput, (input) => {
          const result = createSubscriptionSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.name).toBe(input.name);
            expect(result.data.price).toBe(input.price);
            expect(result.data.currency).toBe(input.currency);
            expect(result.data.billingCycle).toBe(input.billingCycle);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should reject names that are empty or exceed 100 characters", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(""),
            fc.string({ minLength: 101, maxLength: 200 })
          ),
          validPrice,
          validCurrency,
          validBillingCycle,
          validDate,
          (name, price, currency, billingCycle, startDate) => {
            const result = createSubscriptionSchema.safeParse({
              name,
              price,
              currency,
              billingCycle,
              startDate,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject negative prices", () => {
      fc.assert(
        fc.property(
          validName,
          fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.01), noNaN: true }),
          validCurrency,
          validBillingCycle,
          validDate,
          (name, price, currency, billingCycle, startDate) => {
            const result = createSubscriptionSchema.safeParse({
              name,
              price,
              currency,
              billingCycle,
              startDate,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid currencies", () => {
      fc.assert(
        fc.property(
          validName,
          validPrice,
          fc.string().filter((s) => !currencyValues.includes(s as typeof currencyValues[number])),
          validBillingCycle,
          validDate,
          (name, price, currency, billingCycle, startDate) => {
            const result = createSubscriptionSchema.safeParse({
              name,
              price,
              currency,
              billingCycle,
              startDate,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid billing cycles", () => {
      fc.assert(
        fc.property(
          validName,
          validPrice,
          validCurrency,
          fc.string().filter((s) => !billingCycleValues.includes(s as typeof billingCycleValues[number])),
          validDate,
          (name, price, currency, billingCycle, startDate) => {
            const result = createSubscriptionSchema.safeParse({
              name,
              price,
              currency,
              billingCycle,
              startDate,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject reminder days outside 0-30 range", () => {
      fc.assert(
        fc.property(
          validName,
          validPrice,
          validCurrency,
          validBillingCycle,
          validDate,
          fc.oneof(
            fc.integer({ min: -100, max: -1 }),
            fc.integer({ min: 31, max: 100 })
          ),
          (name, price, currency, billingCycle, startDate, reminderDays) => {
            const result = createSubscriptionSchema.safeParse({
              name,
              price,
              currency,
              billingCycle,
              startDate,
              reminderDays,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject notes exceeding 500 characters", () => {
      fc.assert(
        fc.property(
          validCreateInput,
          fc.string({ minLength: 501, maxLength: 600 }),
          (input, notes) => {
            const result = createSubscriptionSchema.safeParse({
              ...input,
              notes,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept valid optional fields", () => {
      fc.assert(
        fc.property(
          validCreateInput,
          fc.option(validEmail, { nil: undefined }),
          fc.option(validNotes, { nil: undefined }),
          fc.option(validCategory, { nil: undefined }),
          (input, accountEmail, notes, category) => {
            const result = createSubscriptionSchema.safeParse({
              ...input,
              accountEmail,
              notes,
              category,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid email formats", () => {
      fc.assert(
        fc.property(
          validCreateInput,
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("@") && s.length > 0),
          (input, invalidEmail) => {
            const result = createSubscriptionSchema.safeParse({
              ...input,
              accountEmail: invalidEmail,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept empty string for accountEmail", () => {
      fc.assert(
        fc.property(validCreateInput, (input) => {
          const result = createSubscriptionSchema.safeParse({
            ...input,
            accountEmail: "",
          });
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Update Schema", () => {
    it("should accept partial updates with valid values", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.option(validName, { nil: undefined }),
            price: fc.option(validPrice, { nil: undefined }),
            status: fc.option(validStatus, { nil: undefined }),
          }),
          (partialInput) => {
            const result = updateSubscriptionSchema.safeParse(partialInput);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid status values", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !statusValues.includes(s as typeof statusValues[number]) && s.length > 0),
          (invalidStatus) => {
            const result = updateSubscriptionSchema.safeParse({
              status: invalidStatus,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept empty object for update", () => {
      const result = updateSubscriptionSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
