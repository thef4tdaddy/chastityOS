/**
 * NotificationListItem Component
 * Renders a single notification with delete action
 */
import React from "react";
import { Button } from "@/components/ui";
import { FaTimes } from "@/utils/iconImport";
import type { Notification } from "@/stores/notificationStore";

interface NotificationListItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
  icon: string;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({
  notification,
  onRemove,
  icon,
}) => {
  return (
    <div className="bg-nightly-mobile-bg/50 border border-nightly-celadon/20 rounded-lg p-3 hover:border-nightly-spring-green/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>

        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className="text-sm font-semibold text-nightly-honeydew mb-1">
              {notification.title}
            </p>
          )}
          <p className="text-sm text-nightly-celadon">{notification.message}</p>
          <p className="text-xs text-nightly-celadon/60 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 p-1 h-auto min-h-0 text-nightly-celadon/60 hover:text-red-400 transition-colors"
          aria-label="Remove notification"
        >
          <FaTimes className="w-4 h-4" />
        </Button>
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
  );
};
