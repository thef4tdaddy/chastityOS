import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generates a secure keyholder token linked to a userId.
 * Stores the token with userId and createdAt timestamp in 'keyholderLinks'.
 * @param {string} userId - The user ID to link the token to.
 * @param {string} ownerUid - The owner UID who owns this token.
 * @returns {Promise<string|null>} The generated token or null if userId is not provided.
 */
export async function generateKeyholderToken(userId, ownerUid) {
  if (!userId || !ownerUid) return null;
  const token = generateSecureToken(6);
  const now = serverTimestamp();
  await setDoc(doc(db, 'keyholderLinks', token), { userId, createdAt: now });
  return token;
}

/**
 * Retrieves the userId associated with a given keyholder token.
 * @param {string} token - The keyholder token.
 * @returns {Promise<string|null>} The userId if token exists, otherwise null.
 */
export async function getUserIdFromKeyholderToken(token) {
  if (!token) return null;
  const snap = await getDoc(doc(db, 'keyholderLinks', token));
  return snap.exists() ? snap.data().userId : null;
}

/**
 * Creates an account link record explicitly linking a linkedUid to an ownerUid.
 * @param {string} linkedUid - The UID being linked.
 * @param {string} ownerUid - The owner UID.
 * @returns {Promise<void>}
 */
export async function createAccountLinkForLinkedUid(linkedUid, ownerUid) {
  if (!linkedUid || !ownerUid) throw new Error('linkedUid and ownerUid are required');
  const now = serverTimestamp();
  const docId = `${ownerUid}_${linkedUid}`;
  await setDoc(doc(db, 'accountLinks', docId), { linkedUid, ownerUid, createdAt: now });
}

/**
 * Deletes a keyholder token.
 * @param {string} token - The token to delete.
 * @returns {Promise<void>}
 */
export async function deleteKeyholderToken(token) {
  if (!token) return;
  await deleteDoc(doc(db, 'keyholderLinks', token));
}

/**
 * Deletes an account link record.
 * @param {string} ownerUid - The owner UID.
 * @param {string} linkedUid - The linked UID.
 * @returns {Promise<void>}
 */
export async function deleteAccountLink(ownerUid, linkedUid) {
  if (!ownerUid || !linkedUid) return;
  const docId = `${ownerUid}_${linkedUid}`;
  await deleteDoc(doc(db, 'accountLinks', docId));
}

/**
 * Generates a secure random alphanumeric token of given length.
 * @param {number} length - Length of the token.
 * @returns {string} The generated token.
 */
function generateSecureToken(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => charset[x % charset.length]).join('');
}
