/**
 * Lock Combination TanStack Query Hooks
 * Encapsulates LockCombinationService for use in components
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LockCombinationService } from "@/services/database/LockCombinationService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useLockCombination");

/**
 * Query keys for lock combination operations
 */
const lockCombinationKeys = {
  all: (userId: string) => ["lockCombination", userId] as const,
  session: (userId: string, sessionId: string) =>
    ["lockCombination", userId, sessionId] as const,
};

/**
 * Query to get lock combination for a session
 * Requires emergency PIN for decryption
 */
export function useLockCombination(
  userId: string | undefined,
  sessionId: string | undefined,
  pin: string | undefined,
) {
  return useQuery({
    queryKey: lockCombinationKeys.session(userId || "", sessionId || ""),
    queryFn: async () => {
      if (!userId || !sessionId || !pin) return null;

      logger.info("Retrieving lock combination", { userId, sessionId });
      const combination = await LockCombinationService.getCombination(
        userId,
        sessionId,
        pin,
      );
      return combination;
    },
    enabled: !!(userId && sessionId && pin),
    staleTime: 0, // Never cache - always fresh for security
    gcTime: 0, // Don't keep in cache after unmount
  });
}

/**
 * Mutation to save encrypted lock combination
 */
export function useSaveLockCombination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      sessionId,
      combination,
      pin,
    }: {
      userId: string;
      sessionId: string;
      combination: string;
      pin: string;
    }) => {
      logger.info("Saving lock combination", { userId, sessionId });
      await LockCombinationService.saveCombination(
        userId,
        sessionId,
        combination,
        pin,
      );
    },
    onSuccess: (_, variables) => {
      logger.info("Lock combination saved successfully", {
        userId: variables.userId,
        sessionId: variables.sessionId,
      });
      // Invalidate queries for this session
      queryClient.invalidateQueries({
        queryKey: lockCombinationKeys.session(
          variables.userId,
          variables.sessionId,
        ),
      });
    },
    onError: (error, variables) => {
      logger.error("Failed to save lock combination", {
        error: error as Error,
        userId: variables.userId,
        sessionId: variables.sessionId,
      });
    },
  });
}

/**
 * Mutation to delete lock combination
 */
export function useDeleteLockCombination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      sessionId,
    }: {
      userId: string;
      sessionId: string;
    }) => {
      logger.info("Deleting lock combination", { userId, sessionId });
      await LockCombinationService.deleteCombination(userId, sessionId);
    },
    onSuccess: (_, variables) => {
      logger.info("Lock combination deleted successfully", {
        userId: variables.userId,
        sessionId: variables.sessionId,
      });
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: lockCombinationKeys.session(
          variables.userId,
          variables.sessionId,
        ),
      });
    },
    onError: (error, variables) => {
      logger.error("Failed to delete lock combination", {
        error: error as Error,
        userId: variables.userId,
        sessionId: variables.sessionId,
      });
    },
  });
}
