import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import * as fc from "fast-check";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  deleteSubscription,
} from "../subscriptions";
import {
  billingCycleValues,
  categoryValues,
  currencyValues,
  subscriptionTypeValues,
} from "@/lib/validations";

// Track created subscription IDs for cleanup
const createdSubscriptionIds: string[] = [];

// Test user IDs - simulating different Clerk users
const TEST_USER_1 = "test_user_1_" + Date.now();
const TEST_USER_2 = "test_user_2_" + Date.now();

// Check if database is available
let isDatabaseAvailable = false;
beforeAll(async () => {
  try {
    // Try a simple query to check database connectivity
    await db.select().from(subscriptions).limit(1);
    isDatabaseAvailable = true;
  } catch {
    console.warn(
      "Database not available - skipping server action property tests. " +
      "These tests require a live database connection."
    );
    isDatabaseAvailable = false;
  }
});

// Cleanup function to remove test data
async function cleanupTestData() {
  if (!isDatabaseAvailable) return;
  if (createdSubscriptionIds.length > 0) {
    try {
      await db
        .delete(subscriptions)
        .where(inArray(subscriptions.id, createdSubscriptionIds));
    } catch {
      // Ignore cleanup errors
    }
    createdSubscriptionIds.length = 0;
  }
}

afterEach(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  if (!isDatabaseAvailable) return;
  try {
    // Final cleanup - remove any subscriptions created by test users
    await db
      .delete(subscriptions)
      .where(eq(subscriptions.userId, TEST_USER_1));
    await db
      .delete(subscriptions)
      .where(eq(subscriptions.userId, TEST_USER_2));
  } catch {
    // Ignore cleanup errors
  }
});

// Arbitrary generators for valid subscription input
const validBillingCycle = fc.constantFrom(...billingCycleValues);
const validSubscriptionType = fc.constantFrom(...subscriptionTypeValues);
const validCategory = fc.constantFrom(...categoryValues);
const validCurrency = fc.constantFrom(...currencyValues);
const validName = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);
const validPrice = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(10000),
  noNaN: true,
});
const validReminderDays = fc.integer({ min: 0, max: 30 });
const validDate = fc
  .date({ min: new Date("2024-01-01"), max: new Date("2026-12-31") })
  .filter((d) => !isNaN(d.getTime()));

// Generator for valid create subscription input
const validCreateInput = fc.record({
  name: validName,
  subscriptionType: validSubscriptionType,
  price: validPrice,
  currency: validCurrency,
  billingCycle: validBillingCycle,
  startDate: validDate,
  reminderDays: validReminderDays,
});

describe("Server Actions Property Tests", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 1: User Data Isolation**
   *
   * *For any* authenticated user ID and any set of subscriptions in the database,
   * querying subscriptions SHALL return only those records where the userId field
   * matches the authenticated user's Clerk ID.
   *
   * **Validates: Requirements 1.5, 2.5**
   */
  describe("Property 1: User Data Isolation", () => {
    it("should return only subscriptions belonging to the authenticated user", async () => {
      if (!isDatabaseAvailable) {
        console.log("Skipping test - database not available");
        return;
      }
      await fc.assert(
        fc.asyncProperty(validCreateInput, validCreateInput, async (input1, input2) => {
          // Create subscription for user 1
          const result1 = await createSubscription(TEST_USER_1, input1);
          expect(result1.success).toBe(true);
          if (result1.data) createdSubscriptionIds.push(result1.data.id);

          // Create subscription for user 2
          const result2 = await createSubscription(TEST_USER_2, input2);
          expect(result2.success).toBe(true);
          if (result2.data) createdSubscriptionIds.push(result2.data.id);

          // Query subscriptions for user 1
          const user1Subs = await getSubscriptions(TEST_USER_1);

          // All returned subscriptions should belong to user 1
          for (const sub of user1Subs) {
            expect(sub.userId).toBe(TEST_USER_1);
          }

          // Query subscriptions for user 2
          const user2Subs = await getSubscriptions(TEST_USER_2);

          // All returned subscriptions should belong to user 2
          for (const sub of user2Subs) {
            expect(sub.userId).toBe(TEST_USER_2);
          }

          // Cleanup for next iteration
          await cleanupTestData();
        }),
        { numRuns: 5 } // Reduced runs due to database operations
      );
    }, 30000); // 30 second timeout for database operations

    it("should not allow user to access another user's subscription by ID", async () => {
      if (!isDatabaseAvailable) {
        console.log("Skipping test - database not available");
        return;
      }
      await fc.assert(
        fc.asyncProperty(validCreateInput, async (input) => {
          // Create subscription for user 1
          const result = await createSubscription(TEST_USER_1, input);
          expect(result.success).toBe(true);
          if (result.data) createdSubscriptionIds.push(result.data.id);

          const subscriptionId = result.data!.id;

          // User 2 should not be able to access user 1's subscription
          const accessedSub = await getSubscriptionById(TEST_USER_2, subscriptionId);
          expect(accessedSub).toBeNull();

          // User 1 should be able to access their own subscription
          const ownSub = await getSubscriptionById(TEST_USER_1, subscriptionId);
          expect(ownSub).not.toBeNull();
          expect(ownSub?.id).toBe(subscriptionId);

          // Cleanup for next iteration
          await cleanupTestData();
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Feature: isubrek-subscription-tracker, Property 2: Subscription Creation Integrity**
   *
   * *For any* valid subscription input data and authenticated user, creating a subscription
   * SHALL produce a record with a valid UUID (v4 format) and the correct user ID association.
   *
   * **Validates: Requirements 2.1**
   */
  describe("Property 2: Subscription Creation Integrity", () => {
    // UUID v4 regex pattern
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it("should create subscription with valid UUID and correct user ID", async () => {
      if (!isDatabaseAvailable) {
        console.log("Skipping test - database not available");
        return;
      }
      await fc.assert(
        fc.asyncProperty(validCreateInput, async (input) => {
          const result = await createSubscription(TEST_USER_1, input);

          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();

          if (result.data) {
            createdSubscriptionIds.push(result.data.id);

            // Verify UUID v4 format
            expect(result.data.id).toMatch(uuidV4Regex);

            // Verify user ID association
            expect(result.data.userId).toBe(TEST_USER_1);

            // Verify data integrity
            expect(result.data.name).toBe(input.name);
            expect(parseFloat(result.data.price)).toBeCloseTo(input.price, 1);
            expect(result.data.currency).toBe(input.currency);
            expect(result.data.billingCycle).toBe(input.billingCycle);
          }

          // Cleanup for next iteration
          await cleanupTestData();
        }),
        { numRuns: 20 }
      );
    });

    it("should persist subscription to database with correct data", async () => {
      if (!isDatabaseAvailable) {
        console.log("Skipping test - database not available");
        return;
      }
      await fc.assert(
        fc.asyncProperty(validCreateInput, async (input) => {
          const result = await createSubscription(TEST_USER_1, input);
          expect(result.success).toBe(true);

          if (result.data) {
            createdSubscriptionIds.push(result.data.id);

            // Verify subscription exists in database
            const [dbRecord] = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.id, result.data.id))
              .limit(1);

            expect(dbRecord).toBeDefined();
            expect(dbRecord.userId).toBe(TEST_USER_1);
            expect(dbRecord.name).toBe(input.name);
          }

          // Cleanup for next iteration
          await cleanupTestData();
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Feature: isubrek-subscription-tracker, Property 4: Subscription Deletion Completeness**
   *
   * *For any* existing subscription, after deletion, querying for that subscription
   * by ID SHALL return null/not found.
   *
   * **Validates: Requirements 2.4**
   */
  describe("Property 4: Subscription Deletion Completeness", () => {
    it("should completely remove subscription after deletion", async () => {
      if (!isDatabaseAvailable) {
        console.log("Skipping test - database not available");
        return;
      }
      await fc.assert(
        fc.asyncProperty(validCreateInput, async (input) => {
          // Create a subscription
          const createResult = await createSubscription(TEST_USER_1, input);
          expect(createResult.success).toBe(true);
          expect(createResult.data).toBeDefined();

          const subscriptionId = createResult.data!.id;

          // Verify it exists
          const beforeDelete = await getSubscriptionById(TEST_USER_1, subscriptionId);
          expect(beforeDelete).not.toBeNull();

          // Delete the subscription
          const deleteResult = await deleteSubscription(TEST_USER_1, subscriptionId);
          expect(deleteResult.success).toBe(true);

          // Verify it no longer exists via getSubscriptionById
          const afterDelete = await getSubscriptionById(TEST_USER_1, subscriptionId);
          expect(afterDelete).toBeNull();

          // Verify it no longer exists in database directly
          const [dbRecord] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.id, subscriptionId))
            .limit(1);

          expect(dbRecord).toBeUndefined();
        }),
        { numRuns: 10 }
      );
    }, 30000); // 30 second timeout for database operations

    it("should not allow user to delete another user's subscription", async () => {
      if (!isDatabaseAvailable) {
        console.log("Skipping test - database not available");
        return;
      }
      await fc.assert(
        fc.asyncProperty(validCreateInput, async (input) => {
          // Create subscription for user 1
          const createResult = await createSubscription(TEST_USER_1, input);
          expect(createResult.success).toBe(true);

          if (createResult.data) {
            createdSubscriptionIds.push(createResult.data.id);
          }

          const subscriptionId = createResult.data!.id;

          // User 2 attempts to delete user 1's subscription
          const deleteResult = await deleteSubscription(TEST_USER_2, subscriptionId);
          expect(deleteResult.success).toBe(false);
          expect(deleteResult.error).toBe("Subscription not found");

          // Verify subscription still exists for user 1
          const stillExists = await getSubscriptionById(TEST_USER_1, subscriptionId);
          expect(stillExists).not.toBeNull();

          // Cleanup for next iteration
          await cleanupTestData();
        }),
        { numRuns: 10 }
      );
    });
  });
});
