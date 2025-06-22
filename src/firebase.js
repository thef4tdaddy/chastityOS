import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, setAnalyticsCollectionEnabled } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId has been removed to allow Firebase to fetch the correct ID from the server.
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
console.log("✅ Firebase Project ID:", firebaseConfig.projectId);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

/**
 * Enables or disables analytics data collection based on user consent.
 * @param {boolean} enabled - True to enable, false to disable.
 */
export const toggleAnalyticsCollection = (enabled) => {
  if (typeof window !== 'undefined') {
    setAnalyticsCollectionEnabled(analytics, enabled);
    console.log(`[Analytics] Collection is now ${enabled ? 'ENABLED' : 'DISABLED'}.`);
  }
};
