import { useAchievements } from "./useAchievements";

/**
 * Hook for achievement notifications (can be used globally)
 */
export const useAchievementNotifications = (userId?: string) => {
  const { unreadNotifications, markNotificationRead, isLoadingNotifications } =
    useAchievements(userId);

  return {
    notifications: unreadNotifications,
    isLoading: isLoadingNotifications,
    markAsRead: markNotificationRead,
    hasUnread: unreadNotifications.length > 0,
    unreadCount: unreadNotifications.length,
  };
};
