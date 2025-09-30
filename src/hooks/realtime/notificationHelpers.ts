/**
 * Notification helper functions
 */
import {
  Notification,
  NotificationChannelType,
  NotificationPriority,
  QuietHours,
  NotificationPreferences,
} from "../../types/realtime";

// Helper function to check if current time is in quiet hours
export function isInQuietHours(quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Check if current day is in quiet hours days
  let isDayIncluded = false;
  for (let i = 0; i < quietHours.days.length; i++) {
    if (quietHours.days[i] === currentDay) {
      isDayIncluded = true;
      break;
    }
  }

  if (!isDayIncluded) {
    return false;
  }

  // Simple time comparison (doesn't handle cross-midnight ranges properly)
  return (
    currentTime >= quietHours.startTime && currentTime <= quietHours.endTime
  );
}

// Helper function to deliver notification through all channels
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

  // Use Promise.all instead of Promise.allSettled for compatibility
  try {
    await Promise.all(deliveryPromises);
  } catch {
    // Handle delivery errors
  }
}

// Helper function to deliver push notification
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

// Helper function to deliver email notification
export async function deliverEmailNotification(
  _notification: Notification,
): Promise<void> {
  // In real implementation, send email via backend API
}

// Helper function to deliver SMS notification
export async function deliverSMSNotification(
  _notification: Notification,
): Promise<void> {
  // In real implementation, send SMS via backend API
}

// Backend API helper functions
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
