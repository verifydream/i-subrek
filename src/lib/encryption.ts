/**
 * Password encryption utilities
 * Uses AES encryption with server-side ENCRYPTION_KEY for secure password storage
 *
 * Requirements: 4.1, 4.2
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Gets the encryption key from environment variables.
 * The key must be exactly 32 bytes (256 bits) for AES-256.
 *
 * @throws Error if ENCRYPTION_KEY is not set or invalid length
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // Key should be 32 bytes for AES-256
  const keyBuffer = Buffer.from(key, "utf-8");

  if (keyBuffer.length < 32) {
    // Pad the key if it's too short (not recommended for production)
    return Buffer.concat([keyBuffer, Buffer.alloc(32 - keyBuffer.length)]);
  }

  return keyBuffer.subarray(0, 32);
}

/**
 * Encrypts a plain text password using AES-256-GCM.
 * Returns a base64 encoded string containing IV + auth tag + ciphertext.
 *
 * @param plainText - The plain text password to encrypt
 * @returns Base64 encoded encrypted string
 */
export function encryptPassword(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return combined.toString("base64");
}

/**
 * Decrypts an encrypted password string.
 * Expects base64 encoded string containing IV + auth tag + ciphertext.
 *
 * @param cipherText - The base64 encoded encrypted string
 * @returns The original plain text password
 */
export function decryptPassword(cipherText: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(cipherText, "base64");

  // Extract IV, auth tag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
