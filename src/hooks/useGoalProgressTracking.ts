/**
 * Goal Progress Tracking Hook
 * Automatically updates goal progress based on session duration
 */
import { useEffect } from "react";
import {
  usePersonalGoalQuery,
  usePersonalGoalMutations,
} from "./api/usePersonalGoalQueries";
import { useCurrentSession } from "./api/useSessionQuery";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useGoalProgressTracking");

/**
 * Hook that automatically updates personal goal progress based on current session duration
 * Should be used in the app root or tracker page
 */
export function useGoalProgressTracking(userId: string | undefined) {
  const { data: personalGoal } = usePersonalGoalQuery(userId);
  const { data: currentSession } = useCurrentSession(userId);
  const { updateGoalProgress, completePersonalGoal } =
    usePersonalGoalMutations();

  useEffect(() => {
    if (
      !userId ||
      !personalGoal ||
      !currentSession ||
      personalGoal.isCompleted
    ) {
      return;
    }

    // Calculate current session duration in seconds
    const now = new Date();
    const sessionStart = currentSession.startTime;
    const elapsedSeconds = Math.floor(
      (now.getTime() - sessionStart.getTime()) / 1000,
    );

    // Update goal progress if it has changed significantly (more than 10 seconds difference)
    const currentProgress = personalGoal.currentValue;
    if (Math.abs(elapsedSeconds - currentProgress) > 10) {
      updateGoalProgress.mutate({
        goalId: personalGoal.id,
        userId,
        currentProgress: elapsedSeconds,
      });

      logger.debug("Goal progress updated", {
        goalId: personalGoal.id,
        currentProgress: elapsedSeconds,
        targetValue: personalGoal.targetValue,
      });

      // Check if goal is completed
      if (
        elapsedSeconds >= personalGoal.targetValue &&
        !personalGoal.isCompleted
      ) {
        completePersonalGoal.mutate({
          goalId: personalGoal.id,
          userId,
        });

        logger.info("Personal goal completed!", {
          goalId: personalGoal.id,
          title: personalGoal.title,
        });
      }
    }
  }, [
    userId,
    personalGoal,
    currentSession,
    updateGoalProgress,
    completePersonalGoal,
  ]);
}
