import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
// FIX: Using the correct exported functions from your hash utility.
import { hashPassword, verifyPassword } from '../utils/hash';

export const usePersonalGoal = ({ onSetSelfLock, onUnlockSelfLock }) => {
  const { user, isAuthReady } = useAuth();
  const db = getFirestore();

  const [days, setDays] = useState('0');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [isSelfLockEnabled, setIsSelfLockEnabled] = useState(false);
  const [selfLockCombination, setSelfLockCombination] = useState('');
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [goalDurationSeconds, setGoalDurationSeconds] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists() && docSnap.data().settings?.personalGoal) {
        setGoalDurationSeconds(docSnap.data().settings.personalGoal.goalDurationSeconds || 0);
      }
    });
  }, [isAuthReady, user, db]);

  const onSetGoal = useCallback(async () => {
    if (!isAuthReady || !user) {
      console.error("Auth not ready, cannot set goal.");
      return;
    }
    const totalSeconds =
      (parseInt(days, 10) || 0) * 86400 +
      (parseInt(hours, 10) || 0) * 3600 +
      (parseInt(minutes, 10) || 0) * 60;
    const userDocRef = doc(db, 'users', user.uid);

    const newGoal = {
      goalDurationSeconds: totalSeconds,
      isSelfLocked: false,
      selfLockCombination: null,
      backupCodeHash: null,
    };

    if (isSelfLockEnabled && selfLockCombination.trim()) {
      const backupCode = `BACKUP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      newGoal.isSelfLocked = true;
      newGoal.selfLockCombination = selfLockCombination;
      // FIX: Using the 'hashPassword' function which handles salting internally and returns a combined string.
      newGoal.backupCodeHash = hashPassword(backupCode);

      if (onSetSelfLock) {
        onSetSelfLock(backupCode);
      }
    }
    try {
      await updateDoc(userDocRef, { 'settings.personalGoal': newGoal });
      setGoalDurationSeconds(totalSeconds);
    } catch (error) {
      console.error("Failed to set personal goal:", error);
    }
  }, [days, hours, minutes, isSelfLockEnabled, selfLockCombination, isAuthReady, user, db, onSetSelfLock]);

  const onClearGoal = useCallback(async () => {
    if (!isAuthReady || !user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        'settings.personalGoal': {
          goalDurationSeconds: 0,
          isSelfLocked: false,
          selfLockCombination: null,
          backupCodeHash: null,
        },
      });
      setGoalDurationSeconds(0);
    } catch (error) {
      console.error("Failed to clear personal goal:", error);
    }
  }, [isAuthReady, user, db]);

  const onUseBackupCode = useCallback(async () => {
    if (!isAuthReady || !user || !backupCodeInput.trim()) return;

    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const personalGoal = docSnap.data().settings?.personalGoal;
      // FIX: Using the 'verifyPassword' function which takes the plaintext and the full combined hash string.
      if (
        personalGoal?.backupCodeHash &&
        verifyPassword(backupCodeInput, personalGoal.backupCodeHash)
      ) {
        await onClearGoal();
        if (onUnlockSelfLock) {
          onUnlockSelfLock();
        }
      } else {
        console.warn("Backup code is incorrect.");
      }
    }
  }, [backupCodeInput, isAuthReady, user, db, onUnlockSelfLock, onClearGoal]);

  return {
    days,
    setDays,
    hours,
    setHours,
    minutes,
    setMinutes,
    isSelfLockEnabled,
    setIsSelfLockEnabled,
    selfLockCombination,
    setSelfLockCombination,
    backupCodeInput,
    setBackupCodeInput,
    onSetGoal,
    onClearGoal,
    onUseBackupCode,
    goalDurationSeconds,
  };
};
