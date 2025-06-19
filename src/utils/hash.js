// src/utils/hash.js

/**
 * Hashes a string using the SHA-256 algorithm.
 * This is a one-way process.
 * @param {string} input The string to hash.
 * @returns {Promise<string>} The resulting hash as a hexadecimal string.
 */
export async function generateSecureHash(input) {
  // Ensure the input is a string
  const stringInput = String(input);
  // Encode the string into a buffer of bytes
  const textAsBuffer = new TextEncoder().encode(stringInput);
  // Use the browser's built-in crypto library to perform the hash
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', textAsBuffer);
  // Convert the buffer into an array of bytes
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert each byte to a 2-character hexadecimal string and join them
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Compares a raw input string with a stored SHA-256 hash to see if they match.
 * @param {string} input The raw string to check (e.g., the backup code entered by the user).
 * @param {string} hash The stored hash to compare against.
 * @returns {Promise<boolean>} True if the input hashes to the same value, false otherwise.
 */
export async function verifyHash(input, hash) {
  // Hash the raw input string using the same method
  const inputHash = await generateSecureHash(input);
  // Compare the newly generated hash with the stored hash
  return inputHash === hash;
}
