/**
 * useNotifications - Comprehensive Notification System Hook
 *
 * Complete notification system for in-app, push, and email notifications
 * with user preferences and relationship context.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  NotificationState,
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationChannelType,
  NotificationPreferences,
  NotificationChannel,
  NotificationChannelSettings,
  QuietHours,
  NotificationCategoryPreference,
  NotificationHistoryEntry,
  NotificationDeliveryStatus,
} from "../../types/realtime";
import {
  isInQuietHours,
  deliverNotification,
  fetchNotificationPreferences,
  fetchRecentNotifications,
  saveNotification,
  updateNotificationStatus,
  updateMultipleNotificationStatus,
  deleteNotification,
  saveNotificationPreferences,
} from "./notificationHelpers";
import {
  createNotificationFactory,
  createMarkAsReadFunction,
  createMarkAllAsReadFunction,
  createDismissNotificationFunction,
  createUpdatePreferencesFunction,
  createConvenienceNotificationFunctions,
  createRelationshipNotificationFunctions,
} from "./notificationOperations";

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

export const useNotifications = (options: UseNotificationsOptions) => {
  const {
    userId,
    relationshipId,
    enablePush = false,
    enableEmail = false,
    maxNotifications = 100,
  } = options;

  // Notification state
  const [notificationState, setNotificationState] = useState<NotificationState>(
    {
      notifications: [],
      preferences: defaultPreferences,
      deliveryChannels: defaultPreferences.channels,
      notificationHistory: [],
    },
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notifications and preferences on mount
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
  }, [userId, relationshipId]);

  // Request push notification permission
  useEffect(() => {
    if (enablePush && "Notification" in window) {
      const requestPermission = async () => {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
      };

      requestPermission();
    }
  }, [enablePush]);

  // Create notification operations using helper functions
  const addNotification = createNotificationFactory(
    userId,
    notificationState,
    setNotificationState,
    maxNotifications,
  );

  const markAsRead = createMarkAsReadFunction(setNotificationState);
  const markAllAsRead = createMarkAllAsReadFunction(
    notificationState,
    setNotificationState,
  );
  const dismissNotification =
    createDismissNotificationFunction(setNotificationState);
  const updatePreferences = createUpdatePreferencesFunction(
    userId,
    notificationState,
    setNotificationState,
  );

  // Channel management functions
  const enableChannel = useCallback(
    async (channel: NotificationChannelType): Promise<void> => {
      const updatedChannels = notificationState.preferences.channels.map(
        (ch) => (ch.type === channel ? { ...ch, enabled: true } : ch),
      );
      await updatePreferences({ channels: updatedChannels });
    },
    [notificationState.preferences.channels, updatePreferences],
  );

  const disableChannel = useCallback(
    async (channel: NotificationChannelType): Promise<void> => {
      const updatedChannels = notificationState.preferences.channels.map(
        (ch) => (ch.type === channel ? { ...ch, enabled: false } : ch),
      );
      await updatePreferences({ channels: updatedChannels });
    },
    [notificationState.preferences.channels, updatePreferences],
  );

  const updateChannelSettings = useCallback(
    async (
      channel: NotificationChannelType,
      settings: NotificationChannelSettings,
    ): Promise<void> => {
      const updatedChannels = notificationState.preferences.channels.map(
        (ch) =>
          ch.type === channel
            ? { ...ch, settings: { ...ch.settings, ...settings } }
            : ch,
      );
      await updatePreferences({ channels: updatedChannels });
    },
    [notificationState.preferences.channels, updatePreferences],
  );

  // Create convenience and relationship notification functions
  const { showSuccess, showError, showWarning, showInfo } =
    createConvenienceNotificationFunctions(addNotification);

  const {
    notifyTaskAssigned,
    notifyTaskApproved,
    notifySessionStarted,
    notifyRelationshipRequest,
  } = createRelationshipNotificationFunctions(addNotification, relationshipId);

  // Computed values
  const computedValues = useMemo(() => {
    const unreadCount = notificationState.notifications.filter(
      (n) => !n.isRead,
    ).length;
    const hasHighPriority = notificationState.notifications.some(
      (n) =>
        n.priority === NotificationPriority.HIGH ||
        n.priority === NotificationPriority.URGENT,
    );
    const recentNotifications = notificationState.notifications.slice(0, 10);

    return {
      unreadCount,
      hasHighPriority,
      recentNotifications,
    };
  }, [notificationState.notifications]);

  return {
    // Notification state
    notifications: notificationState.notifications,
    preferences: notificationState.preferences,
    loading,
    error,

    // Notification management
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,

    // Preferences
    updatePreferences,
    enableChannel,
    disableChannel,
    updateChannelSettings,

    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Relationship-specific methods
    notifyTaskAssigned,
    notifyTaskApproved,
    notifySessionStarted,
    notifyRelationshipRequest,

    // Computed values
    ...computedValues,
  };
};
