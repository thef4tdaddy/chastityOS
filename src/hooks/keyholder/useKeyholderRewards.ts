import { useState, useCallback } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { KeyholderReward, KeyholderPunishment, TaskData } from '../../types';

interface UseKeyholderRewardsProps {
  userId: string;
  addTask: (taskData: TaskData) => Promise<void>;
  saveDataToFirestore: (data: Record<string, unknown>) => Promise<void>;
  requiredKeyholderDurationSeconds: number;
}

interface UseKeyholderRewardsReturn {
  isLoading: boolean;
  error: string | null;
  addReward: (reward: KeyholderReward) => Promise<void>;
  addPunishment: (punishment: KeyholderPunishment) => Promise<void>;
  updateDuration: (newDurationSeconds: number) => Promise<void>;
  adjustTimeFromReward: (timeSeconds: number) => Promise<void>;
  adjustTimeFromPunishment: (timeSeconds: number) => Promise<void>;
}

export function useKeyholderRewards({
  userId,
  addTask,
  saveDataToFirestore,
  requiredKeyholderDurationSeconds,
}: UseKeyholderRewardsProps): UseKeyholderRewardsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReward = useCallback(async (reward: KeyholderReward) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId || !addTask || !saveDataToFirestore) {
        throw new Error('Missing required dependencies for adding reward');
      }

      const timeToRemoveInSeconds = reward.timeSeconds || 0;
      
      // Update duration if time reward is given
      if (timeToRemoveInSeconds > 0) {
        const currentDuration = requiredKeyholderDurationSeconds || 0;
        const newDuration = Math.max(0, currentDuration - timeToRemoveInSeconds);
        await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      }

      // Create the standardized log entry
      const taskData: TaskData = {
        text: 'Keyholder Reward',
        logType: 'reward',
        sourceText: 'Manually added by Keyholder',
        note: reward.note || reward.other || '',
        timeChangeSeconds: timeToRemoveInSeconds > 0 ? -timeToRemoveInSeconds : 0,
        createdAt: serverTimestamp(),
      };

      await addTask(taskData);
    } catch (err) {
      console.error('Error adding reward:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reward');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]);

  const addPunishment = useCallback(async (punishment: KeyholderPunishment) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId || !addTask || !saveDataToFirestore) {
        throw new Error('Missing required dependencies for adding punishment');
      }

      const timeToAddInSeconds = punishment.timeSeconds || 0;
      
      // Update duration if time punishment is given
      if (timeToAddInSeconds > 0) {
        const currentDuration = requiredKeyholderDurationSeconds || 0;
        const newDuration = currentDuration + timeToAddInSeconds;
        await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      }

      // Create the standardized log entry
      const taskData: TaskData = {
        text: 'Keyholder Punishment',
        logType: 'punishment',
        sourceText: 'Manually added by Keyholder',
        note: punishment.note || punishment.other || '',
        timeChangeSeconds: timeToAddInSeconds > 0 ? timeToAddInSeconds : 0,
        createdAt: serverTimestamp(),
      };

      await addTask(taskData);
    } catch (err) {
      console.error('Error adding punishment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add punishment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]);

  const updateDuration = useCallback(async (newDurationSeconds: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!saveDataToFirestore) {
        throw new Error('Missing saveDataToFirestore function');
      }

      if (newDurationSeconds < 0) {
        throw new Error('Duration cannot be negative');
      }

      await saveDataToFirestore({ 
        requiredKeyholderDurationSeconds: newDurationSeconds 
      });
    } catch (err) {
      console.error('Error updating duration:', err);
      setError(err instanceof Error ? err.message : 'Failed to update duration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveDataToFirestore]);

  const adjustTimeFromReward = useCallback(async (timeSeconds: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (timeSeconds <= 0) {
        throw new Error('Reward time must be positive');
      }

      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = Math.max(0, currentDuration - timeSeconds);
      
      await updateDuration(newDuration);
    } catch (err) {
      console.error('Error adjusting time from reward:', err);
      setError(err instanceof Error ? err.message : 'Failed to adjust time from reward');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [requiredKeyholderDurationSeconds, updateDuration]);

  const adjustTimeFromPunishment = useCallback(async (timeSeconds: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (timeSeconds <= 0) {
        throw new Error('Punishment time must be positive');
      }

      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = currentDuration + timeSeconds;
      
      await updateDuration(newDuration);
    } catch (err) {
      console.error('Error adjusting time from punishment:', err);
      setError(err instanceof Error ? err.message : 'Failed to adjust time from punishment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [requiredKeyholderDurationSeconds, updateDuration]);

  return {
    isLoading,
    error,
    addReward,
    addPunishment,
    updateDuration,
    adjustTimeFromReward,
    adjustTimeFromPunishment,
  };
}