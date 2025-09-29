import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * @typedef {Object} KeyholderPermissions
 * @property {boolean} canModifyDuration
 * @property {boolean} canAssignTasks
 * @property {boolean} canViewHistory
 */

/**
 * @typedef {Object} KeyholderSessionState
 * @property {boolean} isActive
 * @property {string|null} keyholderEmail
 * @property {Date|null} sessionStartTime
 * @property {KeyholderPermissions} permissions
 * @property {number} [requiredDuration]
 */

/**
 * @typedef {Object} KeyholderSessionOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {string} [userEmail]
 */

/**
 * Hook for managing keyholder sessions
 * @param {KeyholderSessionOptions} options
 * @returns {Object}
 */
export const useKeyholderSession = ({ userId, isAuthReady }) => {
  const [sessionState, setSessionState] = useState({
    isActive: false,
    keyholderEmail: null,
    sessionStartTime: null,
    permissions: {
      canModifyDuration: false,
      canAssignTasks: false,
      canViewHistory: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const startKeyholderSession = useCallback(async (keyholderEmail, permissions = {}) => {
    if (!userId || !isAuthReady) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', userId);
      const newSessionState = {
        isActive: true,
        keyholderEmail,
        sessionStartTime: new Date(),
        permissions: {
          canModifyDuration: permissions.canModifyDuration ?? true,
          canAssignTasks: permissions.canAssignTasks ?? true,
          canViewHistory: permissions.canViewHistory ?? true
        }
      };

      await setDoc(userDocRef, { keyholderSession: newSessionState }, { merge: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start keyholder session');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady]);

  const endKeyholderSession = useCallback(async () => {
    if (!userId || !isAuthReady) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', userId);
      const endSessionState = {
        isActive: false,
        keyholderEmail: null,
        sessionStartTime: null,
        permissions: {
          canModifyDuration: false,
          canAssignTasks: false,
          canViewHistory: false
        }
      };

      await setDoc(userDocRef, { keyholderSession: endSessionState }, { merge: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end keyholder session');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady]);

  const updatePermissions = useCallback(async (newPermissions) => {
    if (!userId || !isAuthReady || !sessionState.isActive) {
      setError('No active keyholder session');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { 
        keyholderSession: {
          ...sessionState,
          permissions: { ...sessionState.permissions, ...newPermissions }
        }
      }, { merge: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady, sessionState]);

  useEffect(() => {
    if (!userId || !isAuthReady) {
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.keyholderSession) {
            setSessionState({
              ...data.keyholderSession,
              sessionStartTime: data.keyholderSession.sessionStartTime?.toDate() || null
            });
          }
        }
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [userId, isAuthReady]);

  return {
    sessionState,
    isLoading,
    error,
    startKeyholderSession,
    endKeyholderSession,
    updatePermissions,
    isKeyholderActive: sessionState.isActive && sessionState.keyholderEmail !== null
  };
};