/**
 * Special challenges action handlers
 * Extracted from useSpecialChallenges to reduce complexity
 */

import { useCallback } from "react";
import { goalDBService } from "@/services/database/GoalDBService";
import { serviceLogger } from "@/utils/logging";
import { getChallengeByType } from "@/utils/goals/challenges";
import type { ChallengeStatusData } from "@/utils/goals/challenges";
import type { DBGoal } from "@/types/database";

const logger = serviceLogger("useSpecialChallengesActions");

interface UseSpecialChallengesActionsParams {
  userId: string | null;
  challengeStatus: ChallengeStatusData;
  setError: (error: string | null) => void;
  loadChallengeStatus: () => Promise<void>;
  checkForChallengeAchievements: (params: {
    challengeType?: string;
    challengeYear?: number;
    isCompleted?: boolean;
  }) => Promise<void>;
}

export const useSpecialChallengesActions = ({
  userId,
  challengeStatus,
  setError,
  loadChallengeStatus,
  checkForChallengeAchievements,
}: UseSpecialChallengesActionsParams) => {
  /**
   * Join a special challenge
   */
  const joinChallenge = useCallback(
    async (challengeType: "locktober" | "no_nut_november"): Promise<DBGoal> => {
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
    [userId, loadChallengeStatus, setError],
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
        const challenge = getChallengeByType(challengeStatus, challengeType);
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
      setError,
    ],
  );

  return {
    joinChallenge,
    updateChallengeProgress,
  };
};
