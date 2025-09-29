/**
 * NotificationContainer Component
 * Enhanced container with priority-based positioning and animations
 */
import React from "react";
import { AnimatePresence } from "framer-motion";
import { useNotificationStore } from "../../stores";
import { Notification } from "../../stores/notificationStore";
import NotificationToast from "../notifications/NotificationToast";

const NotificationContainer: React.FC = () => {
  // Selective subscriptions for specific notification store values
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );

  // Group notifications by position with priority sorting
  const notificationsByPosition = notifications
    .sort((a, b) => {
      // Sort by priority: urgent > high > medium > low
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .reduce(
      (acc: Record<string, Notification[]>, notification: Notification) => {
        const position = notification.position || "top-right";
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

  return (
    <>
      {Object.entries(notificationsByPosition).map(
        ([position, positionNotifications]) => (
          <div
            key={position}
            className={`fixed z-50 ${getPositionClasses(position)} space-y-3 max-w-sm w-full pointer-events-none`}
          >
            <AnimatePresence mode="popLayout">
              {positionNotifications.map((notification: Notification) => (
                <div key={notification.id} className="pointer-events-auto">
                  <NotificationToast
                    notification={notification}
                    onDismiss={removeNotification}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        ),
      )}
    </>
  );
};

export default NotificationContainer;
