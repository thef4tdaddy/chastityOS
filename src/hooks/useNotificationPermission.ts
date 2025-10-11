/**
 * useNotificationPermission Hook
 * Manages notification permission state and request flow
 */
import { useState, useEffect, useCallback } from "react";
import { FCMService } from "@/services/notifications/FCMService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useNotificationPermission");

// Local storage keys
const PERMISSION_PROMPTED_KEY = "chastityos_notification_prompted";
const PERMISSION_DENIED_COUNT_KEY = "chastityos_notification_denied_count";
const PERMISSION_LAST_DENIED_KEY = "chastityos_notification_last_denied";

// Constants
const MAX_DENIAL_COUNT = 3; // Max times to re-prompt after denial
const DENIAL_COOLDOWN_DAYS = 7; // Days to wait before re-prompting after denial

export type NotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export interface NotificationPermissionHook {
  permission: NotificationPermissionState;
  isSupported: boolean;
  hasPrompted: boolean;
  canPrompt: boolean;
  requestPermission: () => Promise<NotificationPermissionState>;
  resetPromptState: () => void;
}

/**
 * Hook for managing notification permissions
 */
export const useNotificationPermission = (): NotificationPermissionHook => {
  const [permission, setPermission] =
    useState<NotificationPermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Check support and initial permission state
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await FCMService.isNotificationSupported();
      setIsSupported(supported);

      if (supported && "Notification" in window) {
        setPermission(Notification.permission as NotificationPermissionState);
      } else {
        setPermission("unsupported");
      }
    };

    checkSupport();

    // Check if we've already prompted the user
    const prompted = localStorage.getItem(PERMISSION_PROMPTED_KEY) === "true";
    setHasPrompted(prompted);
  }, []);

  /**
   * Check if we can prompt the user based on denial history
   */
  const canPrompt = useCallback((): boolean => {
    // Can't prompt if unsupported or already granted
    if (!isSupported || permission === "granted") {
      return false;
    }

    // Can't prompt if browser has blocked permission requests
    if (permission === "denied") {
      return false;
    }

    // Check denial history
    const denialCount = parseInt(
      localStorage.getItem(PERMISSION_DENIED_COUNT_KEY) || "0",
      10,
    );
    const lastDenied = localStorage.getItem(PERMISSION_LAST_DENIED_KEY);

    // If denied too many times, don't prompt again
    if (denialCount >= MAX_DENIAL_COUNT) {
      logger.info("Max denial count reached, not prompting", { denialCount });
      return false;
    }

    // If recently denied, check cooldown period
    if (lastDenied) {
      const lastDeniedDate = new Date(lastDenied);
      const cooldownEnd = new Date(
        lastDeniedDate.getTime() + DENIAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
      );

      if (new Date() < cooldownEnd) {
        logger.info("Still in cooldown period after denial", {
          cooldownEnd: cooldownEnd.toISOString(),
        });
        return false;
      }
    }

    return true;
  }, [isSupported, permission]);

  /**
   * Request notification permission from the user
   */
  const requestPermission =
    useCallback(async (): Promise<NotificationPermissionState> => {
      if (!isSupported) {
        logger.info("Cannot request permission - notifications not supported");
        return "unsupported";
      }

      if (!("Notification" in window)) {
        logger.error("Notification API not available");
        return "unsupported";
      }

      try {
        logger.debug("Requesting notification permission");

        const result = await Notification.requestPermission();

        logger.info("Permission request result", { result });

        // Update local storage
        localStorage.setItem(PERMISSION_PROMPTED_KEY, "true");
        setHasPrompted(true);

        // Track denials
        if (result === "denied") {
          const currentCount = parseInt(
            localStorage.getItem(PERMISSION_DENIED_COUNT_KEY) || "0",
            10,
          );
          localStorage.setItem(
            PERMISSION_DENIED_COUNT_KEY,
            String(currentCount + 1),
          );
          localStorage.setItem(
            PERMISSION_LAST_DENIED_KEY,
            new Date().toISOString(),
          );

          logger.info("Permission denied", {
            denialCount: currentCount + 1,
          });
        } else if (result === "granted") {
          // Reset denial tracking on grant
          localStorage.removeItem(PERMISSION_DENIED_COUNT_KEY);
          localStorage.removeItem(PERMISSION_LAST_DENIED_KEY);

          logger.info("Permission granted");
        }

        setPermission(result as NotificationPermissionState);
        return result as NotificationPermissionState;
      } catch (error) {
        logger.error("Error requesting permission", { error });
        return permission;
      }
    }, [isSupported, permission]);

  /**
   * Reset prompt state (for testing/debugging)
   */
  const resetPromptState = useCallback(() => {
    localStorage.removeItem(PERMISSION_PROMPTED_KEY);
    localStorage.removeItem(PERMISSION_DENIED_COUNT_KEY);
    localStorage.removeItem(PERMISSION_LAST_DENIED_KEY);
    setHasPrompted(false);
    logger.debug("Prompt state reset");
  }, []);

  return {
    permission,
    isSupported,
    hasPrompted,
    canPrompt: canPrompt(),
    requestPermission,
    resetPromptState,
  };
};

export default useNotificationPermission;
