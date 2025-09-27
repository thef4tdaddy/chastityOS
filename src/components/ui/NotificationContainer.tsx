/**
 * NotificationContainer Component
 * Displays toast notifications using NotificationStore
 */
import React, { useEffect } from "react";
import { useNotificationStore, Notification } from "@/stores";

// Interface for notification actions used in this component
interface NotificationAction {
  label: string;
  handler: () => void;
  style?: "danger" | "secondary" | "primary";
}

// Simple icons for notification types
const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "success":
      return (
        <svg
          className="w-5 h-5 text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "error":
      return (
        <svg
          className="w-5 h-5 text-red-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          className="w-5 h-5 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "loading":
      return (
        <svg
          className="animate-spin w-5 h-5 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      );
    default:
      return (
        <svg
          className="w-5 h-5 text-blue-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

const NotificationContainer: React.FC = () => {
  // Selective subscriptions for specific notification store values
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );
  const pauseOnHover = useNotificationStore((state) => state.pauseOnHover);

  // Group notifications by position
  const notificationsByPosition = notifications.reduce(
    (acc: Record<string, Notification[]>, notification: Notification) => {
      const position = (notification as any).position || "top-right";
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(notification);
      return acc;
    },
    {} as Record<string, Notification[]>,
  );

  const getPositionClasses = (position: string) => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 right-4";
    }
  };

  const getTypeClasses = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "loading":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <>
      {Object.entries(notificationsByPosition).map(
        ([position, positionNotifications]) => (
          <div
            key={position}
            className={`fixed z-50 ${getPositionClasses(position)} space-y-2 max-w-sm w-full`}
          >
            {positionNotifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`
                flex items-start p-4 border rounded-lg shadow-lg backdrop-blur-sm
                ${getTypeClasses(notification.type)}
                ${pauseOnHover ? "hover:shadow-xl transition-shadow" : ""}
              `}
                role="alert"
              >
                <div className="flex-shrink-0">
                  <NotificationIcon type={notification.type} />
                </div>

                <div className="ml-3 flex-1">
                  {notification.title && (
                    <h4 className="text-sm font-medium mb-1">
                      {notification.title}
                    </h4>
                  )}
                  <p className="text-sm">{notification.message}</p>

                  {notification.actions && notification.actions.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                      {notification.actions.map(
                        (action: NotificationAction, index: number) => (
                          <button
                            key={index}
                            onClick={() => {
                              action.handler();
                              if (notification.dismissible !== false) {
                                removeNotification(notification.id);
                              }
                            }}
                            className={`
                          text-xs px-2 py-1 rounded border transition-colors
                          ${
                            action.style === "danger"
                              ? "border-red-300 text-red-700 hover:bg-red-100"
                              : action.style === "secondary"
                                ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                                : "border-current text-current hover:bg-current hover:bg-opacity-10"
                          }
                        `}
                          >
                            {action.label}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {notification.dismissible !== false && (
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ),
      )}
    </>
  );
};

export default NotificationContainer;
