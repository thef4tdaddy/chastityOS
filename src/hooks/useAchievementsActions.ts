import { useCallback } from "react";
import { useAchievementMutations } from "./useAchievementMutations";

export const useAchievementsActions = (userId?: string) => {
  const {
    toggleVisibilityMutation,
    markNotificationReadMutation,
    performFullCheckMutation,
  } = useAchievementMutations(userId);

  const toggleAchievementVisibility = useCallback(
    (achievementId: string) => {
      if (!userId) return;
      toggleVisibilityMutation.mutate({ achievementId });
    },
    [userId, toggleVisibilityMutation],
  );

  const markNotificationRead = useCallback(
    (notificationId: string) => {
      markNotificationReadMutation.mutate(notificationId);
    },
    [markNotificationReadMutation],
  );

  const performFullCheck = useCallback(() => {
    if (!userId) return;
    performFullCheckMutation.mutate();
  }, [userId, performFullCheckMutation]);

  return {
    toggleAchievementVisibility,
    markNotificationRead,
    performFullCheck,

    // Mutation states
    isTogglingVisibility: toggleVisibilityMutation.isPending,
    isMarkingRead: markNotificationReadMutation.isPending,
    isPerformingCheck: performFullCheckMutation.isPending,
  };
};
