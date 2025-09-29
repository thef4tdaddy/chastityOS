import { useCallback } from 'react';
import { serverTimestamp } from 'firebase/firestore';

interface Reward {
  timeSeconds?: number;
  other?: string;
}

interface UseKeyholderRewardsProps {
  userId: string | null;
  addTask: ((taskData: any) => Promise<void>) | null;
  saveDataToFirestore: (data: Record<string, any>) => Promise<void>;
  requiredKeyholderDurationSeconds: number;
}

export const useKeyholderRewards = ({
  userId,
  addTask,
  saveDataToFirestore,
  requiredKeyholderDurationSeconds
}: UseKeyholderRewardsProps) => {
  
  const handleAddReward = useCallback(
    async (reward: Reward) => {
      if (!saveDataToFirestore || !userId || !addTask) return;
      
      const timeToRemoveInSeconds = reward.timeSeconds || 0;
      if (timeToRemoveInSeconds > 0) {
        const currentDuration = requiredKeyholderDurationSeconds || 0;
        const newDuration = Math.max(0, currentDuration - timeToRemoveInSeconds);
        await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      }

      // Add a new log entry for the reward
      await addTask({
        logType: 'reward',
        sourceText: 'Keyholder Manual Reward',
        note: reward.other || '',
        timeChangeSeconds: -timeToRemoveInSeconds,
        createdAt: serverTimestamp(),
      });
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  return {
    handleAddReward
  };
};