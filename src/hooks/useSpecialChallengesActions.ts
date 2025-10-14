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
// type-only import to avoid runtime circular deps
import type { ChallengeKey } from "./useSpecialChallenges";

const logger = serviceLogger("useSpecialChallenges");

// Add small derived parameter types so we can avoid `any` casts
type GoalServiceChallengeKey = Parameters<
  typeof goalDBService.getOrCreateChallengeGoal
>[1];
type GetChallengeByTypeKey = Parameters<typeof getChallengeByType>[1];

interface UseSpecialChallengesActionsParams {
  userId: string | null;
  challengeStatus: ChallengeStatusData;
  setError: (error: string | null) => void;
  loadChallengeStatus: () => Promise<void>;
  // require isCompleted to be explicit (prevent assignability issues)
  checkForChallengeAchievements: (params: {
    challengeType?: string;
    challengeYear?: number;
    isCompleted: boolean;
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
    async (challengeType: ChallengeKey): Promise<DBGoal> => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);
        const goal = await goalDBService.getOrCreateChallengeGoal(
          userId,
          // cast to the actual service param type (avoids `any`)
          challengeType as unknown as GoalServiceChallengeKey,
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
        // return a rejected promise with a proper Error (avoid re-throwing unknown)
        return Promise.reject(new Error(errorMessage));
      }
    },
    [userId, loadChallengeStatus, setError],
  );

  /**
   * Update challenge progress
   */
  const updateChallengeProgress = useCallback(
    async (challengeType: ChallengeKey, progressValue: number) => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        const challenge = getChallengeByType(
          challengeStatus,
          // cast to the utility's expected param type (avoids `any`)
          challengeType as unknown as GetChallengeByTypeKey,
        );
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
            isCompleted: true,
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
        // return a rejected promise with a proper Error (avoid re-throwing unknown)
        return Promise.reject(new Error(errorMessage));
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
