import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function generateKeyholderToken(userId) {
  if (!userId) return null;
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  await setDoc(doc(db, 'keyholderLinks', token), { userId });
  return token;
}

export async function getUserIdFromKeyholderToken(token) {
  if (!token) return null;
  const snap = await getDoc(doc(db, 'keyholderLinks', token));
  return snap.exists() ? snap.data().userId : null;
}
