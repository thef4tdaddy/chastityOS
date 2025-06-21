import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function usePersonalGoal({ userId, isAuthReady, settings }) {
  // Add a default empty object to prevent crash on initial render
  const { goal, goalAchieved } = settings || {};

  const [personalGoal, setPersonalGoal] = useState(goal || '');
  const [isGoalAchieved, setIsGoalAchieved] = useState(goalAchieved || false);
  const [backupCode, setBackupCode] = useState('');

  useEffect(() => {
    if (settings) {
      setPersonalGoal(settings.goal || '');
      setIsGoalAchieved(settings.goalAchieved || false);
    }
  }, [settings]);

  const handleSetPersonalGoal = useCallback(async () => {
    if (!isAuthReady || !userId || !personalGoal) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 'settings.goal': personalGoal });
    } catch (error) {
      console.error("Error setting personal goal:", error);
    }
  }, [isAuthReady, userId, personalGoal]);

  const handleCompleteGoal = useCallback(async () => {
    if (!isAuthReady || !userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 'settings.goalAchieved': true });
      setIsGoalAchieved(true);
    } catch (error) {
      console.error("Error completing goal:", error);
    }
  }, [isAuthReady, userId]);

  const handleResetGoal = useCallback(async () => {
    if (!isAuthReady || !userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 'settings.goal': '', 'settings.goalAchieved': false });
      setPersonalGoal('');
      setIsGoalAchieved(false);
    } catch (error) {
      console.error("Error resetting goal:", error);
    }
  }, [isAuthReady, userId]);

  return {
    personalGoal,
    setPersonalGoal,
    isGoalAchieved,
    backupCode,
    setBackupCode,
    handleSetPersonalGoal,
    handleCompleteGoal,
    handleResetGoal,
  };
}
