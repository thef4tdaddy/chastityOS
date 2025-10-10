/**
 * Generates a SHA-256 hash of a given string.
 * @param {string} string - The input string to hash.
 * @returns {Promise<string>} The SHA-256 hash as a hex string.
 */
export async function sha256(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Generates a 6-character, easy-to-read backup code.
 * @returns {string} The generated backup code.
 */
export function generateBackupCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
