/**
 * useNotificationPermission Hook
 * Manages notification permission state and request flow
 */
import { useState, useEffect, useCallback } from "react";
import { FCMService } from "@/services/notifications/FCMService";
import { NotificationPermissionStorage } from "@/services/notificationPermissionStorage";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useNotificationPermission");

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
    const prompted = NotificationPermissionStorage.hasBeenPrompted();
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
    const denialCount = NotificationPermissionStorage.getDenialCount();
    const lastDeniedDate = NotificationPermissionStorage.getLastDenialDate();

    // If denied too many times, don't prompt again
    if (denialCount >= MAX_DENIAL_COUNT) {
      logger.info("Max denial count reached, not prompting", { denialCount });
      return false;
    }

    // If recently denied, check cooldown period
    if (lastDeniedDate) {
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

        // Update storage
        NotificationPermissionStorage.markAsPrompted();
        setHasPrompted(true);

        // Track denials
        if (result === "denied") {
          NotificationPermissionStorage.incrementDenialCount();
          NotificationPermissionStorage.recordDenial();

          const denialCount = NotificationPermissionStorage.getDenialCount();
          logger.info("Permission denied", { denialCount });
        } else if (result === "granted") {
          // Reset denial tracking on grant
          NotificationPermissionStorage.resetDenialTracking();
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
    NotificationPermissionStorage.resetAll();
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
