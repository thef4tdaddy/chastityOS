/**
 * Notification Store - Temporary UI Feedback
 * Manages toast messages, alerts, and temporary UI feedback
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 means persistent
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

export interface NotificationState {
  // Notifications list
  notifications: Notification[];

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
}

// Default durations for different notification types
const DEFAULT_DURATIONS = {
  success: 4000,
  error: 0, // Persistent for errors
  warning: 6000,
  info: 4000,
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],

      // Actions
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          id,
          timestamp: new Date(),
          duration: DEFAULT_DURATIONS[notification.type],
          dismissible: true,
          ...notification,
        };

        set(
          (state) => ({
            notifications: [...state.notifications, newNotification],
          }),
          false,
          `addNotification:${notification.type}`,
        );

        // Auto-remove notification after duration if specified
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
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
        return get().addNotification({
          type: "success",
          message,
          title,
          duration,
        });
      },

      showError: (message: string, title?: string, duration?: number) => {
        return get().addNotification({
          type: "error",
          message,
          title,
          duration,
        });
      },

      showWarning: (message: string, title?: string, duration?: number) => {
        return get().addNotification({
          type: "warning",
          message,
          title,
          duration,
        });
      },

      showInfo: (message: string, title?: string, duration?: number) => {
        return get().addNotification({
          type: "info",
          message,
          title,
          duration,
        });
      },
    }),
    {
      name: "notification-store",
    },
  ),
);

// Selector hooks for better performance
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);

export const useNotificationActions = () =>
  useNotificationStore((state) => ({
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearAllNotifications: state.clearAllNotifications,
    showSuccess: state.showSuccess,
    showError: state.showError,
    showWarning: state.showWarning,
    showInfo: state.showInfo,
  }));

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
