import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
// FIX: Removed unused 'hash' import to resolve the ESLint warning.

export const useSettings = (userId, isAuthReady) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return undefined;
    }

    const settingsDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data().settings || {});
      } else {
        const initialSettings = {
          display: {
            showTimer: true,
            showTasks: true,
            showSessionInfo: true,
          },
          keyholder: {},
          personalGoal: {
            goalDurationSeconds: 0,
            isSelfLocked: false,
          },
        };
        setDoc(settingsDocRef, { settings: initialSettings });
        setSettings(initialSettings);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, isAuthReady]);

  const updateSettings = useCallback(async (newSettings) => {
    if (!userId) return;
    const settingsDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(settingsDocRef, { settings: newSettings });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  }, [userId]);

  return { settings, isLoading, updateSettings };
};
