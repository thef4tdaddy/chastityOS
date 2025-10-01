import { useState, useEffect, useCallback } from "react";
import { goalDBService } from "@/services/database/GoalDBService";
import type { DBGoal } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { useAchievementIntegration } from "@/constants/challengeAchievements";

const logger = serviceLogger("useSpecialChallenges");

export interface SpecialChallengeStatus {
  locktober: {
    available: boolean;
    active: boolean;
    completed: boolean;
    goal?: DBGoal;
  };
  noNutNovember: {
    available: boolean;
    active: boolean;
    completed: boolean;
    goal?: DBGoal;
  };
}

/**
 * Hook for managing special challenge goals (Locktober, No Nut November)
 */
export const useSpecialChallenges = (userId: string | null) => {
  const [challengeStatus, setChallengeStatus] =
    useState<SpecialChallengeStatus>({
      locktober: { available: false, active: false, completed: false },
      noNutNovember: { available: false, active: false, completed: false },
    });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { checkForChallengeAchievements } = useAchievementIntegration();

  /**
   * Check if challenges are available based on current date
   */
  const checkChallengeAvailability = useCallback(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based

    return {
      locktober: currentMonth === 9, // October
      noNutNovember: currentMonth === 10, // November
    };
  }, []);

  /**
   * Load challenge status for the user
   */
  const loadChallengeStatus = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const availability = checkChallengeAvailability();
      const specialGoals = await goalDBService.getSpecialChallengeGoals(userId);
      const currentYear = new Date().getFullYear();

      // Find current year's goals
      const locktoberGoal = specialGoals.find(
        (goal) =>
          goal.challengeType === "locktober" &&
          goal.challengeYear === currentYear,
      );
      const noNutGoal = specialGoals.find(
        (goal) =>
          goal.challengeType === "no_nut_november" &&
          goal.challengeYear === currentYear,
      );

      setChallengeStatus({
        locktober: {
          available: availability.locktober,
          active: !!locktoberGoal && !locktoberGoal.isCompleted,
          completed: !!locktoberGoal?.isCompleted,
          goal: locktoberGoal,
        },
        noNutNovember: {
          available: availability.noNutNovember,
          active: !!noNutGoal && !noNutGoal.isCompleted,
          completed: !!noNutGoal?.isCompleted,
          goal: noNutGoal,
        },
      });

      logger.debug("Loaded challenge status", {
        userId,
        hasLocktober: !!locktoberGoal,
        hasNoNut: !!noNutGoal,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      logger.error("Failed to load challenge status", { error: err, userId });
    } finally {
      setIsLoading(false);
    }
  }, [userId, checkChallengeAvailability]);

  /**
   * Join a special challenge
   */
  const joinChallenge = useCallback(
    async (challengeType: "locktober" | "no_nut_november") => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);
        const goal = await goalDBService.getOrCreateChallengeGoal(
          userId,
          challengeType,
        );

        // Refresh status
        await loadChallengeStatus();

        logger.info("User joined challenge", {
          userId,
          challengeType,
          goalId: goal.id,
        });
        return goal;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to join challenge";
        setError(errorMessage);
        logger.error("Failed to join challenge", {
          error: err,
          userId,
          challengeType,
        });
        throw err;
      }
    },
    [userId, loadChallengeStatus],
  );

  /**
   * Update challenge progress
   */
  const updateChallengeProgress = useCallback(
    async (
      challengeType: "locktober" | "no_nut_november",
      progressValue: number,
    ) => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        const challengeMap = {
          locktober: challengeStatus.locktober,
          no_nut_november: challengeStatus.noNutNovember,
        };
        const challenge =
          challengeMap[challengeType as keyof typeof challengeMap];
        if (!challenge.goal) {
          throw new Error("Challenge goal not found");
        }

        await goalDBService.updateGoalProgress(
          challenge.goal.id,
          progressValue,
        );

        // Check if challenge was completed and trigger achievements
        const updatedGoal = await goalDBService.findById(challenge.goal.id);
        if (updatedGoal?.isCompleted) {
          await checkForChallengeAchievements({
            challengeType: updatedGoal.challengeType,
            challengeYear: updatedGoal.challengeYear,
            isCompleted: updatedGoal.isCompleted,
          });
        }

        // Refresh status
        await loadChallengeStatus();

        logger.info("Updated challenge progress", {
          userId,
          challengeType,
          progressValue,
          goalId: challenge.goal.id,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update progress";
        setError(errorMessage);
        logger.error("Failed to update challenge progress", {
          error: err,
          userId,
          challengeType,
          progressValue,
        });
        throw err;
      }
    },
    [
      userId,
      challengeStatus,
      loadChallengeStatus,
      checkForChallengeAchievements,
    ],
  );

  /**
   * Get progress percentage for a challenge
   */
  const getChallengeProgress = useCallback(
    (challengeType: "locktober" | "no_nut_november") => {
      const challenge = challengeStatus[challengeType];
      if (!challenge.goal) return 0;

      return Math.min(
        100,
        (challenge.goal.currentValue / challenge.goal.targetValue) * 100,
      );
    },
    [challengeStatus],
  );

  // Load challenge status on mount and when userId changes
  useEffect(() => {
    loadChallengeStatus();
  }, [userId, checkChallengeAvailability, loadChallengeStatus]);

  // Refresh status every hour to check for date changes
  useEffect(() => {
    const interval = setInterval(
      () => {
        const availability = checkChallengeAvailability();
        setChallengeStatus((prev) => ({
          ...prev,
          locktober: { ...prev.locktober, available: availability.locktober },
          noNutNovember: {
            ...prev.noNutNovember,
            available: availability.noNutNovember,
          },
        }));
      },
      60 * 60 * 1000,
    ); // Check every hour

    return () => clearInterval(interval);
  }, [checkChallengeAvailability]);

  return {
    challengeStatus,
    isLoading,
    error,
    joinChallenge,
    updateChallengeProgress,
    getChallengeProgress,
    refreshStatus: loadChallengeStatus,
  };
};
