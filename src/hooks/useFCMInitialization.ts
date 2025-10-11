/**
 * useFCMInitialization Hook
 * Handles FCM initialization and token management on app startup
 */
import { useEffect, useCallback } from "react";
import { FCMService } from "@/services/notifications/FCMService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useFCMInitialization");

export interface FCMInitializationOptions {
  userId: string | null;
  isAuthenticated: boolean;
  onTokenReceived?: (token: string) => void;
}

/**
 * Hook to initialize FCM and manage token lifecycle
 */
export const useFCMInitialization = ({
  userId,
  isAuthenticated,
  onTokenReceived,
}: FCMInitializationOptions) => {
  // Initialize FCM and request token when user is authenticated
  const initializeFCM = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      logger.debug("Skipping FCM initialization - user not authenticated");
      return;
    }

    try {
      // Check if notifications are supported
      const isSupported = await FCMService.isNotificationSupported();
      if (!isSupported) {
        logger.info("FCM not supported on this device/browser");
        return;
      }

      // Check current permission state
      if ("Notification" in window && Notification.permission === "granted") {
        logger.debug("Notification permission already granted, getting token");

        // Get or refresh token
        const token = await FCMService.requestToken(userId);
        if (token && onTokenReceived) {
          onTokenReceived(token);
        }
      } else {
        logger.debug("Notification permission not granted, waiting for user");
      }
    } catch (error) {
      logger.error("Error initializing FCM", { error });
    }
  }, [userId, isAuthenticated, onTokenReceived]);

  // Initialize on mount and when auth state changes
  useEffect(() => {
    initializeFCM();
  }, [initializeFCM]);

  // Setup token refresh listener
  useEffect(() => {
    if (!userId || !isAuthenticated) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unsubscribe = await FCMService.setupTokenRefreshListener(
          userId,
          (token) => {
            logger.info("FCM token refreshed", { userId });
            if (onTokenReceived) {
              onTokenReceived(token);
            }
          },
        );
      } catch (error) {
        logger.error("Error setting up token refresh listener", { error });
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, isAuthenticated, onTokenReceived]);

  // Cleanup: Delete token on unmount if user signs out
  useEffect(() => {
    return () => {
      // This will run when the component unmounts
      // Note: We don't delete token on every unmount, only on actual logout
      // The actual deletion should be handled in the sign-out flow
    };
  }, []);
};
