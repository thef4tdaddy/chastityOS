/**
 * NotificationPermissionBanner Component
 * Non-intrusive banner for requesting notification permissions
 */
import React, { useState, useEffect } from "react";
import { Alert, Button } from "@/components/ui";
import { FiBell, FiX } from "react-icons/fi";

export interface NotificationPermissionBannerProps {
  onRequestPermission: () => Promise<NotificationPermission>;
  showOnMount?: boolean;
  autoShowDelay?: number; // ms to wait before showing
  className?: string;
}

const BANNER_DISMISSED_KEY = "chastityos-notification-banner-dismissed";
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
    const dismissedData = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedData) {
      const { timestamp } = JSON.parse(dismissedData);
      if (Date.now() - timestamp < BANNER_DISMISSED_EXPIRY) {
        return undefined;
      }
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
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    // Remember dismissal
    localStorage.setItem(
      BANNER_DISMISSED_KEY,
      JSON.stringify({ timestamp: Date.now() }),
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Alert variant="info" className={`relative ${className}`}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-nightly-celadon hover:text-nightly-honeydew transition-colors"
        aria-label="Dismiss"
      >
        <FiX className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <FiBell className="w-5 h-5 text-nightly-spring-green flex-shrink-0 mt-0.5" />

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
