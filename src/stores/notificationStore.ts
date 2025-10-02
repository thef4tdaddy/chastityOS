/**
 * Notification Store - Temporary UI Feedback
 * Manages toast messages, alerts, and temporary UI feedback
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  priority: "low" | "medium" | "high" | "urgent";
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 means persistent
  dismissible?: boolean;
  requireInteraction?: boolean; // for urgent priority
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string; // optional custom icon
  metadata?: Record<string, unknown>; // extensible metadata
  timestamp: Date;
}

export interface NotificationState {
  // Notifications list
  notifications: Notification[];

  // Configuration
  pauseOnHover?: boolean;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;

  // Convenience methods
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;

  // Reset function for testing
  resetStore: () => void;
}

// Additional type exports for compatibility with index.ts
export interface NotificationActions {
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
}

export type NotificationStore = NotificationState;
export type NotificationType = "success" | "error" | "warning" | "info";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationAction = {
  label: string;
  onClick: () => void;
};

// Default durations for different notification priorities
const DEFAULT_DURATIONS = {
  low: 3000,
  medium: 5000,
  high: 7000,
  urgent: 0, // Persistent - requires interaction
};

// Fallback durations by type (legacy support)
const TYPE_DURATIONS = {
  success: 4000,
  error: 0, // Persistent for errors
  warning: 6000,
  info: 4000,
};

const initialState = {
  notifications: [],
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,
      pauseOnHover: true,

      // Actions
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Determine priority from type if not specified
        const priority =
          notification.priority ||
          (notification.type === "error"
            ? "high"
            : notification.type === "warning"
              ? "medium"
              : "low");

        // Set duration based on priority, with fallback to type
        const duration =
          notification.duration !== undefined
            ? notification.duration
            : DEFAULT_DURATIONS[priority] || TYPE_DURATIONS[notification.type];

        // Urgent priority requires interaction
        const requireInteraction =
          priority === "urgent" || notification.requireInteraction;

        const newNotification: Notification = {
          id,
          timestamp: new Date(),
          priority,
          duration,
          dismissible: true,
          requireInteraction,
          ...notification,
        };

        set(
          (state) => ({
            notifications: [...state.notifications, newNotification],
          }),
          false,
          `addNotification:${notification.type}:${priority}`,
        );

        // Auto-remove notification after duration if specified and not requiring interaction
        if (
          newNotification.duration &&
          newNotification.duration > 0 &&
          !newNotification.requireInteraction
        ) {
          setTimeout(() => {
            useNotificationStore.getState().removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id: string) =>
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }),
          false,
          `removeNotification:${id}`,
        ),

      clearAllNotifications: () =>
        set({ notifications: [] }, false, "clearAllNotifications"),

      updateNotification: (id: string, updates: Partial<Notification>) =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, ...updates } : n,
            ),
          }),
          false,
          `updateNotification:${id}`,
        ),

      // Convenience methods
      showSuccess: (message: string, title?: string, duration?: number) => {
        const notificationData: Omit<Notification, "id" | "timestamp"> = {
          type: "success",
          message,
          title,
        };
        if (duration !== undefined) {
          notificationData.duration = duration;
        }
        return get().addNotification(notificationData);
      },

      showError: (message: string, title?: string, duration?: number) => {
        const notificationData: Omit<Notification, "id" | "timestamp"> = {
          type: "error",
          message,
          title,
        };
        if (duration !== undefined) {
          notificationData.duration = duration;
        }
        return get().addNotification(notificationData);
      },

      showWarning: (message: string, title?: string, duration?: number) => {
        const notificationData: Omit<Notification, "id" | "timestamp"> = {
          type: "warning",
          message,
          title,
        };
        if (duration !== undefined) {
          notificationData.duration = duration;
        }
        return get().addNotification(notificationData);
      },

      showInfo: (message: string, title?: string, duration?: number) => {
        const notificationData: Omit<Notification, "id" | "timestamp"> = {
          type: "info",
          message,
          title,
        };
        if (duration !== undefined) {
          notificationData.duration = duration;
        }
        return get().addNotification(notificationData);
      },

      // Reset function for testing
      resetStore: () => set(initialState, false, "resetStore"),
    }),
    {
      name: "notification-store",
    },
  ),
);

// Selector hooks for better performance
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);

// Export individual action selectors to avoid object creation
export const useNotificationActions = () => {
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );
  const clearAllNotifications = useNotificationStore(
    (state) => state.clearAllNotifications,
  );
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const showWarning = useNotificationStore((state) => state.showWarning);
  const showInfo = useNotificationStore((state) => state.showInfo);

  return {
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Utility hooks for common notification patterns
export const useErrorHandler = () => {
  const { showError } = useNotificationActions();

  const handleError = (error: Error | string, title = "Error") => {
    const message = typeof error === "string" ? error : error.message;
    return showError(message, title);
  };

  return { handleError };
};

export const useSuccessHandler = () => {
  const { showSuccess } = useNotificationActions();

  const handleSuccess = (message: string, title = "Success") => {
    return showSuccess(message, title);
  };

  return { handleSuccess };
};
