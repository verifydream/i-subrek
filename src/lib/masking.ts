/**
 * Payment method masking utilities
 * Handles secure masking of payment method numbers to show only last 4 digits
 *
 * Requirements: 3.1, 3.3
 */

/**
 * Extracts the last 4 digits from a payment method number string.
 * Filters out non-numeric characters before extraction.
 *
 * @param fullNumber - The full payment method number (may contain spaces, dashes, etc.)
 * @returns The last 4 digits, or all digits if fewer than 4 exist
 */
export function extractLastFourDigits(fullNumber: string): string {
  // Remove all non-numeric characters
  const digitsOnly = fullNumber.replace(/\D/g, "");

  // Return last 4 digits, or all digits if fewer than 4
  if (digitsOnly.length <= 4) {
    return digitsOnly;
  }

  return digitsOnly.slice(-4);
}

/**
 * Masks a payment method number, showing only the last 4 digits.
 * Returns format "**** XXXX" where XXXX are the last 4 digits.
 *
 * @param fullNumber - The full payment method number
 * @returns Masked string in format "**** XXXX", or the digits if fewer than 4
 */
export function maskPaymentMethod(fullNumber: string): string {
  const lastFour = extractLastFourDigits(fullNumber);

  // If we have fewer than 4 digits, just return what we have (edge case)
  if (lastFour.length < 4) {
    return lastFour;
  }

  return `**** ${lastFour}`;
}
