/**
 * NotificationToast Component - Enhanced toast with priority support and animations
 * Replaces legacy react-toastify usage with unified, accessible notifications
 */
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Notification, NotificationPriority } from "../../stores/notificationStore";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

// Priority-based styling
const getPriorityStyles = (priority: NotificationPriority) => {
  switch (priority) {
    case "urgent":
      return {
        border: "border-red-500 border-2",
        background: "bg-red-900/90",
        text: "text-red-100",
        icon: "text-red-300",
        shadow: "shadow-red-500/25 shadow-lg",
      };
    case "high":
      return {
        border: "border-orange-500",
        background: "bg-orange-900/80",
        text: "text-orange-100",
        icon: "text-orange-300",
        shadow: "shadow-orange-500/20 shadow-md",
      };
    case "medium":
      return {
        border: "border-yellow-500",
        background: "bg-yellow-900/80",
        text: "text-yellow-100",
        icon: "text-yellow-300",
        shadow: "shadow-yellow-500/20 shadow-md",
      };
    case "low":
    default:
      return {
        border: "border-blue-500",
        background: "bg-blue-900/80",
        text: "text-blue-100",
        icon: "text-blue-300",
        shadow: "shadow-blue-500/15 shadow-sm",
      };
  }
};

// Type-based icons
const NotificationIcon: React.FC<{ type: string; priority: NotificationPriority }> = ({ type, priority }) => {
  const styles = getPriorityStyles(priority);
  const iconClass = `w-5 h-5 ${styles.icon}`;

  switch (type) {
    case "success":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "error":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "warning":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

// Notification Header Component
const NotificationHeader: React.FC<{
  title?: string;
  priority: NotificationPriority;
}> = ({ title, priority }) => {
  if (!title) return null;

  return (
    <h4 className="text-sm font-semibold mb-1">
      {title}
      {priority === "urgent" && (
        <span className="ml-2 text-xs px-2 py-0.5 bg-red-600 rounded-full text-red-100">
          URGENT
        </span>
      )}
    </h4>
  );
};

// Notification Action Button Component
const NotificationActionButton: React.FC<{
  action: { label: string; onClick: () => void };
  styles: ReturnType<typeof getPriorityStyles>;
  onDismiss: (id: string) => void;
  notificationId: string;
  dismissible: boolean;
}> = ({ action, styles, onDismiss, notificationId, dismissible }) => (
  <div className="mt-3">
    <button
      onClick={() => {
        action.onClick();
        if (dismissible) {
          onDismiss(notificationId);
        }
      }}
      className={`
        text-xs px-3 py-1.5 rounded border transition-colors
        ${styles.border} hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50
      `}
    >
      {action.label}
    </button>
  </div>
);

// Animation variants
const toastVariants = {
  initial: { opacity: 0, y: -50, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const toastRef = useRef<HTMLDivElement>(null);
  const styles = getPriorityStyles(notification.priority);

  // Handle keyboard navigation for accessibility
  useEffect(() => {
    if (notification.priority === "urgent" && toastRef.current) {
      toastRef.current.focus();
    }
  }, [notification.priority]);

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && notification.dismissible) {
      onDismiss(notification.id);
    }
    if (event.key === "Enter" && notification.action) {
      notification.action.onClick();
      if (notification.dismissible) {
        onDismiss(notification.id);
      }
    }
  };

  return (
    <motion.div
      ref={toastRef}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        flex items-start p-4 rounded-lg backdrop-blur-sm
        ${styles.background} ${styles.border} ${styles.text} ${styles.shadow}
        max-w-sm w-full cursor-default
        ${notification.priority === "urgent" ? "ring-2 ring-red-400" : ""}
      `}
      role="alert"
      aria-live={notification.priority === "urgent" ? "assertive" : "polite"}
      aria-atomic="true"
      tabIndex={notification.priority === "urgent" ? 0 : -1}
      onKeyDown={handleKeyDown}
    >
      <div className="flex-shrink-0">
        <NotificationIcon type={notification.type} priority={notification.priority} />
      </div>

      <div className="ml-3 flex-1">
        <NotificationHeader title={notification.title} priority={notification.priority} />
        <p className="text-sm">{notification.message}</p>

        {notification.action && (
          <NotificationActionButton
            action={notification.action}
            styles={styles}
            onDismiss={onDismiss}
            notificationId={notification.id}
            dismissible={notification.dismissible}
          />
        )}
      </div>

      {notification.dismissible && (
        <button
          onClick={() => onDismiss(notification.id)}
          className="ml-2 flex-shrink-0 text-white/60 hover:text-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </motion.div>
  );
};

export default NotificationToast;