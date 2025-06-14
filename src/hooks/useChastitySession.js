import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// This hook now only contains logic for managing the chastity session state.
export const useChastitySession = (currentUser, isRestoring) => {
  const [chastityState, setChastityState] = useState({
    isActive: false,
    sessions: [],
    chastityHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    // If there's no user or if data is being restored, don't fetch from Firestore.
    if (!currentUser || isRestoring) {
      setLoading(false);
      if (!isRestoring) setInitialCheckComplete(true);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', currentUser.uid);

    // Set up a real-time listener for the user's session data.
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().chastityState) {
        setChastityState(docSnap.data().chastityState);
      } else {
        // If no state exists in Firestore, initialize with a default object.
        setChastityState({
          isActive: false,
          sessions: [],
          chastityHistory: [],
        });
      }
      setLoading(false);
      setInitialCheckComplete(true);
    }, (error) => {
      console.error("Error fetching chastity state:", error);
      setLoading(false);
      setInitialCheckComplete(true);
    });

    // Clean up the listener when the component unmounts or dependencies change.
    return () => unsubscribe();
  }, [currentUser, isRestoring]);

  return { chastityState, setChastityState, loading, setLoading, initialCheckComplete };
};
