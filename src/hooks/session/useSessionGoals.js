import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot, collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * @typedef {Object} Goal
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} targetDuration - in seconds
 * @property {boolean} isCompleted
 * @property {Date} createdAt
 * @property {Date} [completedAt]
 * @property {string} [reward]
 */

/**
 * @typedef {Object} GoalsState
 * @property {Goal[]} goals
 * @property {Goal|null} activeGoal
 * @property {number} progress - percentage
 */

/**
 * @typedef {Object} SessionGoalsOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {number} currentSessionDuration
 * @property {Function} [onGoalCompleted]
 */

/**
 * Hook for managing session goals
 * @param {SessionGoalsOptions} options
 * @returns {Object}
 */
export const useSessionGoals = ({ 
  userId, 
  isAuthReady, 
  currentSessionDuration,
  onGoalCompleted 
}) => {
  const [goalsState, setGoalsState] = useState({
    goals: [],
    activeGoal: null,
    progress: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveGoalsToFirestore = useCallback(async (goals) => {
    if (!userId || !isAuthReady) {
      return;
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { goals }, { merge: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goals');
    }
  }, [userId, isAuthReady]);

  const addGoal = useCallback(async (goalData) => {
    if (!userId || !isAuthReady) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newGoal = {
        ...goalData,
        id: crypto.randomUUID(),
        isCompleted: false,
        createdAt: new Date()
      };

      const goalsCollection = collection(db, 'users', userId, 'goals');
      await addDoc(goalsCollection, newGoal);

      setGoalsState(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal]
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add goal');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady]);

  const completeGoal = useCallback(async (goalId) => {
    if (!userId || !isAuthReady) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedGoals = goalsState.goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, isCompleted: true, completedAt: new Date() }
          : goal
      );

      const completedGoal = updatedGoals.find(goal => goal.id === goalId);
      
      setGoalsState(prev => ({
        ...prev,
        goals: updatedGoals,
        activeGoal: prev.activeGoal?.id === goalId ? null : prev.activeGoal
      }));

      await saveGoalsToFirestore(updatedGoals);
      
      if (completedGoal && onGoalCompleted) {
        onGoalCompleted(completedGoal);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete goal');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady, goalsState.goals, saveGoalsToFirestore, onGoalCompleted]);

  const setActiveGoal = useCallback(async (goalId) => {
    const activeGoal = goalId ? goalsState.goals.find(goal => goal.id === goalId) || null : null;
    
    setGoalsState(prev => ({
      ...prev,
      activeGoal
    }));

    if (userId && isAuthReady) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { activeGoalId: goalId }, { merge: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set active goal');
      }
    }
  }, [goalsState.goals, userId, isAuthReady]);

  const fetchGoals = useCallback(async () => {
    if (!userId || !isAuthReady) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const goalsCollection = collection(db, 'users', userId, 'goals');
      const q = query(goalsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const goals = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate()
      }));

      setGoalsState(prev => ({ ...prev, goals }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady]);

  // Load goals and active goal on mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Listen for active goal updates
  useEffect(() => {
    if (!userId || !isAuthReady) {
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.activeGoalId) {
            const activeGoal = goalsState.goals.find(goal => goal.id === data.activeGoalId);
            setGoalsState(prev => ({ ...prev, activeGoal: activeGoal || null }));
          }
        }
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [userId, isAuthReady, goalsState.goals]);

  // Calculate progress for active goal
  useEffect(() => {
    if (goalsState.activeGoal && currentSessionDuration > 0) {
      const progress = Math.min(
        (currentSessionDuration / goalsState.activeGoal.targetDuration) * 100,
        100
      );
      
      setGoalsState(prev => ({ ...prev, progress }));

      // Auto-complete goal if target reached
      if (progress >= 100 && !goalsState.activeGoal.isCompleted) {
        completeGoal(goalsState.activeGoal.id);
      }
    } else {
      setGoalsState(prev => ({ ...prev, progress: 0 }));
    }
  }, [goalsState.activeGoal, currentSessionDuration, completeGoal]);

  const getNextGoal = useCallback(() => {
    return goalsState.goals
      .filter(goal => !goal.isCompleted)
      .sort((a, b) => a.targetDuration - b.targetDuration)[0] || null;
  }, [goalsState.goals]);

  return {
    goalsState,
    isLoading,
    error,
    addGoal,
    completeGoal,
    setActiveGoal,
    getNextGoal,
    refreshGoals: fetchGoals
  };
};