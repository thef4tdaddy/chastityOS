/**
 * NotificationPermissionBanner Component
 * Non-intrusive banner for requesting notification permissions
 */
import React, { useState, useEffect } from "react";
import { Alert, Button } from "@/components/ui";
import { FaBell, FaTimes } from "../../utils/iconImport";
import { NotificationPermissionStorage } from "@/services/notificationPermissionStorage";

export interface NotificationPermissionBannerProps {
  onRequestPermission: () => Promise<"default" | "granted" | "denied">;
  showOnMount?: boolean;
  autoShowDelay?: number; // ms to wait before showing
  className?: string;
}

const BANNER_DISMISSED_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const NotificationPermissionBanner: React.FC<
  NotificationPermissionBannerProps
> = ({
  onRequestPermission,
  showOnMount = false,
  autoShowDelay = 5000,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed recently
    if (
      NotificationPermissionStorage.isBannerDismissed(BANNER_DISMISSED_EXPIRY)
    ) {
      return undefined;
    }

    // Check if permission is already granted or denied
    if (typeof Notification === "undefined") {
      return undefined;
    }

    const permission = Notification.permission;
    if (permission === "granted" || permission === "denied") {
      return undefined;
    }

    // Show banner after delay if configured
    if (showOnMount) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, autoShowDelay);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [showOnMount, autoShowDelay]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await onRequestPermission();
      if (result === "granted" || result === "denied") {
        setVisible(false);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    // Remember dismissal
    NotificationPermissionStorage.dismissBanner();
  };

  if (!visible) {
    return null;
  }

  return (
    <Alert variant="info" className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-nightly-celadon hover:text-nightly-honeydew transition-colors p-1 h-auto min-h-0"
        aria-label="Dismiss"
      >
        <FaTimes className="w-5 h-5" />
      </Button>

      <div className="flex items-start gap-3 pr-8">
        <FaBell className="w-5 h-5 text-nightly-spring-green flex-shrink-0 mt-0.5" />

        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-nightly-honeydew">
            Stay Updated with Notifications
          </p>
          <p className="text-xs text-nightly-celadon">
            Enable notifications to get alerts about new tasks, deadlines, and
            important updates even when the app is closed.
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="text-xs"
            >
              {isRequesting ? "Requesting..." : "Enable Notifications"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
};
