import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to provide the current active user's UID from Firebase Auth.
 * Returns null if not logged in.
 */
export const useActiveUser = () => {
  const [activeUserId, setActiveUserId] = useState(() => {
    const auth = getAuth();
    return auth.currentUser ? auth.currentUser.uid : null;
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setActiveUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  return activeUserId;
};