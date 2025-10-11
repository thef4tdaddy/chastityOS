/**
 * NotificationGroup Component
 * Groups notifications by date
 */
import React from "react";
import { NotificationListItem } from "./NotificationListItem";
import type { Notification } from "@/stores/notificationStore";

interface NotificationGroupProps {
  date: string;
  notifications: Notification[];
  onRemove: (id: string) => void;
  getIcon: (notification: Notification) => string;
}

export const NotificationGroup: React.FC<NotificationGroupProps> = ({
  date,
  notifications,
  onRemove,
  getIcon,
}) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-nightly-celadon mb-3">
        {date}
      </h3>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationListItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
            icon={getIcon(notification)}
          />
        ))}
      </div>
    </div>
  );
};
