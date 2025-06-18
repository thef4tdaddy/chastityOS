import { sha256 } from 'js-sha256';

/**
 * Hashes a string using SHA256.
 * @param {string} data The plaintext data to hash.
 * @returns {string} The resulting SHA256 hash.
 */
export function hash(data) {
  if (typeof data !== 'string') return '';
  return sha256(data);
}

/**
 * Verifies plaintext data against a stored SHA256 hash.
 * @param {string} data The plaintext data to verify.
 * @param {string} storedHash The hash to compare against.
 * @returns {boolean} True if the data matches the hash, false otherwise.
 */
export function verify(data, storedHash) {
  if (typeof data !== 'string' || !storedHash) {
    return false;
  }
  return sha256(data) === storedHash;
}

// Maintaining the old export names for any part of the app that might still use them.
export { hash as hashPassword };
export { verify as verifyPassword };
