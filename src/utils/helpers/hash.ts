/**
 * Hash and code generation utilities
 */

/**
 * Generates a SHA-256 hash of a given string.
 * @param input - The input string to hash
 * @returns The SHA-256 hash as a hex string
 */
export async function sha256(input: string): Promise<string> {
  const utf8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Generates a 6-character, easy-to-read backup code.
 * Excludes confusing characters like 0, O, 1, I for better readability
 * @returns The generated backup code
 */
export function generateBackupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a random ID string
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 */
export function generateId(length = 8): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a UUID v4
 * @returns UUID v4 string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
