/**
 * Personal Goal TanStack Query Hooks
 * Manages basic personal goals with Dexie as backend (App Parity)
 */
import { useQuery } from "@tanstack/react-query";
import { goalDBService } from "@/services/database";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("usePersonalGoalQueries");

/**
 * Query for getting user's personal duration goal
 */
export function usePersonalGoalQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["goals", "personal", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get all goals for user and find the active personal duration goal
      const goals = await goalDBService.getGoals(userId);
      const personalGoal = goals.find(
        (g) => g.type === "duration" && !g.isCompleted && !g.isSpecialChallenge,
      );

      logger.debug("Personal goal fetched", {
        userId,
        hasGoal: !!personalGoal,
      });

      return personalGoal || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query for getting keyholder required duration setting
 */
export function useKeyholderRequiredDurationQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["goals", "keyholder-duration", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get all goals for user and find the keyholder required duration
      const goals = await goalDBService.getGoals(userId);
      const khDuration = goals.find(
        (g) =>
          g.type === "duration" &&
          !g.isCompleted &&
          g.createdBy === "keyholder" &&
          !g.isSpecialChallenge,
      );

      logger.debug("Keyholder duration fetched", {
        userId,
        hasDuration: !!khDuration,
      });

      return khDuration || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Query for getting goal statistics
 */
export function useGoalStatisticsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["goals", "statistics", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { GoalTrackerService } = await import(
        "@/services/GoalTrackerService"
      );
      return GoalTrackerService.getGoalStatistics(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Re-export mutations from separate file
export {
  useCreatePersonalGoal,
  useUpdatePersonalGoal,
  useUpdateGoalProgress,
  useCompletePersonalGoal,
  useDeletePersonalGoal,
  useCreateKeyholderDuration,
  useUpdateKeyholderDuration,
  usePersonalGoalMutations,
} from "./usePersonalGoalMutations";
