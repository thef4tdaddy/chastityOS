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
  EmptyState,
} from "@/components/ui";
import {
  useNotifications,
  useNotificationActions,
} from "@/stores/notificationStore";
import { FaBell, FaTrash } from "@/utils/iconImport";
import type { Notification } from "@/stores/notificationStore";
import {
  NotificationFilterBar,
  type NotificationType,
} from "./NotificationFilterBar";
import { NotificationGroup } from "./NotificationGroup";

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenterContent: React.FC<NotificationCenterProps> = ({
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

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-nightly-honeydew flex items-center gap-2">
              <FaBell className="w-6 h-6" />
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
              <FaTrash className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody>
        <NotificationFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          totalCount={notifications.length}
        >
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={<FaBell className="w-12 h-12" />}
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
                <NotificationGroup
                  key={date}
                  date={date}
                  notifications={items}
                  onRemove={removeNotification}
                  getIcon={getNotificationIcon}
                />
              ))}
            </div>
          )}
        </NotificationFilterBar>
      </CardBody>
    </Card>
  );
};

export const NotificationCenter = NotificationCenterContent;
