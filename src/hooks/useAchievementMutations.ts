/**
 * Achievement mutations hook
 * Separates mutation logic from main useAchievements hook
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { achievementDBService, achievementEngine } from "../services";
import { logger } from "../utils/logging";

export function useAchievementMutations(userId?: string) {
  const queryClient = useQueryClient();

  /**
   * Toggle achievement visibility
   */
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ achievementId }: { achievementId: string }) =>
      achievementDBService.toggleAchievementVisibility(userId!, achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["achievements", "visible", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["achievements", "user", userId],
      });
    },
    onError: (error: Error) => {
      logger.error(
        "Failed to toggle achievement visibility",
        error,
        "useAchievements",
      );
    },
  });

  /**
   * Mark notification as read
   */
  const markNotificationReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      achievementDBService.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["achievements", "notifications", userId],
      });
    },
    onError: (error: Error) => {
      logger.error(
        "Failed to mark notification as read",
        error,
        "useAchievements",
      );
    },
  });

  /**
   * Perform full achievement check
   */
  const performFullCheckMutation = useMutation({
    mutationFn: () => achievementEngine.performFullCheck(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
    onError: (error) => {
      logger.error(
        "Failed to perform full achievement check",
        error,
        "useAchievements",
      );
    },
  });

  return {
    toggleVisibilityMutation,
    markNotificationReadMutation,
    performFullCheckMutation,
  };
}
