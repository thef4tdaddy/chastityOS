/**
 * Notification Store
 * UI state management for toast messages, alerts, and notifications
 * Zustand store - handles notification display and interactions
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("NotificationStore");

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export interface NotificationConfig {
  id: string;
  type: NotificationType;
  title?: string | undefined;
  message: string;
  duration?: number | undefined; // Auto-dismiss after milliseconds, 0 means never auto-dismiss
  dismissible?: boolean | undefined; // Can be dismissed manually
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center"
    | undefined;
  createdAt: Date;
  actions?: NotificationAction[] | undefined;
  data?: Record<string, any> | undefined; // Additional data for the notification
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  style?: "primary" | "secondary" | "danger";
}

export interface NotificationState {
  notifications: NotificationConfig[];
  defaultDuration: number;
  defaultPosition: NotificationConfig["position"];
  maxNotifications: number;
  pauseOnHover: boolean;
}

export interface NotificationActions {
  // Notification management
  addNotification: (
    config: Omit<NotificationConfig, "id" | "createdAt">,
  ) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  clearByType: (type: NotificationType) => void;

  // Convenience methods
  success: (message: string, options?: Partial<NotificationConfig>) => string;
  error: (message: string, options?: Partial<NotificationConfig>) => string;
  warning: (message: string, options?: Partial<NotificationConfig>) => string;
  info: (message: string, options?: Partial<NotificationConfig>) => string;
  loading: (message: string, options?: Partial<NotificationConfig>) => string;

  // Update existing notifications
  updateNotification: (
    id: string,
    updates: Partial<NotificationConfig>,
  ) => void;

  // Settings
  setDefaultDuration: (duration: number) => void;
  setDefaultPosition: (position: NotificationConfig["position"]) => void;
  setMaxNotifications: (max: number) => void;
  setPauseOnHover: (pause: boolean) => void;

  // Queries
  getNotification: (id: string) => NotificationConfig | undefined;
  getNotificationsByType: (type: NotificationType) => NotificationConfig[];
  hasNotifications: () => boolean;

  // Reset
  resetStore: () => void;
}

export interface NotificationStore
  extends NotificationState,
    NotificationActions {}

const initialState: NotificationState = {
  notifications: [],
  defaultDuration: 5000, // 5 seconds
  defaultPosition: "top-right",
  maxNotifications: 5,
  pauseOnHover: true,
};

// Auto-dismiss timers
const dismissTimers = new Map<string, NodeJS.Timeout>();

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Notification management
      addNotification: (config) => {
        const {
          notifications,
          maxNotifications,
          defaultDuration,
          defaultPosition,
        } = get();

        const id =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const notification: NotificationConfig = {
          id,
          createdAt: new Date(),
          type: "info",
          duration: defaultDuration,
          dismissible: true,
          position: defaultPosition,
          message: "",
          ...config,
        };

        // Limit number of notifications
        let newNotifications = [...notifications, notification];
        if (newNotifications.length > maxNotifications) {
          const removedNotifications = newNotifications.slice(
            0,
            newNotifications.length - maxNotifications,
          );
          newNotifications = newNotifications.slice(-maxNotifications);

          // Clear timers for removed notifications
          removedNotifications.forEach((removed) => {
            if (dismissTimers.has(removed.id)) {
              clearTimeout(dismissTimers.get(removed.id));
              dismissTimers.delete(removed.id);
            }
          });
        }

        set({ notifications: newNotifications });

        // Set auto-dismiss timer if duration > 0
        if (notification.duration && notification.duration > 0) {
          const timer = setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);

          dismissTimers.set(id, timer);
        }

        logger.debug("Notification added", {
          id,
          type: notification.type,
          message: notification.message,
          duration: notification.duration,
        });

        return id;
      },

      removeNotification: (id: string) => {
        const { notifications } = get();

        // Clear auto-dismiss timer
        if (dismissTimers.has(id)) {
          clearTimeout(dismissTimers.get(id));
          dismissTimers.delete(id);
        }

        const newNotifications = notifications.filter((n) => n.id !== id);
        set({ notifications: newNotifications });

        logger.debug("Notification removed", { id });
      },

      clearNotifications: () => {
        // Clear all auto-dismiss timers
        dismissTimers.forEach((timer) => clearTimeout(timer));
        dismissTimers.clear();

        set({ notifications: [] });
        logger.debug("All notifications cleared");
      },

      clearByType: (type: NotificationType) => {
        const { notifications } = get();

        // Clear timers for notifications of this type
        notifications
          .filter((n) => n.type === type)
          .forEach((n) => {
            if (dismissTimers.has(n.id)) {
              clearTimeout(dismissTimers.get(n.id));
              dismissTimers.delete(n.id);
            }
          });

        const newNotifications = notifications.filter((n) => n.type !== type);
        set({ notifications: newNotifications });

        logger.debug("Notifications cleared by type", { type });
      },

      // Convenience methods
      success: (message: string, options = {}) => {
        return get().addNotification({
          type: "success",
          message,
          ...options,
        });
      },

      error: (message: string, options = {}) => {
        return get().addNotification({
          type: "error",
          message,
          duration: 8000, // Errors stay longer by default
          ...options,
        });
      },

      warning: (message: string, options = {}) => {
        return get().addNotification({
          type: "warning",
          message,
          duration: 7000, // Warnings stay longer
          ...options,
        });
      },

      info: (message: string, options = {}) => {
        return get().addNotification({
          type: "info",
          message,
          ...options,
        });
      },

      loading: (message: string, options = {}) => {
        return get().addNotification({
          type: "loading",
          message,
          duration: 0, // Loading notifications don't auto-dismiss
          dismissible: false,
          ...options,
        });
      },

      // Update existing notifications
      updateNotification: (
        id: string,
        updates: Partial<NotificationConfig>,
      ) => {
        const { notifications } = get();

        const notificationIndex = notifications.findIndex((n) => n.id === id);
        if (notificationIndex === -1) {
          logger.warn("Attempted to update non-existent notification", { id });
          return;
        }

        const updatedNotifications = [...notifications];
        const existingNotification = updatedNotifications[notificationIndex];
        updatedNotifications[notificationIndex] = {
          ...existingNotification,
          ...updates,
        };

        set({ notifications: updatedNotifications });

        logger.debug("Notification updated", { id, updates });
      },

      // Settings
      setDefaultDuration: (duration: number) => {
        set({ defaultDuration: duration });
        logger.debug("Default duration set", { duration });
      },

      setDefaultPosition: (position: NotificationConfig["position"]) => {
        set({ defaultPosition: position });
        logger.debug("Default position set", { position });
      },

      setMaxNotifications: (max: number) => {
        const { notifications } = get();

        set({ maxNotifications: max });

        // Trim notifications if needed
        if (notifications.length > max) {
          const excessNotifications = notifications.slice(
            0,
            notifications.length - max,
          );
          const trimmedNotifications = notifications.slice(-max);

          // Clear timers for excess notifications
          excessNotifications.forEach((n) => {
            if (dismissTimers.has(n.id)) {
              clearTimeout(dismissTimers.get(n.id));
              dismissTimers.delete(n.id);
            }
          });

          set({ notifications: trimmedNotifications });
        }

        logger.debug("Max notifications set", { max });
      },

      setPauseOnHover: (pause: boolean) => {
        set({ pauseOnHover: pause });
        logger.debug("Pause on hover set", { pause });
      },

      // Queries
      getNotification: (id: string) => {
        const { notifications } = get();
        return notifications.find((n) => n.id === id);
      },

      getNotificationsByType: (type: NotificationType) => {
        const { notifications } = get();
        return notifications.filter((n) => n.type === type);
      },

      hasNotifications: () => {
        const { notifications } = get();
        return notifications.length > 0;
      },

      // Reset
      resetStore: () => {
        // Clear all auto-dismiss timers
        dismissTimers.forEach((timer) => clearTimeout(timer));
        dismissTimers.clear();

        set(initialState);
        logger.debug("Notification store reset to initial state");
      },
    }),
    {
      name: "notification-store",
      // Only enable devtools in development
      enabled:
        import.meta.env.MODE === "development" ||
        import.meta.env.MODE === "nightly",
    },
  ),
);
