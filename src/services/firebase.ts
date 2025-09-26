/**
 * Optimized Firebase configuration with lazy loading and bundle splitting
 * Core services are loaded immediately, others on-demand
 */
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("Firebase");

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = (): void => {
  const requiredKeys = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ] as const;

  const missingKeys = requiredKeys.filter((key) => !import.meta.env[key]);

  if (missingKeys.length > 0) {
    logger.error("Missing required Firebase environment variables", {
      missingKeys,
    });
    throw new Error(`Missing Firebase config: ${missingKeys.join(", ")}`);
  }

  logger.info("Firebase configuration validated", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
};

// Lazy loading promises cache
const serviceCache = new Map<string, Promise<unknown>>();

/**
 * Get Firebase App (loaded immediately)
 */
export const getFirebaseApp = async () => {
  if (!serviceCache.has("app")) {
    validateFirebaseConfig();

    serviceCache.set(
      "app",
      import("firebase/app").then(
        async ({ initializeApp, getApps, getApp }) => {
          const app = getApps().length
            ? getApp()
            : initializeApp(firebaseConfig);
          logger.info("Firebase app initialized");
          return app;
        },
      ),
    );
  }
  return serviceCache.get("app");
};

/**
 * Get Firebase Auth (lazy loaded)
 */
export const getFirebaseAuth = async () => {
  if (!serviceCache.has("auth")) {
    serviceCache.set(
      "auth",
      Promise.all([getFirebaseApp(), import("firebase/auth")]).then(
        ([app, { getAuth }]) => {
          const auth = getAuth(app);
          logger.debug("Firebase Auth loaded");
          return auth;
        },
      ),
    );
  }
  return serviceCache.get("auth") as Promise<Auth>;
};

/**
 * Get Firestore (lazy loaded with offline persistence)
 */
export const getFirestore = async () => {
  if (!serviceCache.has("firestore")) {
    serviceCache.set(
      "firestore",
      Promise.all([getFirebaseApp(), import("firebase/firestore")]).then(
        ([app, firestoreModule]) => {
          const {
            initializeFirestore,
            persistentLocalCache,
            persistentMultipleTabManager,
          } = firestoreModule;

          const db = initializeFirestore(app, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          });

          logger.debug("Firestore loaded with offline persistence");
          return db;
        },
      ),
    );
  }
  return serviceCache.get("firestore") as Promise<Firestore>;
};

/**
 * Get Firebase Storage (lazy loaded)
 */
export const getFirebaseStorage = async () => {
  if (!serviceCache.has("storage")) {
    serviceCache.set(
      "storage",
      Promise.all([getFirebaseApp(), import("firebase/storage")]).then(
        ([app, { getStorage }]) => {
          const storage = getStorage(app);
          logger.debug("Firebase Storage loaded");
          return storage;
        },
      ),
    );
  }
  return serviceCache.get("storage");
};

/**
 * Preload critical services during app startup
 */
export const preloadCriticalServices = async (): Promise<void> => {
  logger.debug("Preloading critical Firebase services");

  await Promise.all([
    getFirebaseApp(),
    getFirebaseAuth(), // Most users will need auth
  ]);

  logger.info("Critical Firebase services preloaded");
};

/**
 * Check if we should preload all services (premium users, good connection, etc.)
 */
export const shouldPreloadAll = (): boolean => {
  // Check connection type and user type
  const connection = (
    navigator as unknown as { connection?: { effectiveType: string } }
  ).connection;
  const isGoodConnection = !connection || connection.effectiveType === "4g";
  const isPremiumUser = false; // Would check user status

  return isGoodConnection || isPremiumUser;
};

/**
 * Preload all services conditionally
 */
export const conditionalPreloadAll = async (): Promise<void> => {
  if (shouldPreloadAll()) {
    logger.debug("Preloading all Firebase services (good connection detected)");
    await Promise.all([
      getFirebaseApp(),
      getFirebaseAuth(),
      getFirestore(),
      getFirebaseStorage(),
    ]);
    logger.info("All Firebase services preloaded");
  }
};

// Compatibility exports for immediate access (will be lazy loaded)
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export const auth = new Proxy({} as Auth, {
  get(target, prop) {
    if (!_auth) {
      throw new Error(
        "Firebase Auth not initialized. Use getFirebaseAuth() for lazy loading.",
      );
    }
    return (_auth as Record<string | symbol, unknown>)[prop];
  },
});

export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    if (!_db) {
      throw new Error(
        "Firestore not initialized. Use getFirestore() for lazy loading.",
      );
    }
    return (_db as Record<string | symbol, unknown>)[prop];
  },
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(target, prop) {
    if (!_storage) {
      throw new Error(
        "Firebase Storage not initialized. Use getFirebaseStorage() for lazy loading.",
      );
    }
    return (_storage as Record<string | symbol, unknown>)[prop];
  },
});

// Initialize compatibility exports
getFirebaseAuth().then((authInstance) => {
  _auth = authInstance;
});
getFirestore().then((dbInstance) => {
  _db = dbInstance;
});
getFirebaseStorage().then((storageInstance) => {
  _storage = storageInstance;
});

// Export configuration for debugging
export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  isDevelopment:
    import.meta.env.MODE === "development" ||
    import.meta.env.MODE === "nightly",
});
