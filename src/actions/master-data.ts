"use server";

/**
 * Server Actions for Master Data (Payment Methods & Account Credentials)
 */

import { db } from "@/db";
import { paymentMethods, accountCredentials } from "@/db/master-schema";
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
