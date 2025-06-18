// FIX: Rewritten to use the browser-compatible 'bcryptjs' library.
import bcrypt from 'bcryptjs';

/**
 * Hashes a password using bcrypt. The salt is generated and included in the output hash.
 * @param {string} password The plaintext password to hash.
 * @returns {string} The resulting hash.
 */
export function hashPassword(password) {
  // 10 is the number of salt rounds. More rounds are more secure but slower.
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * @param {string} password The plaintext password to verify.
 * @param {string} storedHash The hash to compare against, fetched from storage.
 * @returns {boolean} True if the password matches the hash, false otherwise.
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }
  return bcrypt.compareSync(password, storedHash);
}

// Maintaining the old export names for any part of the app that might still use them.
// These now point to the new bcryptjs implementations.
export { hashPassword as hash };
export { verifyPassword as verify };
