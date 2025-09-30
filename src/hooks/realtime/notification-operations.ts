/**
 * Notification operation helper functions
 */
import React, { useCallback } from "react";
import {
  Notification,
  NotificationState,
  NotificationType,
  NotificationPriority,
  NotificationChannelType,
  NotificationPreferences,
} from "../../types/realtime";
import {
  isInQuietHours,
  deliverNotification,
  saveNotification,
  updateNotificationStatus,
  updateMultipleNotificationStatus,
  deleteNotification,
  saveNotificationPreferences,
} from "./notification-utils";

// Helper function to create a new notification
export const createNotificationFactory = (
  userId: string,
  notificationState: NotificationState,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
  maxNotifications: number,
) => {
  return useCallback(
    async (
      notification: Omit<
        Notification,
        "id" | "timestamp" | "isRead" | "userId"
      >,
    ): Promise<void> => {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        isRead: false,
        userId,
      };

      // Check if notifications are enabled globally
      if (!notificationState.preferences.globalEnabled) {
        return;
      }

      // Check category preferences - using manual find for compatibility
      let categoryPref = null;
      for (
        let i = 0;
        i < notificationState.preferences.categories.length;
        i++
      ) {
        if (
          notificationState.preferences.categories[i].category ===
          notification.type
        ) {
          categoryPref = notificationState.preferences.categories[i];
          break;
        }
      }

      if (!categoryPref?.enabled) {
        return;
      }

      // Check quiet hours
      if (isInQuietHours(notificationState.preferences.quietHours)) {
        // Queue for later delivery if not urgent
        if (notification.priority !== NotificationPriority.URGENT) {
          return;
        }
      }

      // Add to state
      setNotificationState((prev) => ({
        ...prev,
        notifications: [
          newNotification,
          ...prev.notifications.slice(0, maxNotifications - 1),
        ],
      }));

      // Deliver through enabled channels
      await deliverNotification(newNotification, categoryPref.channels);

      // Save to backend
      await saveNotification(newNotification);
    },
    [userId, notificationState.preferences, maxNotifications],
  );
};

// Helper function to create mark as read function
export const createMarkAsReadFunction = (
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  return useCallback(async (notificationId: string): Promise<void> => {
    setNotificationState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif,
      ),
    }));

    // Update in backend
    await updateNotificationStatus(notificationId, { isRead: true });
  }, []);
};

// Helper function to create mark all as read function
export const createMarkAllAsReadFunction = (
  notificationState: NotificationState,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  return useCallback(async (): Promise<void> => {
    const unreadIds: string[] = [];
    for (let i = 0; i < notificationState.notifications.length; i++) {
      const notif = notificationState.notifications[i];
      if (!notif.isRead) {
        unreadIds.push(notif.id);
      }
    }

    setNotificationState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notif) => ({
        ...notif,
        isRead: true,
      })),
    }));

    // Update in backend
    await updateMultipleNotificationStatus(unreadIds, { isRead: true });
  }, [notificationState.notifications]);
};

// Helper function to create dismiss notification function
export const createDismissNotificationFunction = (
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  return useCallback(async (notificationId: string): Promise<void> => {
    setNotificationState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter(
        (notif) => notif.id !== notificationId,
      ),
    }));

    // Remove from backend
    await deleteNotification(notificationId);
  }, []);
};

// Helper function to create preferences update function
export const createUpdatePreferencesFunction = (
  userId: string,
  notificationState: NotificationState,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  return useCallback(
    async (prefs: Partial<NotificationPreferences>): Promise<void> => {
      const updatedPreferences = {
        ...notificationState.preferences,
        ...prefs,
      };

      setNotificationState((prev) => ({
        ...prev,
        preferences: updatedPreferences,
        deliveryChannels: updatedPreferences.channels,
      }));

      // Save to backend
      await saveNotificationPreferences(userId, updatedPreferences);
    },
    [userId, notificationState.preferences],
  );
};

// Helper function to create convenience notification functions
export const createConvenienceNotificationFunctions = (
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead" | "userId">,
  ) => Promise<void>,
) => {
  const showSuccess = useCallback(
    (title: string, message: string) => {
      return addNotification({
        type: NotificationType.SUCCESS,
        title,
        message,
        priority: NotificationPriority.LOW,
      });
    },
    [addNotification],
  );

  const showError = useCallback(
    (title: string, message: string) => {
      return addNotification({
        type: NotificationType.ERROR,
        title,
        message,
        priority: NotificationPriority.HIGH,
      });
    },
    [addNotification],
  );

  const showWarning = useCallback(
    (title: string, message: string) => {
      return addNotification({
        type: NotificationType.WARNING,
        title,
        message,
        priority: NotificationPriority.MEDIUM,
      });
    },
    [addNotification],
  );

  const showInfo = useCallback(
    (title: string, message: string) => {
      return addNotification({
        type: NotificationType.INFO,
        title,
        message,
        priority: NotificationPriority.LOW,
      });
    },
    [addNotification],
  );

  return { showSuccess, showError, showWarning, showInfo };
};

// Helper function to create relationship-specific notification functions
export const createRelationshipNotificationFunctions = (
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead" | "userId">,
  ) => Promise<void>,
  relationshipId?: string,
) => {
  const notifyTaskAssigned = useCallback(
    (taskTitle: string, keyholderName: string) => {
      return addNotification({
        type: NotificationType.TASK_ASSIGNED,
        title: "New Task Assigned",
        message: `${keyholderName} has assigned you: ${taskTitle}`,
        priority: NotificationPriority.MEDIUM,
        relationshipId,
      });
    },
    [addNotification, relationshipId],
  );

  const notifyTaskApproved = useCallback(
    (taskTitle: string) => {
      return addNotification({
        type: NotificationType.TASK_APPROVED,
        title: "Task Approved",
        message: `Your task "${taskTitle}" has been approved`,
        priority: NotificationPriority.LOW,
        relationshipId,
      });
    },
    [addNotification, relationshipId],
  );

  const notifySessionStarted = useCallback(() => {
    return addNotification({
      type: NotificationType.SESSION_STARTED,
      title: "Chastity Session Started",
      message: "Your chastity session has begun",
      priority: NotificationPriority.MEDIUM,
    });
  }, [addNotification]);

  const notifyRelationshipRequest = useCallback(
    (requesterName: string) => {
      return addNotification({
        type: NotificationType.RELATIONSHIP_REQUEST,
        title: "Relationship Request",
        message: `${requesterName} wants to establish a keyholder relationship with you`,
        priority: NotificationPriority.HIGH,
        actionUrl: "/relationships",
        actionText: "View Request",
      });
    },
    [addNotification],
  );

  return {
    notifyTaskAssigned,
    notifyTaskApproved,
    notifySessionStarted,
    notifyRelationshipRequest,
  };
};
