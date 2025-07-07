

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
console.log("✅ Firebase Project ID:", firebaseConfig.projectId);

export const db = getFirestore(app);
// Enable offline persistence so the app can queue writes and cache reads
// when the user is offline. This allows the PWA to function smoothly
// without an internet connection and sync changes once connectivity returns.
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('IndexedDB persistence could not be enabled', err);
});
export const auth = getAuth(app);
export const storage = getStorage(app);
