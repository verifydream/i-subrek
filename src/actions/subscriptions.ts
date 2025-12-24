"use server";

/**
 * Server Actions for Subscription CRUD operations
 * All sensitive operations (encryption, masking, database access) happen server-side
 *
 * Requirements: 2.1, 2.4, 3.1, 4.1
 */

import { db } from "@/db";
import { subscriptions, type Subscription } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { maskPaymentMethod } from "@/lib/masking";
import { encryptPassword, decryptPassword } from "@/lib/encryption";
import { calculateNextPaymentDate } from "@/lib/date-utils";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
} from "@/lib/validations";

// Action Result Type
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Creates a new subscription for the authenticated user.
 * Handles payment method masking and password encryption before storage.
 *
 * @param userId - The Clerk user ID
 * @param input - The subscription input data
 * @returns ActionResult with the created subscription or error
 */
export async function createSubscription(
  userId: string,
  input: CreateSubscriptionInput
): Promise<ActionResult<Subscription>> {
  try {
    // Validate input
    const validationResult = createSubscriptionSchema.safeParse(input);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".") || "root";
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      return {
        success: false,
        error: "Validation failed",
        validationErrors: errors,
      };
    }

    const data = validationResult.data;

    // Use provided nextPaymentDate or calculate from billing cycle
    const nextPaymentDate = data.nextPaymentDate || calculateNextPaymentDate(
      data.startDate,
      data.billingCycle
    );

    // Mask payment method number if provided
    const maskedPaymentNumber = data.paymentMethodNumber
      ? maskPaymentMethod(data.paymentMethodNumber)
      : null;

    // Encrypt password if provided
    const encryptedPassword = data.accountPassword
      ? encryptPassword(data.accountPassword)
      : null;

    // Insert into database
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        name: data.name,
        subscriptionType: data.subscriptionType || "trial",
        price: data.price.toString(),
        currency: data.currency,
        billingCycle: data.billingCycle,
        startDate: data.startDate.toISOString().split("T")[0],
        nextPaymentDate: nextPaymentDate.toISOString().split("T")[0],
        reminderDays: data.reminderDays,
        paymentMethodProvider: data.paymentMethodProvider || null,
        paymentMethodNumber: maskedPaymentNumber,
        accountEmail: data.accountEmail || null,
        accountLoginMethod: data.accountLoginMethod || null,
        accountPasswordEncrypted: encryptedPassword,
        notes: data.notes || null,
        category: data.category || null,
        url: data.url || null,
        status: "active",
      })
      .returning();

    return {
      success: true,
      data: newSubscription,
    };
  } catch (error) {
    console.error("Error creating subscription:", error);
    return {
      success: false,
      error: "Failed to create subscription",
    };
  }
}

/**
 * Updates an existing subscription.
 * Verifies user ownership before update.
 *
 * @param userId - The Clerk user ID
 * @param subscriptionId - The subscription UUID
 * @param input - The update input data
 * @returns ActionResult with the updated subscription or error
 */
export async function updateSubscription(
  userId: string,
  subscriptionId: string,
  input: UpdateSubscriptionInput
): Promise<ActionResult<Subscription>> {
  try {
    // Validate input
    const validationResult = updateSubscriptionSchema.safeParse(input);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".") || "root";
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      return {
        success: false,
        error: "Validation failed",
        validationErrors: errors,
      };
    }

    const data = validationResult.data;

    // Verify ownership
    const existing = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))
      )
      .limit(1);

    if (existing.length === 0) {
      return {
        success: false,
        error: "Subscription not found",
      };
    }

    // Build update object
    const updateData: Partial<typeof subscriptions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.subscriptionType !== undefined) updateData.subscriptionType = data.subscriptionType;
    if (data.price !== undefined) updateData.price = data.price.toString();
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle;
    if (data.reminderDays !== undefined) updateData.reminderDays = data.reminderDays;
    if (data.paymentMethodProvider !== undefined)
      updateData.paymentMethodProvider = data.paymentMethodProvider || null;
    if (data.accountEmail !== undefined)
      updateData.accountEmail = data.accountEmail || null;
    if (data.accountLoginMethod !== undefined)
      updateData.accountLoginMethod = data.accountLoginMethod || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.category !== undefined) updateData.category = data.category || null;
    if (data.url !== undefined) updateData.url = data.url || null;
    if (data.status !== undefined) updateData.status = data.status;

    // Handle start date and next payment date
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate.toISOString().split("T")[0];
    }
    
    // Use provided nextPaymentDate directly (from user selection)
    if (data.nextPaymentDate !== undefined) {
      updateData.nextPaymentDate = data.nextPaymentDate.toISOString().split("T")[0];
    } else if (data.startDate !== undefined && !data.nextPaymentDate) {
      // Fallback: calculate from billing cycle if no nextPaymentDate provided
      const billingCycle = data.billingCycle || existing[0].billingCycle;
      updateData.nextPaymentDate = calculateNextPaymentDate(
        data.startDate,
        billingCycle
      )
        .toISOString()
        .split("T")[0];
    }

    // Mask payment method if provided
    if (data.paymentMethodNumber !== undefined) {
      updateData.paymentMethodNumber = data.paymentMethodNumber
        ? maskPaymentMethod(data.paymentMethodNumber)
        : null;
    }

    // Encrypt password if provided
    if (data.accountPassword !== undefined) {
      updateData.accountPasswordEncrypted = data.accountPassword
        ? encryptPassword(data.accountPassword)
        : null;
    }

    // Update in database
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(updateData)
      .where(
        and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))
      )
      .returning();

    return {
      success: true,
      data: updatedSubscription,
    };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return {
      success: false,
      error: "Failed to update subscription",
    };
  }
}

/**
 * Deletes a subscription.
 * Verifies user ownership before deletion.
 *
 * @param userId - The Clerk user ID
 * @param subscriptionId - The subscription UUID
 * @returns ActionResult indicating success or failure
 */
export async function deleteSubscription(
  userId: string,
  subscriptionId: string
): Promise<ActionResult<void>> {
  try {
    // Delete with ownership check
    const result = await db
      .delete(subscriptions)
      .where(
        and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))
      )
      .returning({ id: subscriptions.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "Subscription not found",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return {
      success: false,
      error: "Failed to delete subscription",
    };
  }
}

/**
 * Gets all subscriptions for the authenticated user.
 * Filters by user ID to ensure data isolation.
 *
 * @param userId - The Clerk user ID
 * @returns Array of subscriptions belonging to the user
 */
export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.nextPaymentDate);

    return userSubscriptions;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}

/**
 * Gets a single subscription by ID.
 * Verifies user ownership before returning.
 *
 * @param userId - The Clerk user ID
 * @param subscriptionId - The subscription UUID
 * @returns The subscription or null if not found/not owned
 */
export async function getSubscriptionById(
  userId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))
      )
      .limit(1);

    return subscription || null;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
}

/**
 * Decrypts and returns the password for a subscription.
 * Verifies user ownership before decryption.
 *
 * Requirements: 4.2, 4.5
 *
 * @param userId - The Clerk user ID
 * @param subscriptionId - The subscription UUID
 * @returns ActionResult with the decrypted password or error
 */
export async function decryptSubscriptionPassword(
  userId: string,
  subscriptionId: string
): Promise<ActionResult<string>> {
  try {
    // Verify ownership and get subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))
      )
      .limit(1);

    if (!subscription) {
      return {
        success: false,
        error: "Subscription not found",
      };
    }

    if (!subscription.accountPasswordEncrypted) {
      return {
        success: false,
        error: "No password stored for this subscription",
      };
    }

    // Decrypt the password
    const decryptedPassword = decryptPassword(
      subscription.accountPasswordEncrypted
    );

    return {
      success: true,
      data: decryptedPassword,
    };
  } catch (error) {
    console.error("Error decrypting password:", error);
    return {
      success: false,
      error: "Failed to decrypt password",
    };
  }
}
