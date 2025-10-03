/**
 * Personal Goals Hook - Extracts goal management from PersonalGoalSection component
 */

import { useState, useCallback } from "react";
import {
  createGoalHelper,
  updateGoalHelper,
  deleteGoalHelper,
  completeGoalHelper,
  calculateGoalProgress,
  calculateGoalProjection,
} from "@/utils/goals/personal";

export interface PersonalGoal {
  id: string;
  title: string;
  description?: string;
  targetDuration: number; // in seconds
  currentProgress: number; // in seconds
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  reward?: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetDuration: number;
  reward?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetDuration?: number;
  reward?: string;
}

export interface UsePersonalGoalsReturn {
  goals: PersonalGoal[];
  activeGoals: PersonalGoal[];
  completedGoals: PersonalGoal[];
  isLoading: boolean;
  createGoal: (goal: CreateGoalInput) => Promise<PersonalGoal>;
  updateGoal: (id: string, updates: UpdateGoalInput) => Promise<PersonalGoal>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: Error | null;
  getGoalProgress: (goalId: string) => number;
  getGoalProjection: (goalId: string) => Date | null;
}

export function usePersonalGoals(): UsePersonalGoalsReturn {
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const createGoal = useCallback(
    async (goal: CreateGoalInput): Promise<PersonalGoal> => {
      setIsCreating(true);
      setError(null);
      try {
        return await createGoalHelper(goal, setGoals);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to create goal");
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  const updateGoal = useCallback(
    async (id: string, updates: UpdateGoalInput): Promise<PersonalGoal> => {
      setIsUpdating(true);
      setError(null);
      try {
        return await updateGoalHelper(id, updates, setGoals);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update goal");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteGoalHelper(id, setGoals);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete goal");
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const completeGoal = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await completeGoalHelper(id, setGoals);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to complete goal");
      setError(error);
      throw error;
    }
  }, []);

  const getGoalProgress = useCallback(
    (goalId: string): number => calculateGoalProgress(goalId, goals),
    [goals],
  );
  const getGoalProjection = useCallback(
    (goalId: string): Date | null => calculateGoalProjection(goalId, goals),
    [goals],
  );

  useState(() => setTimeout(() => setIsLoading(false), 100));

  return {
    goals,
    activeGoals,
    completedGoals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    getGoalProgress,
    getGoalProjection,
  };
}
