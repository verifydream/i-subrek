"use client";

/**
 * Auth utility hook for accessing Clerk user ID
 * Provides convenient access to the authenticated user's ID for client components
 *
 * Requirements: 1.5
 */

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

/**
 * Custom hook for accessing authentication state and user ID
 * Wraps Clerk's useAuth and useUser hooks for convenient access
 */
export function useAuth() {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { user } = useUser();

  return {
    /** Whether the auth state has loaded */
    isLoaded,
    /** Whether the user is signed in */
    isSignedIn,
    /** The Clerk user ID (null if not signed in) */
    userId,
    /** The full user object from Clerk */
    user,
  };
}

/**
 * Hook that returns the user ID or throws if not authenticated
 * Use this in components that require authentication
 */
export function useRequiredAuth() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  if (!isLoaded) {
    return { isLoading: true, userId: null as string | null };
  }

  if (!isSignedIn || !userId) {
    throw new Error("User must be authenticated");
  }

  return { isLoading: false, userId };
}
