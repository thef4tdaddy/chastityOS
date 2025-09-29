import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { KeyholderSession, KeyholderPermissions } from '../../types';

interface UseKeyholderSessionProps {
  userId: string;
  isAuthReady: boolean;
  keyholderName?: string;
}

interface UseKeyholderSessionReturn {
  keyholderSession: KeyholderSession | null;
  isActive: boolean;
  permissions: KeyholderPermissions | null;
  isLoading: boolean;
  error: string | null;
  startSession: (keyholderName: string, permissions: KeyholderPermissions) => Promise<void>;
  endSession: () => Promise<void>;
  updatePermissions: (permissions: Partial<KeyholderPermissions>) => Promise<void>;
  updateKeyholderName: (name: string) => Promise<void>;
}

const defaultPermissions: KeyholderPermissions = {
  canApproveTasks: false,
  canAddPunishments: false,
  canAddRewards: false,
  canModifyDuration: false,
  canLockControls: false,
};

export function useKeyholderSession({ 
  userId, 
  isAuthReady, 
  keyholderName 
}: UseKeyholderSessionProps): UseKeyholderSessionReturn {
  const [keyholderSession, setKeyholderSession] = useState<KeyholderSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getKeyholderDocRef = useCallback(() => {
    if (!userId) return null;
    return doc(db, 'users', userId, 'keyholderSession', 'current');
  }, [userId]);

  // Set up real-time listener for keyholder session
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      setKeyholderSession(null);
      return;
    }

    const keyholderDocRef = getKeyholderDocRef();
    if (!keyholderDocRef) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      keyholderDocRef,
      (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const session: KeyholderSession = {
              keyholderName: data.keyholderName || keyholderName,
              isActive: data.isActive || false,
              startTime: data.startTime?.toDate(),
              endTime: data.endTime?.toDate(),
              permissions: { ...defaultPermissions, ...data.permissions },
            };
            setKeyholderSession(session);
          } else {
            setKeyholderSession(null);
          }
          setError(null);
        } catch (err) {
          console.error('Error processing keyholder session data:', err);
          setError(err instanceof Error ? err.message : 'Failed to process session data');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to keyholder session:', err);
        setError(err instanceof Error ? err.message : 'Failed to listen to session changes');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, userId, keyholderName, getKeyholderDocRef]);

  const startSession = useCallback(async (
    sessionKeyholderName: string, 
    permissions: KeyholderPermissions
  ) => {
    try {
      setError(null);
      const keyholderDocRef = getKeyholderDocRef();
      if (!keyholderDocRef) {
        throw new Error('No keyholder document reference available');
      }

      if (!sessionKeyholderName.trim()) {
        throw new Error('Keyholder name is required');
      }

      const sessionData = {
        keyholderName: sessionKeyholderName.trim(),
        isActive: true,
        startTime: new Date(),
        endTime: null,
        permissions,
      };

      await setDoc(keyholderDocRef, sessionData);

      // Also update the main user document with keyholder name
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        keyholderName: sessionKeyholderName.trim(),
      });
    } catch (err) {
      console.error('Error starting keyholder session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start keyholder session');
      throw err;
    }
  }, [userId, getKeyholderDocRef]);

  const endSession = useCallback(async () => {
    try {
      setError(null);
      const keyholderDocRef = getKeyholderDocRef();
      if (!keyholderDocRef) return;

      await updateDoc(keyholderDocRef, {
        isActive: false,
        endTime: new Date(),
      });
    } catch (err) {
      console.error('Error ending keyholder session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end keyholder session');
      throw err;
    }
  }, [getKeyholderDocRef]);

  const updatePermissions = useCallback(async (newPermissions: Partial<KeyholderPermissions>) => {
    try {
      setError(null);
      if (!keyholderSession || !keyholderSession.isActive) {
        throw new Error('No active keyholder session to update');
      }

      const keyholderDocRef = getKeyholderDocRef();
      if (!keyholderDocRef) return;

      const updatedPermissions = { ...keyholderSession.permissions, ...newPermissions };
      
      await updateDoc(keyholderDocRef, {
        permissions: updatedPermissions,
      });
    } catch (err) {
      console.error('Error updating keyholder permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
      throw err;
    }
  }, [keyholderSession, getKeyholderDocRef]);

  const updateKeyholderName = useCallback(async (name: string) => {
    try {
      setError(null);
      if (!name.trim()) {
        throw new Error('Keyholder name cannot be empty');
      }

      const keyholderDocRef = getKeyholderDocRef();
      if (!keyholderDocRef) return;

      await updateDoc(keyholderDocRef, {
        keyholderName: name.trim(),
      });

      // Also update the main user document
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        keyholderName: name.trim(),
      });
    } catch (err) {
      console.error('Error updating keyholder name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update keyholder name');
      throw err;
    }
  }, [userId, getKeyholderDocRef]);

  return {
    keyholderSession,
    isActive: keyholderSession?.isActive || false,
    permissions: keyholderSession?.permissions || null,
    isLoading,
    error,
    startSession,
    endSession,
    updatePermissions,
    updateKeyholderName,
  };
}