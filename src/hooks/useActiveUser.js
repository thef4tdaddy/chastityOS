import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to provide the current active user's UID from Firebase Auth.
 * Returns an object with activeUserId (string or null) and isAuthReady (boolean).
 */
export const useActiveUser = () => {
  const auth = getAuth();
  const [state, setState] = useState({
    activeUserId: undefined,
    isAuthReady: false,
  });

  useEffect(() => {
    console.log('[useActiveUser] Subscribing to onAuthStateChanged...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[useActiveUser] onAuthStateChanged fired. User:', user);
      setState({
        activeUserId: user ? user.uid : null,
        isAuthReady: true,
      });
    });
    return () => {
      console.log('[useActiveUser] Unsubscribing...');
      unsubscribe();
    };
  }, [auth]);

  return state;
};