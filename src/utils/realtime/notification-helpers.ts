/**
 * Notification helper functions
 */
import {
  Notification,
  NotificationChannelType,
  NotificationPriority,
  NotificationPreferences,
  NotificationType,
  QuietHours,
} from "../../types/realtime";

export const defaultPreferences: NotificationPreferences = {
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

export function isInQuietHours(quietHours: QuietHours): boolean {
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

export async function deliverNotification(
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

export async function deliverPushNotification(
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

export async function deliverEmailNotification(
  _notification: Notification,
): Promise<void> {
  // In real implementation, send email via backend API
}

export async function deliverSMSNotification(
  _notification: Notification,
): Promise<void> {
  // In real implementation, send SMS via backend API
}

export async function fetchNotificationPreferences(
  _userId: string,
): Promise<Partial<NotificationPreferences>> {
  // In real implementation, fetch from backend
  return {};
}

export async function fetchRecentNotifications(
  _userId: string,
  _relationshipId?: string,
): Promise<Notification[]> {
  // In real implementation, fetch from backend
  return [];
}

export async function saveNotification(
  _notification: Notification,
): Promise<void> {
  // In real implementation, save to backend
}

export async function updateNotificationStatus(
  _notificationId: string,
  _status: Partial<Pick<Notification, "isRead">>,
): Promise<void> {
  // In real implementation, update in backend
}

export async function updateMultipleNotificationStatus(
  _notificationIds: string[],
  _status: Partial<Pick<Notification, "isRead">>,
): Promise<void> {
  // In real implementation, bulk update in backend
}

export async function deleteNotification(
  _notificationId: string,
): Promise<void> {
  // In real implementation, delete from backend
}

export async function saveNotificationPreferences(
  _userId: string,
  _preferences: NotificationPreferences,
): Promise<void> {
  // In real implementation, save to backend
}
