/**
 * Hashes a string using the SHA-256 algorithm.
 * @param {string} string - The string to hash.
 * @returns {Promise<string>} A promise that resolves to the hex-encoded hash.
 */
const hashSHA256 = async (string) => {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Export the function
export { hashSHA256 };
