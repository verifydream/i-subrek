import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { maskPaymentMethod, extractLastFourDigits } from "../masking";

// Custom arbitrary for digit strings
const digitString = (minLength: number, maxLength: number) =>
  fc
    .array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"), {
      minLength,
      maxLength,
    })
    .map((arr) => arr.join(""));

describe("Payment Method Masking", () => {
  /**
   * **Feature: isubrek-subscription-tracker, Property 7: Payment Method Masking**
   *
   * *For any* payment method number string of 4 or more digits, the masking function
   * SHALL extract only the last 4 digits and return a string in the format "**** XXXX"
   * where XXXX are the last 4 digits.
   *
   * **Validates: Requirements 3.1, 3.3**
   */
  describe("Property 7: Payment Method Masking", () => {
    it("should mask payment methods with 4+ digits to format '**** XXXX'", () => {
      fc.assert(
        fc.property(digitString(4, 20), (digitsOnly) => {
          const masked = maskPaymentMethod(digitsOnly);
          const lastFour = digitsOnly.slice(-4);

          // Should be in format "**** XXXX"
          expect(masked).toBe(`**** ${lastFour}`);
          expect(masked).toMatch(/^\*\*\*\* \d{4}$/);
        })
      );
    });

    it("should extract only the last 4 digits regardless of input format", () => {
      fc.assert(
        fc.property(
          fc.tuple(digitString(4, 16), fc.constantFrom("", " ", "-", " - ")),
          ([digits, separator]) => {
            // Create formatted number with separators
            const formatted = digits.match(/.{1,4}/g)?.join(separator) ?? digits;
            const extracted = extractLastFourDigits(formatted);

            // Should always extract the last 4 digits
            expect(extracted).toBe(digits.slice(-4));
            expect(extracted).toHaveLength(4);
          }
        )
      );
    });

    it("should handle mixed alphanumeric input by filtering non-digits", () => {
      fc.assert(
        fc.property(
          digitString(4, 16),
          fc
            .array(fc.constantFrom("a", "b", "X", "Y", " ", "-"), {
              minLength: 0,
              maxLength: 5,
            })
            .map((arr) => arr.join("")),
          (digits, noise) => {
            // Interleave noise into the digit string
            const mixed = digits
              .split("")
              .map((d, i) => (i % 3 === 0 ? noise[0] ?? "" : "") + d)
              .join("");

            const extracted = extractLastFourDigits(mixed);
            expect(extracted).toBe(digits.slice(-4));
          }
        )
      );
    });
  });

  describe("Edge Cases", () => {
    it("should return digits as-is when fewer than 4 digits", () => {
      expect(extractLastFourDigits("123")).toBe("123");
      expect(extractLastFourDigits("12")).toBe("12");
      expect(extractLastFourDigits("1")).toBe("1");
      expect(extractLastFourDigits("")).toBe("");
    });

    it("should return short digits without masking prefix", () => {
      expect(maskPaymentMethod("123")).toBe("123");
      expect(maskPaymentMethod("12")).toBe("12");
      expect(maskPaymentMethod("1")).toBe("1");
      expect(maskPaymentMethod("")).toBe("");
    });

    it("should handle exactly 4 digits", () => {
      expect(maskPaymentMethod("1234")).toBe("**** 1234");
      expect(extractLastFourDigits("1234")).toBe("1234");
    });
  });
});
