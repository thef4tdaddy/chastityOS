/**
 * Personal Goals Hook - Extracts goal management from PersonalGoalSection component
 */

import { useState, useCallback } from "react";

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
        const newGoal: PersonalGoal = {
          id: `goal-${Date.now()}`,
          title: goal.title,
          description: goal.description,
          targetDuration: goal.targetDuration,
          currentProgress: 0,
          isCompleted: false,
          createdAt: new Date(),
          reward: goal.reward,
        };
        setGoals((prev) => [...prev, newGoal]);
        return newGoal;
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
        let updatedGoal: PersonalGoal | null = null;
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id === id) {
              updatedGoal = { ...g, ...updates };
              return updatedGoal;
            }
            return g;
          }),
        );
        if (!updatedGoal) throw new Error("Goal not found");
        return updatedGoal;
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
      setGoals((prev) => prev.filter((g) => g.id !== id));
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
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, isCompleted: true, completedAt: new Date() }
            : g,
        ),
      );
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to complete goal");
      setError(error);
      throw error;
    }
  }, []);

  const getGoalProgress = useCallback(
    (goalId: string): number => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || goal.targetDuration === 0) return 0;
      return (goal.currentProgress / goal.targetDuration) * 100;
    },
    [goals],
  );

  const getGoalProjection = useCallback(
    (goalId: string): Date | null => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || goal.currentProgress === 0) return null;

      const remainingDuration = goal.targetDuration - goal.currentProgress;
      const daysPassed = Math.floor(
        (Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const progressPerDay = goal.currentProgress / daysPassed;

      if (progressPerDay === 0) return null;

      const daysRemaining = Math.ceil(remainingDuration / progressPerDay);
      const projectedDate = new Date();
      projectedDate.setDate(projectedDate.getDate() + daysRemaining);

      return projectedDate;
    },
    [goals],
  );

  useState(() => {
    setTimeout(() => setIsLoading(false), 100);
  });

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
