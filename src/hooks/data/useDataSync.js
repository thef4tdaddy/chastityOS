import { useEffect, useCallback, useState, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * @typedef {Object} DataSyncOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {boolean} [autoSync=true]
 */

/**
 * @typedef {Object} SyncState
 * @property {boolean} isLoading
 * @property {Date|null} lastSynced
 * @property {string|null} error
 */

/**
 * Hook for syncing data with Firestore
 * @param {DataSyncOptions} options
 * @returns {Object}
 */
export const useDataSync = ({ userId, isAuthReady, autoSync = true }) => {
  const [syncState, setSyncState] = useState({
    isLoading: false,
    lastSynced: null,
    error: null,
  });

  const unsubscribeRef = useRef(null);

  const syncData = useCallback(
    async (data) => {
      if (!userId || !isAuthReady) {
        setSyncState((prev) => ({ ...prev, error: "User not authenticated" }));
        return;
      }

      setSyncState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const docRef = doc(db, "users", userId);
        await setDoc(docRef, data, { merge: true });
        setSyncState((prev) => ({
          ...prev,
          isLoading: false,
          lastSynced: new Date(),
          error: null,
        }));
      } catch (error) {
        setSyncState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Sync failed",
        }));
      }
    },
    [userId, isAuthReady],
  );

  useEffect(() => {
    if (!autoSync || !userId || !isAuthReady) {
      return;
    }

    const docRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSyncState((prev) => ({
            ...prev,
            lastSynced: new Date(),
            error: null,
          }));
        }
      },
      (error) => {
        setSyncState((prev) => ({
          ...prev,
          error: error.message,
        }));
      },
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId, isAuthReady, autoSync]);

  return {
    syncState,
    syncData,
  };
};
