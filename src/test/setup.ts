import { expect, vi } from "vitest";
import * as fc from "fast-check";

// Configure fast-check defaults for property-based testing
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property as per design doc
  verbose: true,
});

// Common test utilities

/**
 * Generate a random UUID v4 string
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a random date within a range
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Re-export fast-check for convenience
export { fc };
