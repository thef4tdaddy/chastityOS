/**
 * Firebase re-export for backward compatibility
 * Main implementation is in src/services/firebase.ts
 */
export {
  db,
  auth,
  storage,
  getFirebaseApp,
  getFirebaseAuth,
  getFirestore,
  getFirebaseStorage,
  preloadCriticalServices,
  conditionalPreloadAll,
  getFirebaseConfig,
} from "./services/firebase";
