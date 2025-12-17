import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";
import { encryptPassword, decryptPassword } from "../encryption";

describe("Password Encryption", () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    // Set a test encryption key (32 bytes for AES-256)
    process.env.ENCRYPTION_KEY = "test-encryption-key-32-bytes!!!";
  });

  afterAll(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  /**
   * **Feature: isubrek-subscription-tracker, Property 8: Password Encryption Round-Trip**
   *
   * *For any* plain text password string, encrypting and then decrypting
   * SHALL return the original password string.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  describe("Property 8: Password Encryption Round-Trip", () => {
    it("should return original password after encrypt then decrypt", () => {
      fc.assert(
        fc.property(
          // Generate arbitrary password strings (including unicode)
          fc.string({ minLength: 1, maxLength: 100 }),
          (password) => {
            const encrypted = encryptPassword(password);
            const decrypted = decryptPassword(encrypted);

            expect(decrypted).toBe(password);
          }
        )
      );
    });

    it("should produce different ciphertext for same password (due to random IV)", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), (password) => {
          const encrypted1 = encryptPassword(password);
          const encrypted2 = encryptPassword(password);

          // Same password should produce different ciphertext
          expect(encrypted1).not.toBe(encrypted2);

          // But both should decrypt to the same value
          expect(decryptPassword(encrypted1)).toBe(password);
          expect(decryptPassword(encrypted2)).toBe(password);
        })
      );
    });

    it("should handle special characters and unicode", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50, unit: "grapheme" }), (password) => {
          const encrypted = encryptPassword(password);
          const decrypted = decryptPassword(encrypted);

          expect(decrypted).toBe(password);
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const encrypted = encryptPassword("");
      const decrypted = decryptPassword(encrypted);
      expect(decrypted).toBe("");
    });

    it("should handle very long passwords", () => {
      const longPassword = "a".repeat(1000);
      const encrypted = encryptPassword(longPassword);
      const decrypted = decryptPassword(encrypted);
      expect(decrypted).toBe(longPassword);
    });

    it("should throw on invalid ciphertext", () => {
      expect(() => decryptPassword("invalid-base64!@#")).toThrow();
    });
  });
});
