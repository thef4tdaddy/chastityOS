/**
 * Goal Progress Hook
 * Handles progress tracking and completion checking for goals
 */
import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { serviceLogger } from "../../utils/logging";
import { checkIfGoalCompleted } from "./session-goals-utils";
import type {
  SessionGoal,
  GoalProgress,
  GoalCompletionStatus,
  GoalAchievement,
} from "./types/SessionGoals";

const logger = serviceLogger("useGoalProgress");

interface UseGoalProgressProps {
  activeGoals: SessionGoal[];
  progress: GoalProgress[];
  setProgress: Dispatch<SetStateAction<GoalProgress[]>>;
  setActiveGoals: Dispatch<SetStateAction<SessionGoal[]>>;
  setAchievements: Dispatch<SetStateAction<GoalAchievement[]>>;
  updateGoal: (goalId: string, updates: Partial<SessionGoal>) => Promise<void>;
}

export const useGoalProgress = ({
  activeGoals,
  progress,
  setProgress,
  setActiveGoals,
  setAchievements,
  updateGoal,
}: UseGoalProgressProps) => {
  const updateProgress = useCallback(
    async (goalId: string, progressValue: number): Promise<void> => {
      try {
        logger.debug("Updating goal progress", { goalId, progressValue });

        setProgress((prev) =>
          prev.map((p) =>
            p.goalId === goalId
              ? {
                  ...p,
                  currentValue: progressValue,
                  progressPercentage: Math.min(
                    100,
                    (progressValue / p.targetValue) * 100,
                  ),
                  lastUpdated: new Date(),
                }
              : p,
          ),
        );

        setActiveGoals((prev) =>
          prev.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  current: progressValue,
                  progress: Math.min(
                    100,
                    (progressValue / goal.target.value) * 100,
                  ),
                }
              : goal,
          ),
        );

        logger.debug("Goal progress updated", { goalId, progressValue });
      } catch (error) {
        logger.error("Failed to update goal progress", { error });
        throw error;
      }
    },
    [setProgress, setActiveGoals],
  );

  const checkForAchievements = useCallback(
    async (completedGoal: SessionGoal): Promise<void> => {
      try {
        const newAchievements: GoalAchievement[] = [];

        if (
          completedGoal.type === "duration" &&
          completedGoal.target.value >= 24
        ) {
          newAchievements.push({
            id: `achievement_${Date.now()}`,
            goalId: completedGoal.id,
            name: "Endurance Master",
            description: "Completed a 24+ hour goal",
            earnedAt: new Date(),
            category: "endurance",
            points: 100,
            rarity: "uncommon",
          });
        }

        if (newAchievements.length > 0) {
          setAchievements((prev) => [...prev, ...newAchievements]);
          logger.info("New achievements unlocked", {
            count: newAchievements.length,
          });
        }
      } catch (error) {
        logger.error("Failed to check for achievements", { error });
      }
    },
    [setAchievements],
  );

  const checkGoalCompletion = useCallback(async (): Promise<
    GoalCompletionStatus[]
  > => {
    try {
      const completionStatuses: GoalCompletionStatus[] = [];

      for (const goal of activeGoals) {
        const goalProgress = progress.find((p) => p.goalId === goal.id);
        if (!goalProgress) continue;

        const isCompleted = checkIfGoalCompleted(goal, goalProgress);
        const completionPercentage = goalProgress.progressPercentage;

        completionStatuses.push({
          goalId: goal.id,
          isCompleted,
          completionPercentage,
          timeRemaining: goalProgress.estimatedCompletion
            ? Math.max(
                0,
                goalProgress.estimatedCompletion.getTime() - Date.now(),
              ) / 1000
            : undefined,
          canComplete: goal.status === "active",
          blockers: [],
        });

        if (isCompleted && goal.status !== "completed") {
          await updateGoal(goal.id, {
            status: "completed",
            completedAt: new Date(),
          });
          await checkForAchievements(goal);
        }
      }

      return completionStatuses;
    } catch (error) {
      logger.error("Failed to check goal completion", { error });
      return [];
    }
  }, [activeGoals, progress, updateGoal, checkForAchievements]);

  const updateActiveGoalProgress = useCallback(async () => {
    try {
      await checkGoalCompletion();
    } catch (error) {
      logger.error("Failed to update active goal progress", { error });
    }
  }, [checkGoalCompletion]);

  return {
    updateProgress,
    checkGoalCompletion,
    updateActiveGoalProgress,
  };
};
