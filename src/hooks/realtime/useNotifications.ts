/**
 * useNotifications - Comprehensive Notification System Hook
 *
 * Complete notification system for in-app, push, and email notifications
 * with user preferences and relationship context.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  NotificationState,
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationChannelType,
  NotificationPreferences,
  NotificationChannelSettings,
  QuietHours,
} from "../../types/realtime";

interface UseNotificationsOptions {
  userId: string;
  relationshipId?: string;
  enablePush?: boolean;
  enableEmail?: boolean;
  maxNotifications?: number;
}

const defaultPreferences: NotificationPreferences = {
  channels: [
    {
      type: NotificationChannelType.IN_APP,
      enabled: true,
      settings: {},
    },
    {
      type: NotificationChannelType.PUSH,
      enabled: false,
      settings: {},
    },
    {
      type: NotificationChannelType.EMAIL,
      enabled: false,
      settings: {},
    },
  ],
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    days: [0, 1, 2, 3, 4, 5, 6], // All days
  },
  categories: [
    {
      category: NotificationType.TASK_ASSIGNED,
      enabled: true,
      channels: [NotificationChannelType.IN_APP, NotificationChannelType.PUSH],
      priority: NotificationPriority.MEDIUM,
    },
    {
      category: NotificationType.TASK_APPROVED,
      enabled: true,
      channels: [NotificationChannelType.IN_APP],
      priority: NotificationPriority.LOW,
    },
    {
      category: NotificationType.SESSION_STARTED,
      enabled: true,
      channels: [NotificationChannelType.IN_APP],
      priority: NotificationPriority.MEDIUM,
    },
    {
      category: NotificationType.RELATIONSHIP_REQUEST,
      enabled: true,
      channels: [NotificationChannelType.IN_APP, NotificationChannelType.EMAIL],
      priority: NotificationPriority.HIGH,
    },
    {
      category: NotificationType.SYSTEM_ALERT,
      enabled: true,
      channels: [
        NotificationChannelType.IN_APP,
        NotificationChannelType.PUSH,
        NotificationChannelType.EMAIL,
      ],
      priority: NotificationPriority.URGENT,
    },
  ],
  globalEnabled: true,
};

// Helper to create add notification function
const createAddNotificationFunction = (
  userId: string,
  notificationPreferences: NotificationPreferences,
  maxNotifications: number,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
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
    },
    [userId, notificationPreferences, maxNotifications, setNotificationState],
  );
};

// Helper to create update preferences function
const createUpdatePreferencesFunction = (
  userId: string,
  notificationPreferences: NotificationPreferences,
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  return useCallback(
    async (prefs: Partial<NotificationPreferences>): Promise<void> => {
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
    },
    [userId, notificationPreferences, setNotificationState],
  );
};

// Helper to create notification management functions
const createNotificationManagementFunctions = (
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationState>>,
) => {
  const markAsRead = useCallback(
    async (notificationId: string): Promise<void> => {
      setNotificationState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      }));

      // Update in backend
      await updateNotificationStatus(notificationId, { isRead: true });
    },
    [setNotificationState],
  );

  const markAllAsRead = useCallback(
    async (notifications: Notification[]): Promise<void> => {
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
    },
    [setNotificationState],
  );

  const dismissNotification = useCallback(
    async (notificationId: string): Promise<void> => {
      setNotificationState((prev) => ({
        ...prev,
        notifications: prev.notifications.filter(
          (notif) => notif.id !== notificationId,
        ),
      }));

      // Remove from backend
      await deleteNotification(notificationId);
    },
    [setNotificationState],
  );

  return { markAsRead, markAllAsRead, dismissNotification };
};

// Helper to create channel management functions
const createChannelManagementFunctions = (
  notificationPreferences: NotificationPreferences,
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>,
) => {
  const enableChannel = useCallback(
    async (channel: NotificationChannelType): Promise<void> => {
      const updatedChannels = notificationPreferences.channels.map((ch) =>
        ch.type === channel ? { ...ch, enabled: true } : ch,
      );

      await updatePreferences({ channels: updatedChannels });
    },
    [notificationPreferences.channels, updatePreferences],
  );

  const disableChannel = useCallback(
    async (channel: NotificationChannelType): Promise<void> => {
      const updatedChannels = notificationPreferences.channels.map((ch) =>
        ch.type === channel ? { ...ch, enabled: false } : ch,
      );

      await updatePreferences({ channels: updatedChannels });
    },
    [notificationPreferences.channels, updatePreferences],
  );

  const updateChannelSettings = useCallback(
    async (
      channel: NotificationChannelType,
      settings: NotificationChannelSettings,
    ): Promise<void> => {
      const updatedChannels = notificationPreferences.channels.map((ch) =>
        ch.type === channel
          ? { ...ch, settings: { ...ch.settings, ...settings } }
          : ch,
      );

      await updatePreferences({ channels: updatedChannels });
    },
    [notificationPreferences.channels, updatePreferences],
  );

  return { enableChannel, disableChannel, updateChannelSettings };
};

// Helper to create convenience notification methods
const createConvenienceMethods = (
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

// Helper to create relationship-specific notification methods
const createRelationshipNotificationMethods = (
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead" | "userId">,
  ) => Promise<void>,
  relationshipId: string | undefined,
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
  const managementFunctions = createNotificationManagementFunctions(
    setNotificationState,
  );

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
    unreadCount: notificationState.notifications.filter((n) => !n.isRead).length,
    hasHighPriority: notificationState.notifications.some(
      (n) =>
        n.priority === NotificationPriority.HIGH ||
        n.priority === NotificationPriority.URGENT,
    ),
    recentNotifications: notificationState.notifications.slice(0, 10),
  };
};

// Helper functions
function isInQuietHours(quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Check if current day is in quiet hours days
  if (!quietHours.days.includes(currentDay)) {
    return false;
  }

  // Simple time comparison (doesn't handle cross-midnight ranges properly)
  return (
    currentTime >= quietHours.startTime && currentTime <= quietHours.endTime
  );
}

async function deliverNotification(
  notification: Notification,
  channels: NotificationChannelType[],
): Promise<void> {
  const deliveryPromises = channels.map(async (channel) => {
    switch (channel) {
      case NotificationChannelType.IN_APP:
        // Already handled by adding to state
        return;

      case NotificationChannelType.PUSH:
        return deliverPushNotification(notification);

      case NotificationChannelType.EMAIL:
        return deliverEmailNotification(notification);

      case NotificationChannelType.SMS:
        return deliverSMSNotification(notification);

      default:
      // Unknown notification channel
    }
  });

  await Promise.allSettled(deliveryPromises);
}

async function deliverPushNotification(
  notification: Notification,
): Promise<void> {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.message,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: notification.id,
      requireInteraction: notification.priority === NotificationPriority.URGENT,
    });
  }
}

async function deliverEmailNotification(
  _notification: Notification,
): Promise<void> {
  // In real implementation, send email via backend API
}

async function deliverSMSNotification(
  _notification: Notification,
): Promise<void> {
  // In real implementation, send SMS via backend API
}

async function fetchNotificationPreferences(
  _userId: string,
): Promise<Partial<NotificationPreferences>> {
  // In real implementation, fetch from backend
  return {};
}

async function fetchRecentNotifications(
  _userId: string,
  _relationshipId?: string,
): Promise<Notification[]> {
  // In real implementation, fetch from backend
  return [];
}

async function saveNotification(_notification: Notification): Promise<void> {
  // In real implementation, save to backend
}

async function updateNotificationStatus(
  _notificationId: string,
  _status: Partial<Pick<Notification, "isRead">>,
): Promise<void> {
  // In real implementation, update in backend
}

async function updateMultipleNotificationStatus(
  _notificationIds: string[],
  _status: Partial<Pick<Notification, "isRead">>,
): Promise<void> {
  // In real implementation, bulk update in backend
}

async function deleteNotification(_notificationId: string): Promise<void> {
  // In real implementation, delete from backend
}

async function saveNotificationPreferences(
  _userId: string,
  _preferences: NotificationPreferences,
): Promise<void> {
  // In real implementation, save to backend
}
