import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { MultiWearerSession, Wearer, KeyholderPermissions, SessionData } from '../../types';

interface UseMultiWearerProps {
  keyholderUserId: string;
  isAuthReady: boolean;
}

interface UseMultiWearerReturn {
  session: MultiWearerSession | null;
  wearers: Wearer[];
  isLoading: boolean;
  error: string | null;
  createSession: () => Promise<void>;
  endSession: () => Promise<void>;
  addWearer: (wearerData: Omit<Wearer, 'id'>) => Promise<void>;
  removeWearer: (wearerId: string) => Promise<void>;
  updateWearer: (wearerId: string, updates: Partial<Wearer>) => Promise<void>;
  updateWearerPermissions: (wearerId: string, permissions: Partial<KeyholderPermissions>) => Promise<void>;
  updateWearerSession: (wearerId: string, sessionData: Partial<SessionData>) => Promise<void>;
  activateWearer: (wearerId: string) => Promise<void>;
  deactivateWearer: (wearerId: string) => Promise<void>;
}

const defaultPermissions: KeyholderPermissions = {
  canApproveTasks: false,
  canAddPunishments: false,
  canAddRewards: false,
  canModifyDuration: false,
  canLockControls: false,
};

export function useMultiWearer({ 
  keyholderUserId, 
  isAuthReady 
}: UseMultiWearerProps): UseMultiWearerReturn {
  const [session, setSession] = useState<MultiWearerSession | null>(null);
  const [wearers, setWearers] = useState<Wearer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getMultiWearerCollectionRef = useCallback(() => {
    return collection(db, 'multiWearerSessions');
  }, []);

  const getWearersCollectionRef = useCallback((sessionId: string) => {
    return collection(db, 'multiWearerSessions', sessionId, 'wearers');
  }, []);

  // Set up real-time listener for multi-wearer session
  useEffect(() => {
    if (!isAuthReady || !keyholderUserId) {
      setIsLoading(false);
      setSession(null);
      setWearers([]);
      return;
    }

    const multiWearerCollectionRef = getMultiWearerCollectionRef();
    const q = query(
      multiWearerCollectionRef, 
      where('keyholderUserId', '==', keyholderUserId),
      where('isActive', '==', true)
    );

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            const sessionData: MultiWearerSession = {
              keyholderUserId: data.keyholderUserId,
              wearers: [],
              isActive: data.isActive || false,
              createdAt: data.createdAt?.toDate() || new Date(),
              lastUpdated: data.lastUpdated?.toDate() || new Date(),
            };
            setSession({ ...sessionData, wearers: [] });
            
            // Set up listener for wearers
            const wearersCollectionRef = getWearersCollectionRef(doc.id);
            const wearersUnsubscribe = onSnapshot(
              wearersCollectionRef,
              (wearersSnapshot) => {
                const wearersData: Wearer[] = wearersSnapshot.docs.map(wearerDoc => {
                  const wearerData = wearerDoc.data();
                  return {
                    id: wearerDoc.id,
                    name: wearerData.name || '',
                    email: wearerData.email,
                    isActive: wearerData.isActive || false,
                    sessionData: wearerData.sessionData || {},
                    tasks: wearerData.tasks || [],
                    keyholderPermissions: { ...defaultPermissions, ...wearerData.keyholderPermissions },
                  };
                });
                setWearers(wearersData);
                setSession(prev => prev ? { ...prev, wearers: wearersData } : null);
              }
            );

            return () => wearersUnsubscribe();
          } else {
            setSession(null);
            setWearers([]);
          }
          setError(null);
        } catch (err) {
          console.error('Error processing multi-wearer session data:', err);
          setError(err instanceof Error ? err.message : 'Failed to process session data');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to multi-wearer session:', err);
        setError(err instanceof Error ? err.message : 'Failed to listen to session changes');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, keyholderUserId, getMultiWearerCollectionRef, getWearersCollectionRef]);

  const createSession = useCallback(async () => {
    try {
      setError(null);
      if (!keyholderUserId) {
        throw new Error('Keyholder user ID is required');
      }

      const multiWearerCollectionRef = getMultiWearerCollectionRef();
      const sessionData = {
        keyholderUserId,
        isActive: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      await addDoc(multiWearerCollectionRef, sessionData);
    } catch (err) {
      console.error('Error creating multi-wearer session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    }
  }, [keyholderUserId, getMultiWearerCollectionRef]);

  const endSession = useCallback(async () => {
    try {
      setError(null);
      if (!session) return;

      // Find the session document
      const multiWearerCollectionRef = getMultiWearerCollectionRef();
      const q = query(
        multiWearerCollectionRef, 
        where('keyholderUserId', '==', keyholderUserId),
        where('isActive', '==', true)
      );

      // This is a simplified approach - in a real implementation, you'd store the session ID
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        await updateDoc(sessionDoc.ref, {
          isActive: false,
          lastUpdated: new Date(),
        });
      }
    } catch (err) {
      console.error('Error ending multi-wearer session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
      throw err;
    }
  }, [session, keyholderUserId, getMultiWearerCollectionRef]);

  const addWearer = useCallback(async (wearerData: Omit<Wearer, 'id'>) => {
    try {
      setError(null);
      if (!session) {
        throw new Error('No active session to add wearer to');
      }

      // Find the session document (simplified - you'd normally store the session ID)
      const multiWearerCollectionRef = getMultiWearerCollectionRef();
      const q = query(
        multiWearerCollectionRef, 
        where('keyholderUserId', '==', keyholderUserId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Active session not found');
      }

      const sessionDoc = querySnapshot.docs[0];
      const wearersCollectionRef = getWearersCollectionRef(sessionDoc.id);

      const newWearerData = {
        ...wearerData,
        keyholderPermissions: { ...defaultPermissions, ...wearerData.keyholderPermissions },
        createdAt: new Date(),
      };

      await addDoc(wearersCollectionRef, newWearerData);
    } catch (err) {
      console.error('Error adding wearer:', err);
      setError(err instanceof Error ? err.message : 'Failed to add wearer');
      throw err;
    }
  }, [session, keyholderUserId, getMultiWearerCollectionRef, getWearersCollectionRef]);

  const removeWearer = useCallback(async (wearerId: string) => {
    try {
      setError(null);
      if (!session) return;

      // Find session and delete wearer
      const multiWearerCollectionRef = getMultiWearerCollectionRef();
      const q = query(
        multiWearerCollectionRef, 
        where('keyholderUserId', '==', keyholderUserId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const wearerDocRef = doc(db, 'multiWearerSessions', sessionDoc.id, 'wearers', wearerId);
        await deleteDoc(wearerDocRef);
      }
    } catch (err) {
      console.error('Error removing wearer:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove wearer');
      throw err;
    }
  }, [session, keyholderUserId, getMultiWearerCollectionRef]);

  const updateWearer = useCallback(async (wearerId: string, updates: Partial<Wearer>) => {
    try {
      setError(null);
      if (!session) return;

      const multiWearerCollectionRef = getMultiWearerCollectionRef();
      const q = query(
        multiWearerCollectionRef, 
        where('keyholderUserId', '==', keyholderUserId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const wearerDocRef = doc(db, 'multiWearerSessions', sessionDoc.id, 'wearers', wearerId);
        await updateDoc(wearerDocRef, {
          ...updates,
          lastUpdated: new Date(),
        });
      }
    } catch (err) {
      console.error('Error updating wearer:', err);
      setError(err instanceof Error ? err.message : 'Failed to update wearer');
      throw err;
    }
  }, [session, keyholderUserId, getMultiWearerCollectionRef]);

  const updateWearerPermissions = useCallback(async (
    wearerId: string, 
    permissions: Partial<KeyholderPermissions>
  ) => {
    const wearer = wearers.find(w => w.id === wearerId);
    if (!wearer) return;

    const updatedPermissions = { ...wearer.keyholderPermissions, ...permissions };
    await updateWearer(wearerId, { keyholderPermissions: updatedPermissions });
  }, [wearers, updateWearer]);

  const updateWearerSession = useCallback(async (
    wearerId: string, 
    sessionData: Partial<SessionData>
  ) => {
    const wearer = wearers.find(w => w.id === wearerId);
    if (!wearer) return;

    const updatedSessionData = { ...wearer.sessionData, ...sessionData };
    await updateWearer(wearerId, { sessionData: updatedSessionData });
  }, [wearers, updateWearer]);

  const activateWearer = useCallback(async (wearerId: string) => {
    await updateWearer(wearerId, { isActive: true });
  }, [updateWearer]);

  const deactivateWearer = useCallback(async (wearerId: string) => {
    await updateWearer(wearerId, { isActive: false });
  }, [updateWearer]);

  return {
    session,
    wearers,
    isLoading,
    error,
    createSession,
    endSession,
    addWearer,
    removeWearer,
    updateWearer,
    updateWearerPermissions,
    updateWearerSession,
    activateWearer,
    deactivateWearer,
  };
}