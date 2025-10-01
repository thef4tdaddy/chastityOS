/**
 * useNotifications - Comprehensive Notification System Hook
 *
 * Complete notification system for in-app, push, and email notifications
 * with user preferences and relationship context.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  NotificationState,
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationChannelType,
  NotificationPreferences,
  NotificationChannelSettings,
} from "../../types/realtime";
import {
  defaultPreferences,
  isInQuietHours,
  deliverNotification,
  fetchNotificationPreferences,
  fetchRecentNotifications,
  saveNotification,
  updateNotificationStatus,
  updateMultipleNotificationStatus,
  deleteNotification,
  saveNotificationPreferences,
} from "./notification-helpers";

interface UseNotificationsOptions {
  userId: string;
  relationshipId?: string;
  enablePush?: boolean;
  enableEmail?: boolean;
  maxNotifications?: number;
}

// Helper to create add notification function
const createAddNotificationFunction = (
  userId: string,
  notificationPreferences: NotificationPreferences,
  maxNotifications: number,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  return async (
    notification: Omit<Notification, "id" | "timestamp" | "isRead" | "userId">,
  ): Promise<void> => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
      userId,
    };

    // Check if notifications are enabled globally
    if (!notificationPreferences.globalEnabled) {
      return;
    }

    // Check category preferences
    const categoryPref = notificationPreferences.categories.find(
      (cat) => cat.category === notification.type,
    );

    if (!categoryPref?.enabled) {
      return;
    }

    // Check quiet hours
    if (isInQuietHours(notificationPreferences.quietHours)) {
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
  };
};

// Helper to create update preferences function
const createUpdatePreferencesFunction = (
  userId: string,
  notificationPreferences: NotificationPreferences,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  return async (prefs: Partial<NotificationPreferences>): Promise<void> => {
    const updatedPreferences = {
      ...notificationPreferences,
      ...prefs,
    };

    setNotificationState((prev) => ({
      ...prev,
      preferences: updatedPreferences,
      deliveryChannels: updatedPreferences.channels,
    }));

    // Save to backend
    await saveNotificationPreferences(userId, updatedPreferences);
  };
};

// Helper to create notification management functions
const createNotificationManagementFunctions = (
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  const markAsRead = async (notificationId: string): Promise<void> => {
    setNotificationState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif,
      ),
    }));

    // Update in backend
    await updateNotificationStatus(notificationId, { isRead: true });
  };

  const markAllAsRead = async (
    notifications: Notification[],
  ): Promise<void> => {
    const unreadIds = notifications
      .filter((notif) => !notif.isRead)
      .map((notif) => notif.id);

    setNotificationState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notif) => ({
        ...notif,
        isRead: true,
      })),
    }));

    // Update in backend
    await updateMultipleNotificationStatus(unreadIds, { isRead: true });
  };

  const dismissNotification = async (notificationId: string): Promise<void> => {
    setNotificationState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter(
        (notif) => notif.id !== notificationId,
      ),
    }));

    // Remove from backend
    await deleteNotification(notificationId);
  };

  return { markAsRead, markAllAsRead, dismissNotification };
};

// Helper to create channel management functions
const createChannelManagementFunctions = (
  notificationPreferences: NotificationPreferences,
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>,
) => {
  const enableChannel = async (
    channel: NotificationChannelType,
  ): Promise<void> => {
    const updatedChannels = notificationPreferences.channels.map((ch) =>
      ch.type === channel ? { ...ch, enabled: true } : ch,
    );

    await updatePreferences({ channels: updatedChannels });
  };

  const disableChannel = async (
    channel: NotificationChannelType,
  ): Promise<void> => {
    const updatedChannels = notificationPreferences.channels.map((ch) =>
      ch.type === channel ? { ...ch, enabled: false } : ch,
    );

    await updatePreferences({ channels: updatedChannels });
  };

  const updateChannelSettings = async (
    channel: NotificationChannelType,
    settings: NotificationChannelSettings,
  ): Promise<void> => {
    const updatedChannels = notificationPreferences.channels.map((ch) =>
      ch.type === channel
        ? { ...ch, settings: { ...ch.settings, ...settings } }
        : ch,
    );

    await updatePreferences({ channels: updatedChannels });
  };

  return { enableChannel, disableChannel, updateChannelSettings };
};

// Helper to create convenience notification methods
const createConvenienceMethods = (
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead" | "userId">,
  ) => Promise<void>,
) => {
  const showSuccess = (title: string, message: string) => {
    return addNotification({
      type: NotificationType.SUCCESS,
      title,
      message,
      priority: NotificationPriority.LOW,
    });
  };

  const showError = (title: string, message: string) => {
    return addNotification({
      type: NotificationType.ERROR,
      title,
      message,
      priority: NotificationPriority.HIGH,
    });
  };

  const showWarning = (title: string, message: string) => {
    return addNotification({
      type: NotificationType.WARNING,
      title,
      message,
      priority: NotificationPriority.MEDIUM,
    });
  };

  const showInfo = (title: string, message: string) => {
    return addNotification({
      type: NotificationType.INFO,
      title,
      message,
      priority: NotificationPriority.LOW,
    });
  };

  return { showSuccess, showError, showWarning, showInfo };
};

// Helper to create relationship-specific notification methods
const createRelationshipNotificationMethods = (
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead" | "userId">,
  ) => Promise<void>,
  relationshipId: string | undefined,
) => {
  const notifyTaskAssigned = (taskTitle: string, keyholderName: string) => {
    return addNotification({
      type: NotificationType.TASK_ASSIGNED,
      title: "New Task Assigned",
      message: `${keyholderName} has assigned you: ${taskTitle}`,
      priority: NotificationPriority.MEDIUM,
      relationshipId,
    });
  };

  const notifyTaskApproved = (taskTitle: string) => {
    return addNotification({
      type: NotificationType.TASK_APPROVED,
      title: "Task Approved",
      message: `Your task "${taskTitle}" has been approved`,
      priority: NotificationPriority.LOW,
      relationshipId,
    });
  };

  const notifySessionStarted = () => {
    return addNotification({
      type: NotificationType.SESSION_STARTED,
      title: "Chastity Session Started",
      message: "Your chastity session has begun",
      priority: NotificationPriority.MEDIUM,
    });
  };

  const notifyRelationshipRequest = (requesterName: string) => {
    return addNotification({
      type: NotificationType.RELATIONSHIP_REQUEST,
      title: "Relationship Request",
      message: `${requesterName} wants to establish a keyholder relationship with you`,
      priority: NotificationPriority.HIGH,
      actionUrl: "/relationships",
      actionText: "View Request",
    });
  };

  return {
    notifyTaskAssigned,
    notifyTaskApproved,
    notifySessionStarted,
    notifyRelationshipRequest,
  };
};

// Helper to create all notification helper methods
const createNotificationHelpers = (
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead" | "userId">,
  ) => Promise<void>,
  relationshipId: string | undefined,
  notificationPreferences: NotificationPreferences,
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>,
) => {
  const channelManagement = createChannelManagementFunctions(
    notificationPreferences,
    updatePreferences,
  );
  const convenienceMethods = createConvenienceMethods(addNotification);
  const relationshipMethods = createRelationshipNotificationMethods(
    addNotification,
    relationshipId,
  );

  return {
    ...channelManagement,
    ...convenienceMethods,
    ...relationshipMethods,
  };
};

// Helper to create initial notification state
const createInitialNotificationState = (): NotificationState => ({
  notifications: [],
  preferences: defaultPreferences,
  deliveryChannels: defaultPreferences.channels,
  notificationHistory: [],
});

// Helper hook to load notifications on mount
const useNotificationLoader = (
  userId: string,
  relationshipId: string | undefined,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user preferences
        const preferences = await fetchNotificationPreferences(userId);

        // Load recent notifications
        const notifications = await fetchRecentNotifications(
          userId,
          relationshipId,
        );

        setNotificationState((prev) => ({
          ...prev,
          preferences: { ...defaultPreferences, ...preferences },
          notifications,
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load notifications",
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadNotifications();
    }
  }, [userId, relationshipId, setNotificationState]);

  return { loading, error };
};

// Helper hook to request push notification permission
const usePushPermission = (enablePush: boolean) => {
  useEffect(() => {
    if (enablePush && "Notification" in window) {
      const requestPermission = async () => {
        if (Notification.permission === "default") {
          const _permission = await Notification.requestPermission();
          // Permission granted or denied
        }
      };

      requestPermission();
    }
  }, [enablePush]);
};

export const useNotifications = (options: UseNotificationsOptions) => {
  const {
    userId,
    relationshipId,
    enablePush = false,
    _enableEmail = false,
    maxNotifications = 100,
  } = options;

  // Notification state
  const [notificationState, setNotificationState] = useState(
    createInitialNotificationState,
  );

  // Use helper hooks
  const { loading, error } = useNotificationLoader(
    userId,
    relationshipId,
    setNotificationState,
  );

  usePushPermission(enablePush);

  // Add notification
  const addNotification = createAddNotificationFunction(
    userId,
    notificationState.preferences,
    maxNotifications,
    setNotificationState,
  );

  // Create management functions
  const managementFunctions =
    createNotificationManagementFunctions(setNotificationState);

  // Wrap markAllAsRead to include current notifications
  const markAllAsRead = useCallback(async (): Promise<void> => {
    await managementFunctions.markAllAsRead(notificationState.notifications);
  }, [managementFunctions, notificationState.notifications]);

  // Update preferences
  const updatePreferences = createUpdatePreferencesFunction(
    userId,
    notificationState.preferences,
    setNotificationState,
  );

  // Create all helper methods
  const helpers = createNotificationHelpers(
    addNotification,
    relationshipId,
    notificationState.preferences,
    updatePreferences,
  );

  return {
    notifications: notificationState.notifications,
    preferences: notificationState.preferences,
    loading,
    error,
    addNotification,
    ...managementFunctions,
    markAllAsRead,
    updatePreferences,
    ...helpers,
    unreadCount: notificationState.notifications.filter((n) => !n.isRead)
      .length,
    hasHighPriority: notificationState.notifications.some(
      (n) =>
        n.priority === NotificationPriority.HIGH ||
        n.priority === NotificationPriority.URGENT,
    ),
    recentNotifications: notificationState.notifications.slice(0, 10),
  };
};
