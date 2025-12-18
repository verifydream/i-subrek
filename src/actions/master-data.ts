"use server";

/**
 * Server Actions for Master Data (Payment Methods, Account Credentials & Categories)
 */

import { db } from "@/db";
import { paymentMethods, accountCredentials, customCategories } from "@/db/master-schema";
import { eq, and } from "drizzle-orm";
import { encryptPassword, decryptPassword } from "@/lib/encryption";
import { maskPaymentMethod } from "@/lib/masking";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ PAYMENT METHODS ============

export async function getPaymentMethods(userId: string) {
  try {
    const methods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(paymentMethods.createdAt);
    return methods;
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }
}

export async function createPaymentMethod(
  userId: string,
  input: { name: string; provider: string; accountNumber?: string; isDefault?: boolean }
): Promise<ActionResult<typeof paymentMethods.$inferSelect>> {
  try {
    const lastFourDigits = input.accountNumber
      ? maskPaymentMethod(input.accountNumber)
      : null;

    const [method] = await db
      .insert(paymentMethods)
      .values({
        userId,
        name: input.name,
        provider: input.provider,
        lastFourDigits,
        isDefault: input.isDefault ?? false,
      })
      .returning();

    return { success: true, data: method };
  } catch (error) {
    console.error("Error creating payment method:", error);
    return { success: false, error: "Failed to create payment method" };
  }
}

export async function updatePaymentMethod(
  userId: string,
  methodId: string,
  input: { name?: string; provider?: string; accountNumber?: string }
): Promise<ActionResult<typeof paymentMethods.$inferSelect>> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (input.name) updateData.name = input.name;
    if (input.provider) updateData.provider = input.provider;
    if (input.accountNumber) {
      updateData.lastFourDigits = maskPaymentMethod(input.accountNumber);
    }

    const [method] = await db
      .update(paymentMethods)
      .set(updateData)
      .where(and(eq(paymentMethods.id, methodId), eq(paymentMethods.userId, userId)))
      .returning();

    return { success: true, data: method };
  } catch (error) {
    console.error("Error updating payment method:", error);
    return { success: false, error: "Failed to update payment method" };
  }
}

export async function deletePaymentMethod(
  userId: string,
  methodId: string
): Promise<ActionResult<void>> {
  try {
    await db
      .delete(paymentMethods)
      .where(and(eq(paymentMethods.id, methodId), eq(paymentMethods.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return { success: false, error: "Failed to delete payment method" };
  }
}

// ============ ACCOUNT CREDENTIALS ============

export async function getAccountCredentials(userId: string) {
  try {
    const credentials = await db
      .select()
      .from(accountCredentials)
      .where(eq(accountCredentials.userId, userId))
      .orderBy(accountCredentials.createdAt);
    return credentials;
  } catch (error) {
    console.error("Error fetching account credentials:", error);
    return [];
  }
}

export async function createAccountCredential(
  userId: string,
  input: {
    name: string;
    email: string;
    password?: string;
    loginMethod?: string;
    isDefault?: boolean;
  }
): Promise<ActionResult<typeof accountCredentials.$inferSelect>> {
  try {
    const passwordEncrypted = input.password
      ? encryptPassword(input.password)
      : null;

    const [credential] = await db
      .insert(accountCredentials)
      .values({
        userId,
        name: input.name,
        email: input.email,
        passwordEncrypted,
        loginMethod: input.loginMethod ?? "email",
        isDefault: input.isDefault ?? false,
      })
      .returning();

    return { success: true, data: credential };
  } catch (error) {
    console.error("Error creating account credential:", error);
    return { success: false, error: "Failed to create account credential" };
  }
}

export async function updateAccountCredential(
  userId: string,
  credentialId: string,
  input: { name?: string; email?: string; password?: string; loginMethod?: string }
): Promise<ActionResult<typeof accountCredentials.$inferSelect>> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email;
    if (input.loginMethod) updateData.loginMethod = input.loginMethod;
    if (input.password) {
      updateData.passwordEncrypted = encryptPassword(input.password);
    }

    const [credential] = await db
      .update(accountCredentials)
      .set(updateData)
      .where(and(eq(accountCredentials.id, credentialId), eq(accountCredentials.userId, userId)))
      .returning();

    return { success: true, data: credential };
  } catch (error) {
    console.error("Error updating account credential:", error);
    return { success: false, error: "Failed to update account credential" };
  }
}

export async function deleteAccountCredential(
  userId: string,
  credentialId: string
): Promise<ActionResult<void>> {
  try {
    await db
      .delete(accountCredentials)
      .where(
        and(
          eq(accountCredentials.id, credentialId),
          eq(accountCredentials.userId, userId)
        )
      );
    return { success: true };
  } catch (error) {
    console.error("Error deleting account credential:", error);
    return { success: false, error: "Failed to delete account credential" };
  }
}

export async function decryptCredentialPassword(
  userId: string,
  credentialId: string
): Promise<ActionResult<string>> {
  try {
    const [credential] = await db
      .select()
      .from(accountCredentials)
      .where(
        and(
          eq(accountCredentials.id, credentialId),
          eq(accountCredentials.userId, userId)
        )
      );

    if (!credential || !credential.passwordEncrypted) {
      return { success: false, error: "Credential not found or no password stored" };
    }

    const decrypted = decryptPassword(credential.passwordEncrypted);
    return { success: true, data: decrypted };
  } catch (error) {
    console.error("Error decrypting password:", error);
    return { success: false, error: "Failed to decrypt password" };
  }
}


// ============ CUSTOM CATEGORIES ============

// Default categories to seed for new users
const DEFAULT_CATEGORIES = [
  { name: "General", color: "#6b7280" },
  { name: "Entertainment", color: "#8b5cf6" },
  { name: "Tools", color: "#3b82f6" },
  { name: "Work", color: "#22c55e" },
  { name: "Utilities", color: "#f97316" },
];

export async function getCategories(userId: string) {
  try {
    const categories = await db
      .select()
      .from(customCategories)
      .where(eq(customCategories.userId, userId))
      .orderBy(customCategories.createdAt);
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Seed default categories for a new user (only adds missing defaults)
export async function seedDefaultCategories(userId: string): Promise<void> {
  try {
    // Get existing category names
    const existing = await db
      .select({ name: customCategories.name })
      .from(customCategories)
      .where(eq(customCategories.userId, userId));

    const existingNames = new Set(existing.map((c) => c.name));

    // Find missing default categories
    const missingDefaults = DEFAULT_CATEGORIES.filter(
      (cat) => !existingNames.has(cat.name)
    );

    if (missingDefaults.length === 0) {
      return; // All defaults exist
    }

    // Insert missing default categories
    await db.insert(customCategories).values(
      missingDefaults.map((cat) => ({
        userId,
        name: cat.name,
        color: cat.color,
      }))
    );
  } catch (error) {
    console.error("Error seeding default categories:", error);
  }
}

// Get categories with auto-seed for new users
export async function getCategoriesWithSeed(userId: string) {
  try {
    // First try to seed if needed
    await seedDefaultCategories(userId);
    
    // Then fetch all categories
    const categories = await db
      .select()
      .from(customCategories)
      .where(eq(customCategories.userId, userId))
      .orderBy(customCategories.createdAt);
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(
  userId: string,
  input: { name: string; color?: string }
): Promise<ActionResult<typeof customCategories.$inferSelect>> {
  try {
    const [category] = await db
      .insert(customCategories)
      .values({
        userId,
        name: input.name,
        color: input.color ?? "#6366f1",
      })
      .returning();

    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: { name?: string; color?: string }
): Promise<ActionResult<typeof customCategories.$inferSelect>> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (input.name) updateData.name = input.name;
    if (input.color) updateData.color = input.color;

    const [category] = await db
      .update(customCategories)
      .set(updateData)
      .where(and(eq(customCategories.id, categoryId), eq(customCategories.userId, userId)))
      .returning();

    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(
  userId: string,
  categoryId: string
): Promise<ActionResult<void>> {
  try {
    await db
      .delete(customCategories)
      .where(
        and(
          eq(customCategories.id, categoryId),
          eq(customCategories.userId, userId)
        )
      );
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
