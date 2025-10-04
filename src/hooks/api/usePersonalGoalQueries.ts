/**
 * Personal Goal TanStack Query Hooks
 * Manages basic personal goals with Dexie as backend (App Parity)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalDBService } from "@/services/database";
import type { DBGoal } from "@/types/database";
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
 * Mutations for personal goal operations
 */
export function usePersonalGoalMutations() {
  const queryClient = useQueryClient();

  const createPersonalGoal = useMutation({
    mutationFn: async (params: {
      userId: string;
      title: string;
      targetDuration: number; // in seconds
      description?: string;
    }) => {
      const goalId = await goalDBService.addGoal({
        userId: params.userId,
        title: params.title,
        type: "duration",
        targetValue: params.targetDuration,
        unit: "seconds",
        description: params.description,
        createdBy: "submissive",
        isSpecialChallenge: false,
      });

      logger.info("Personal goal created", {
        goalId,
        userId: params.userId,
        targetDuration: params.targetDuration,
      });

      return goalId;
    },
    onSuccess: (_data, variables) => {
      // Invalidate personal goal query to refetch
      queryClient.invalidateQueries({
        queryKey: ["goals", "personal", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to create personal goal", { error });
    },
  });

  const updatePersonalGoal = useMutation({
    mutationFn: async (params: {
      goalId: string;
      userId: string;
      title?: string;
      targetDuration?: number;
      description?: string;
    }) => {
      // Update the goal in database
      const updates: Partial<DBGoal> = {};
      if (params.title !== undefined) updates.title = params.title;
      if (params.targetDuration !== undefined)
        updates.targetValue = params.targetDuration;
      if (params.description !== undefined)
        updates.description = params.description;

      await goalDBService.update(params.goalId, updates);

      logger.info("Personal goal updated", {
        goalId: params.goalId,
        updates,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["goals", "personal", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to update personal goal", { error });
    },
  });

  const updateGoalProgress = useMutation({
    mutationFn: async (params: {
      goalId: string;
      userId: string;
      currentProgress: number; // in seconds
    }) => {
      await goalDBService.updateGoalProgress(
        params.goalId,
        params.currentProgress,
      );

      logger.debug("Goal progress updated", {
        goalId: params.goalId,
        currentProgress: params.currentProgress,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["goals", "personal", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to update goal progress", { error });
    },
  });

  const completePersonalGoal = useMutation({
    mutationFn: async (params: { goalId: string; userId: string }) => {
      await goalDBService.update(params.goalId, {
        isCompleted: true,
        completedAt: new Date(),
      });

      logger.info("Personal goal completed", { goalId: params.goalId });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["goals", "personal", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to complete goal", { error });
    },
  });

  const deletePersonalGoal = useMutation({
    mutationFn: async (params: { goalId: string; userId: string }) => {
      await goalDBService.delete(params.goalId);

      logger.info("Personal goal deleted", { goalId: params.goalId });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["goals", "personal", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to delete goal", { error });
    },
  });

  const createKeyholderDuration = useMutation({
    mutationFn: async (params: {
      userId: string;
      title: string;
      requiredDuration: number; // in seconds
      description?: string;
    }) => {
      const goalId = await goalDBService.addGoal({
        userId: params.userId,
        title: params.title,
        type: "duration",
        targetValue: params.requiredDuration,
        unit: "seconds",
        description: params.description,
        createdBy: "keyholder",
        isSpecialChallenge: false,
      });

      logger.info("Keyholder required duration created", {
        goalId,
        userId: params.userId,
        requiredDuration: params.requiredDuration,
      });

      return goalId;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["goals", "keyholder-duration", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to create keyholder duration", { error });
    },
  });

  const updateKeyholderDuration = useMutation({
    mutationFn: async (params: {
      goalId: string;
      userId: string;
      requiredDuration: number;
      title?: string;
      description?: string;
    }) => {
      const updates: Partial<DBGoal> = {
        targetValue: params.requiredDuration,
      };
      if (params.title) updates.title = params.title;
      if (params.description) updates.description = params.description;

      await goalDBService.update(params.goalId, updates);

      logger.info("Keyholder duration updated", {
        goalId: params.goalId,
        requiredDuration: params.requiredDuration,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["goals", "keyholder-duration", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to update keyholder duration", { error });
    },
  });

  return {
    createPersonalGoal,
    updatePersonalGoal,
    updateGoalProgress,
    completePersonalGoal,
    deletePersonalGoal,
    createKeyholderDuration,
    updateKeyholderDuration,
  };
}
