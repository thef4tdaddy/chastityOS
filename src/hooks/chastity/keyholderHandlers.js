import { useCallback } from 'react';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { sha256 } from '../../utils/hash';

export function useKeyholderHandlers({
  userId,
  isAuthReady,
  setSettings,
  session,
  updateSession,
  addTask,
}) {
  const handleSetKeyholder = useCallback(
    async (keyholderEmail) => {
      if (!isAuthReady || !userId || !keyholderEmail) return;
      try {
        const hashedEmail = await sha256(keyholderEmail.toLowerCase().trim());
        const keyholderRef = doc(db, 'keyholders', hashedEmail);
        const keyholderSnap = await getDoc(keyholderRef);

        if (keyholderSnap.exists()) {
          const keyholderData = keyholderSnap.data();
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { 'settings.keyholder': keyholderData.userId });
          setSettings((prev) => ({ ...prev, keyholder: keyholderData.userId }));
        } else {
          console.error('Keyholder not found');
          // Handle case where keyholder does not exist
        }
      } catch (error) {
        console.error('Error setting keyholder:', error);
      }
    },
    [isAuthReady, userId, setSettings]
  );

  const handleClearKeyholder = useCallback(async () => {
    if (!isAuthReady || !userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 'settings.keyholder': null });
      setSettings((prev) => ({ ...prev, keyholder: null }));
    } catch (error) {
      console.error('Error clearing keyholder:', error);
    }
  }, [isAuthReady, userId, setSettings]);

  const handleUnlockKeyholderControls = useCallback(async () => {
    if (!session || !session.id) return;
    await updateDoc(doc(db, 'sessions', session.id), { isKeyholderLocked: false });
    updateSession({ isKeyholderLocked: false });
  }, [session, updateSession]);

  const handleLockKeyholderControls = useCallback(async () => {
    if (!session || !session.id) return;
    await updateDoc(doc(db, 'sessions', session.id), { isKeyholderLocked: true });
    updateSession({ isKeyholderLocked: true });
  }, [session, updateSession]);

  const handleSetRequiredDuration = useCallback(
    async (duration) => {
      if (!session || !session.id) return;
      const sessionRef = doc(db, 'sessions', session.id);
      await updateDoc(sessionRef, { requiredDuration: duration });
      updateSession({ requiredDuration: duration });
    },
    [session, updateSession]
  );

  const handleSetGoalDuration = useCallback(
    async (duration) => {
      if (!session || !session.id) return;
      const sessionRef = doc(db, 'sessions', session.id);
      await updateDoc(sessionRef, { goalDuration: duration });
      updateSession({ goalDuration: duration });
    },
    [session, updateSession]
  );

  const handleAddReward = useCallback(
    async (reward) => {
      if (!userId || !addTask) return;
      await addTask({ ...reward, type: 'reward', assignedBy: 'keyholder', createdAt: serverTimestamp() });
    },
    [userId, addTask]
  );

  const handleAddPunishment = useCallback(
    async (punishment) => {
      if (!userId || !addTask) return;
      await addTask({ ...punishment, type: 'punishment', assignedBy: 'keyholder', createdAt: serverTimestamp() });
    },
    [userId, addTask]
  );

  return {
    handleSetKeyholder,
    handleClearKeyholder,
    handleUnlockKeyholderControls,
    handleLockKeyholderControls,
    handleSetRequiredDuration,
    handleSetGoalDuration,
    handleAddReward,
    handleAddPunishment,
  };
}
