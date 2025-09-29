import { useCallback } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { 
  RewardData, 
  PunishmentData, 
  LogEntry,
  SaveDataFunction,
  AddTaskFunction 
} from '../../types/keyholder';

interface UseKeyholderRewardsProps {
  userId: string | null;
  requiredKeyholderDurationSeconds: number;
  saveDataToFirestore: SaveDataFunction;
  addTask: AddTaskFunction;
}

interface UseKeyholderRewardsReturn {
  addReward: (reward: RewardData) => Promise<void>;
  addPunishment: (punishment: PunishmentData) => Promise<void>;
  calculateTimeReduction: (rewardSeconds: number, currentDuration: number) => number;
  calculateTimeAddition: (punishmentSeconds: number, currentDuration: number) => number;
  createRewardLogEntry: (reward: RewardData, timeChange: number) => LogEntry;
  createPunishmentLogEntry: (punishment: PunishmentData, timeChange: number) => LogEntry;
}

export function useKeyholderRewards({
  userId,
  requiredKeyholderDurationSeconds,
  saveDataToFirestore,
  addTask
}: UseKeyholderRewardsProps): UseKeyholderRewardsReturn {

  const calculateTimeReduction = useCallback((rewardSeconds: number, currentDuration: number): number => {
    if (rewardSeconds <= 0) return 0;
    return Math.max(0, currentDuration - rewardSeconds);
  }, []);

  const calculateTimeAddition = useCallback((punishmentSeconds: number, currentDuration: number): number => {
    if (punishmentSeconds <= 0) return currentDuration;
    return currentDuration + punishmentSeconds;
  }, []);

  const createRewardLogEntry = useCallback((reward: RewardData, timeChange: number): LogEntry => {
    let sourceText = 'Manually added by Keyholder';
    
    if (reward.type === 'task_completion') {
      sourceText = 'Task completion reward';
    } else if (reward.type === 'goal_achievement') {
      sourceText = 'Goal achievement reward';
    }

    return {
      logType: 'reward',
      sourceText,
      note: reward.description || reward.other || '',
      timeChangeSeconds: timeChange > 0 ? -timeChange : 0,
      createdAt: serverTimestamp(),
    };
  }, []);

  const createPunishmentLogEntry = useCallback((punishment: PunishmentData, timeChange: number): LogEntry => {
    let sourceText = 'Manually added by Keyholder';
    
    if (punishment.type === 'task_failure') {
      sourceText = 'Task failure punishment';
    } else if (punishment.type === 'rule_violation') {
      sourceText = 'Rule violation punishment';
    }

    return {
      logType: 'punishment',
      sourceText,
      note: punishment.description || punishment.other || '',
      timeChangeSeconds: timeChange,
      createdAt: serverTimestamp(),
    };
  }, []);

  const addReward = useCallback(async (reward: RewardData): Promise<void> => {
    if (!saveDataToFirestore || !userId || !addTask) {
      throw new Error('Required dependencies not available');
    }
    
    const timeToRemoveInSeconds = reward.timeSeconds || 0;
    let actualTimeChange = 0;

    // Update duration if time reward is specified
    if (timeToRemoveInSeconds > 0) {
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = calculateTimeReduction(timeToRemoveInSeconds, currentDuration);
      actualTimeChange = currentDuration - newDuration;
      
      await saveDataToFirestore({ 
        requiredKeyholderDurationSeconds: newDuration 
      });
    }
    
    // Create log entry
    const logEntry = createRewardLogEntry(reward, actualTimeChange);
    await addTask(logEntry);
  }, [
    userId, 
    addTask, 
    saveDataToFirestore, 
    requiredKeyholderDurationSeconds,
    calculateTimeReduction,
    createRewardLogEntry
  ]);

  const addPunishment = useCallback(async (punishment: PunishmentData): Promise<void> => {
    if (!saveDataToFirestore || !userId || !addTask) {
      throw new Error('Required dependencies not available');
    }

    const timeToAddInSeconds = punishment.timeSeconds || 0;
    let actualTimeChange = 0;

    // Update duration if time punishment is specified
    if (timeToAddInSeconds > 0) {
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = calculateTimeAddition(timeToAddInSeconds, currentDuration);
      actualTimeChange = newDuration - currentDuration;
      
      await saveDataToFirestore({ 
        requiredKeyholderDurationSeconds: newDuration 
      });
    }
    
    // Create log entry
    const logEntry = createPunishmentLogEntry(punishment, actualTimeChange);
    await addTask(logEntry);
  }, [
    userId, 
    addTask, 
    saveDataToFirestore, 
    requiredKeyholderDurationSeconds,
    calculateTimeAddition,
    createPunishmentLogEntry
  ]);

  return {
    addReward,
    addPunishment,
    calculateTimeReduction,
    calculateTimeAddition,
    createRewardLogEntry,
    createPunishmentLogEntry,
  };
}