import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Handles showing the welcome modal and persisting acceptance in Firestore.
 * @param {string} userId - Current user ID.
 * @param {boolean} isAuthReady - Flag from auth hook.
 */
export function useWelcome(userId, isAuthReady) {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchAcceptance = async () => {
      const userDocRef = doc(db, 'users', userId);
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          setHasAccepted(!!snap.data().welcomeAccepted);
        } else {
          await setDoc(userDocRef, { welcomeAccepted: false }, { merge: true });
          setHasAccepted(false);
        }
      } catch (err) {
        console.error('Failed to load acceptance info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcceptance();
  }, [userId, isAuthReady]);

  const accept = useCallback(async () => {
    if (!isAuthReady || !userId) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      await setDoc(userDocRef, { welcomeAccepted: true }, { merge: true });
      setHasAccepted(true);
    } catch (err) {
      console.error('Failed to record acceptance:', err);
    }
  }, [userId, isAuthReady]);

  return { hasAccepted, isLoading, accept };
}
