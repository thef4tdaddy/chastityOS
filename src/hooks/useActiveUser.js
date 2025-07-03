import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to provide the current active user's UID from Firebase Auth.
 * Returns an object with activeUserId (string or null) and isAuthReady (boolean).
 */
export const useActiveUser = () => {
  const auth = getAuth();
  const [state, setState] = useState({
    activeUserId: auth.currentUser ? auth.currentUser.uid : null,
    isAuthReady: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({
        activeUserId: user ? user.uid : null,
        isAuthReady: true,
      });
    });
    return () => unsubscribe();
  }, [auth]);

  return state;
};