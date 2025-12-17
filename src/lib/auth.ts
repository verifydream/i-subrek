import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Server-side auth utilities for accessing Clerk user ID
 * Use these in Server Components and Server Actions
 *
 * Requirements: 1.5
 */

/**
 * Gets the current user ID from Clerk auth
 * Returns null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Gets the current user ID or throws if not authenticated
 * Use this in protected routes/actions that require authentication
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User must be authenticated");
  }
  
  return userId;
}

/**
 * Gets the full current user object from Clerk
 * Returns null if not authenticated
 */
export async function getUser() {
  return await currentUser();
}
