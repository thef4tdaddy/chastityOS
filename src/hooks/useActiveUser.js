import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to provide the current active user's UID from Firebase Auth.
 * Returns null if not logged in.
 */
export const useActiveUser = () => {
  const [state, setState] = useState(() => {
    const auth = getAuth();
    return {
      activeUserId: auth.currentUser ? auth.currentUser.uid : null,
      isAuthReady: false,
    };
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({
        activeUserId: user ? user.uid : null,
        isAuthReady: true,
      });
    });
    return () => unsubscribe();
  }, []);

  return state;
};