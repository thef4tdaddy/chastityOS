import { useState, useEffect, useCallback } from "react";
import { goalDBService } from "@/services/database/GoalDBService";
import { serviceLogger } from "@/utils/logging";
import { useAchievementIntegration } from "@/constants/challengeAchievements";
import {
  checkChallengeAvailability,
  buildChallengeStatus,
  getChallengeProgressPercentage,
  type ChallengeStatusData,
} from "@/utils/goals/challenges";
import { useSpecialChallengesActions } from "./useSpecialChallengesActions";

const logger = serviceLogger("useSpecialChallenges");

export type SpecialChallengeStatus = ChallengeStatusData;

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

      const status = buildChallengeStatus(
        specialGoals,
        availability,
        currentYear,
      );
      setChallengeStatus(status);

      logger.debug("Loaded challenge status", {
        userId,
        hasLocktober: !!status.locktober.goal,
        hasNoNut: !!status.noNutNovember.goal,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      logger.error("Failed to load challenge status", { error: err, userId });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Use extracted actions hook
  const { joinChallenge, updateChallengeProgress } =
    useSpecialChallengesActions({
      userId,
      challengeStatus,
      setError,
      loadChallengeStatus,
      checkForChallengeAchievements,
    });

  /**
   * Get progress percentage for a challenge
   */
  const getChallengeProgress = useCallback(
    (challengeType: "locktober" | "no_nut_november") => {
      const challenge = challengeStatus[challengeType];
      return getChallengeProgressPercentage(challenge.goal);
    },
    [challengeStatus],
  );

  // Load challenge status on mount and when userId changes
  useEffect(() => {
    loadChallengeStatus();
  }, [loadChallengeStatus]);

  // Refresh status every hour to check for date changes
  useEffect(() => {
    const updateAvailability = () => {
      const availability = checkChallengeAvailability();
      setChallengeStatus((prev) => ({
        ...prev,
        locktober: { ...prev.locktober, available: availability.locktober },
        noNutNovember: {
          ...prev.noNutNovember,
          available: availability.noNutNovember,
        },
      }));
    };

    const interval = setInterval(updateAvailability, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
