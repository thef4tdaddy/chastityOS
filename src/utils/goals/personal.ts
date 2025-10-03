/**
 * Utility functions for personal goals management
 */
import type {
  PersonalGoal,
  CreateGoalInput,
  UpdateGoalInput,
} from "./usePersonalGoals";

type SetGoalsFunction = (
  value: PersonalGoal[] | ((prev: PersonalGoal[]) => PersonalGoal[]),
) => void;

export async function createGoalHelper(
  goal: CreateGoalInput,
  setGoals: SetGoalsFunction,
): Promise<PersonalGoal> {
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
}

export async function updateGoalHelper(
  id: string,
  updates: UpdateGoalInput,
  setGoals: SetGoalsFunction,
): Promise<PersonalGoal> {
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
}

export async function deleteGoalHelper(
  id: string,
  setGoals: SetGoalsFunction,
): Promise<void> {
  setGoals((prev) => prev.filter((g) => g.id !== id));
}

export async function completeGoalHelper(
  id: string,
  setGoals: SetGoalsFunction,
): Promise<void> {
  setGoals((prev) =>
    prev.map((g) =>
      g.id === id ? { ...g, isCompleted: true, completedAt: new Date() } : g,
    ),
  );
}

export function calculateGoalProgress(
  goalId: string,
  goals: PersonalGoal[],
): number {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal || goal.targetDuration === 0) return 0;
  return (goal.currentProgress / goal.targetDuration) * 100;
}

export function calculateGoalProjection(
  goalId: string,
  goals: PersonalGoal[],
): Date | null {
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
}
