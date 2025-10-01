/**
 * Goal Initialization Hook
 * Handles initial loading and setup of goal-related data
 */
import { useState, useEffect } from "react";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useGoalInitialization");

interface UseGoalInitializationProps {
  userId: string;
  relationshipId?: string;
  loadActiveGoals: () => Promise<void>;
  loadGoalTemplates: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadKeyholderGoals: () => Promise<void>;
  loadGoalHistory: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  updateActiveGoalProgress: () => Promise<void>;
}

export const useGoalInitialization = ({
  userId,
  relationshipId,
  loadActiveGoals,
  loadGoalTemplates,
  loadProgress,
  loadKeyholderGoals,
  loadGoalHistory,
  loadAchievements,
  updateActiveGoalProgress,
}: UseGoalInitializationProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeGoals = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        if (relationshipId) {
          // This would load keyholder goals and permissions
        }

        await Promise.all([
          loadActiveGoals(),
          loadGoalTemplates(),
          loadProgress(),
          loadKeyholderGoals(),
          loadGoalHistory(),
          loadAchievements(),
        ]);
      } catch (err) {
        logger.error("Failed to initialize goals", { error: err });
        setError(
          err instanceof Error ? err.message : "Failed to initialize goals",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeGoals();
    // Store actions are stable and should not be in dependency arrays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, relationshipId]);

  useEffect(() => {
    const updateProgressInterval = setInterval(() => {
      updateActiveGoalProgress();
    }, 30000);

    return () => clearInterval(updateProgressInterval);
    // updateActiveGoalProgress is a stable store action
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isLoading,
    error,
  };
};
