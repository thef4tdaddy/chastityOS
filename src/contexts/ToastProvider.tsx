/**
 * ToastProvider - React Context for global toast notifications
 * Provides unified toast API with priority support and accessibility
 */
import React, { createContext, useContext, useCallback, useEffect, useMemo, ReactNode } from "react";
import { useNotificationStore, Notification, NotificationPriority } from "../stores/notificationStore";
import { toastBridge } from "../utils/toastBridge";

export interface ToastOptions {
  title?: string;
  priority?: NotificationPriority;
  duration?: number;
  dismissible?: boolean;
  requireInteraction?: boolean;
  position?: Notification["position"];
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface ToastContextValue {
  // Core toast methods
  showToast: (
    message: string,
    type: Notification["type"],
    options?: ToastOptions
  ) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;

  // Convenience methods with priority defaults
  showSuccess: (message: string, options?: Omit<ToastOptions, "priority">) => string;
  showError: (message: string, options?: Omit<ToastOptions, "priority">) => string;
  showWarning: (message: string, options?: Omit<ToastOptions, "priority">) => string;
  showInfo: (message: string, options?: Omit<ToastOptions, "priority">) => string;
  
  // Priority-specific methods
  showUrgent: (message: string, options?: Omit<ToastOptions, "priority">) => string;
  showHigh: (message: string, options?: Omit<ToastOptions, "priority">) => string;
  showMedium: (message: string, options?: Omit<ToastOptions, "priority">) => string;
  showLow: (message: string, options?: Omit<ToastOptions, "priority">) => string;

  // State access
  toasts: Notification[];
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // Use selective subscription for better performance
  const addNotification = useNotificationStore((state) => state.addNotification);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const clearAllNotifications = useNotificationStore((state) => state.clearAllNotifications);
  const notifications = useNotificationStore((state) => state.notifications);

  // Core toast method
  const showToast = useCallback(
    (
      message: string,
      type: Notification["type"],
      options: ToastOptions = {}
    ): string => {
      return addNotification({
        type,
        message,
        title: options.title,
        priority: options.priority || "medium",
        duration: options.duration,
        dismissible: options.dismissible,
        requireInteraction: options.requireInteraction,
        position: options.position,
        action: options.action,
        icon: options.icon,
        metadata: options.metadata,
      });
    },
    [addNotification]
  );

  // Dismiss toast
  const dismissToast = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    clearAllNotifications();
  }, [clearAllNotifications]);

  // Convenience methods by type with smart priority defaults
  const showSuccess = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "success", { priority: "low", ...options });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "error", { priority: "high", ...options });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "warning", { priority: "medium", ...options });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "info", { priority: "low", ...options });
    },
    [showToast]
  );

  // Priority-specific methods
  const showUrgent = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "error", { 
        priority: "urgent", 
        requireInteraction: true,
        ...options 
      });
    },
    [showToast]
  );

  const showHigh = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "warning", { priority: "high", ...options });
    },
    [showToast]
  );

  const showMedium = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "info", { priority: "medium", ...options });
    },
    [showToast]
  );

  const showLow = useCallback(
    (message: string, options: Omit<ToastOptions, "priority"> = {}) => {
      return showToast(message, "info", { priority: "low", ...options });
    },
    [showToast]
  );

  const contextValue: ToastContextValue = useMemo(() => ({
    showToast,
    dismissToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showUrgent,
    showHigh,
    showMedium,
    showLow,
    toasts: notifications,
  }), [
    showToast, dismissToast, clearAllToasts, showSuccess, showError, 
    showWarning, showInfo, showUrgent, showHigh, showMedium, 
    showLow, notifications
  ]);

  // Register with the bridge for non-React services
  useEffect(() => {
    toastBridge.registerShowToast(contextValue);
    return () => {
      toastBridge.unregisterShowToast();
    };
  }, [contextValue]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook - Primary interface for toast notifications
 * 
 * @example
 * const { showSuccess, showError, showUrgent } = useToast();
 * 
 * // Simple usage
 * showSuccess("Data saved successfully!");
 * 
 * // With options
 * showError("Failed to save", { 
 *   title: "Save Error",
 *   action: { label: "Retry", onClick: handleRetry }
 * });
 * 
 * // Urgent notification
 * showUrgent("Critical system error!", {
 *   title: "System Alert",
 *   action: { label: "Contact Support", onClick: openSupport }
 * });
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;