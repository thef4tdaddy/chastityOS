/**
 * Personal Goal Mutation Hooks
 * Individual mutation hooks for personal goals (split from usePersonalGoalQueries)
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { goalDBService } from "@/services/database";
import type { DBGoal } from "@/types/database";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("usePersonalGoalMutations");

/**
 * Hook for creating a personal goal
 */
export function useCreatePersonalGoal() {
  const queryClient = useQueryClient();

  return useMutation({
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
      queryClient.invalidateQueries({
        queryKey: ["goals", "personal", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to create personal goal", { error });
    },
  });
}

/**
 * Hook for updating a personal goal
 */
export function useUpdatePersonalGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      goalId: string;
      userId: string;
      title?: string;
      targetDuration?: number;
      description?: string;
    }) => {
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
}

/**
 * Hook for updating goal progress
 */
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

/**
 * Hook for completing a personal goal
 */
export function useCompletePersonalGoal() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

/**
 * Hook for deleting a personal goal
 */
export function useDeletePersonalGoal() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

/**
 * Hook for creating a keyholder required duration
 */
export function useCreateKeyholderDuration() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

/**
 * Hook for updating a keyholder required duration
 */
export function useUpdateKeyholderDuration() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

/**
 * Aggregator hook for all personal goal mutations (backward compatibility)
 */
export function usePersonalGoalMutations() {
  return {
    createPersonalGoal: useCreatePersonalGoal(),
    updatePersonalGoal: useUpdatePersonalGoal(),
    updateGoalProgress: useUpdateGoalProgress(),
    completePersonalGoal: useCompletePersonalGoal(),
    deletePersonalGoal: useDeletePersonalGoal(),
    createKeyholderDuration: useCreateKeyholderDuration(),
    updateKeyholderDuration: useUpdateKeyholderDuration(),
  };
}
