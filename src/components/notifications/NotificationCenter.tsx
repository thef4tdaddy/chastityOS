/**
 * NotificationCenter Component
 * Displays notification history with filtering and actions
 */
import React, { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import {
  useNotifications,
  useNotificationActions,
} from "@/stores/notificationStore";
import { FiBell, FiTrash2, FiCheckCircle, FiX } from "react-icons/fi";
import type { Notification } from "@/stores/notificationStore";

const NOTIFICATION_TYPES = [
  "all",
  "session",
  "task",
  "keyholder",
  "system",
] as const;
type NotificationType = (typeof NOTIFICATION_TYPES)[number];

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = "",
}) => {
  const notifications = useNotifications();
  const { removeNotification, clearAllNotifications } =
    useNotificationActions();
  const [activeFilter, setActiveFilter] = useState<NotificationType>("all");

  // Filter notifications by type
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") {
      return notifications;
    }

    return notifications.filter((notification) => {
      const type = notification.metadata?.type as string | undefined;
      if (!type) return false;

      return type.startsWith(activeFilter);
    });
  }, [notifications, activeFilter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};

    filteredNotifications.forEach((notification) => {
      const date = new Date(notification.timestamp);
      const key = date.toLocaleDateString();

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      clearAllNotifications();
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const type = notification.metadata?.type as string | undefined;

    if (type?.startsWith("task")) return "📋";
    if (type?.startsWith("session")) return "🔒";
    if (type?.startsWith("keyholder")) return "🔑";
    if (type?.startsWith("system")) return "⚙️";

    return "🔔";
  };

  const getNotificationTypeColor = (notification: Notification) => {
    switch (notification.type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-nightly-honeydew flex items-center gap-2">
              <FiBell className="w-6 h-6" />
              Notification Center
            </h2>
            <p className="text-nightly-celadon text-sm mt-1">
              Recent notifications (last 30 days)
            </p>
          </div>

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-300"
            >
              <FiTrash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody>
        <Tabs
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as NotificationType)}
          tabs={[
            { value: "all", label: `All (${notifications.length})` },
            { value: "task", label: "Tasks" },
            { value: "session", label: "Sessions" },
            { value: "keyholder", label: "Keyholder" },
            { value: "system", label: "System" },
          ]}
        >
          <TabsContent
            value={activeFilter}
            activeValue={activeFilter}
            className="mt-4"
          >
            {filteredNotifications.length === 0 ? (
              <EmptyState
                icon={<FiBell className="w-12 h-12" />}
                title="No notifications"
                description={
                  activeFilter === "all"
                    ? "You're all caught up! No notifications to show."
                    : `No ${activeFilter} notifications to show.`
                }
              />
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-nightly-celadon mb-3">
                      {date}
                    </h3>
                    <div className="space-y-2">
                      {items.map((notification) => (
                        <div
                          key={notification.id}
                          className="bg-nightly-mobile-bg/50 border border-nightly-celadon/20 rounded-lg p-3 hover:border-nightly-spring-green/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">
                              {getNotificationIcon(notification)}
                            </span>

                            <div className="flex-1 min-w-0">
                              {notification.title && (
                                <p className="text-sm font-semibold text-nightly-honeydew mb-1">
                                  {notification.title}
                                </p>
                              )}
                              <p className="text-sm text-nightly-celadon">
                                {notification.message}
                              </p>
                              <p className="text-xs text-nightly-celadon/60 mt-1">
                                {new Date(
                                  notification.timestamp,
                                ).toLocaleTimeString()}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                removeNotification(notification.id)
                              }
                              className="flex-shrink-0 p-1 text-nightly-celadon/60 hover:text-red-400 transition-colors"
                              aria-label="Remove notification"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>

                          {notification.action && (
                            <div className="mt-2 pt-2 border-t border-nightly-celadon/10">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={notification.action.onClick}
                                className="text-xs"
                              >
                                {notification.action.label}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardBody>
    </Card>
  );
};
