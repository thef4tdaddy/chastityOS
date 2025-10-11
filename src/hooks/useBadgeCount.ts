/**
 * useBadgeCount Hook
 * Manages badge count display using the Badge API
 */
import { useEffect, useCallback } from "react";
import { serviceLogger } from "@/utils/logging";
import * as Sentry from "@sentry/react";

const logger = serviceLogger("useBadgeCount");

export interface UseBadgeCountOptions {
  pendingTasksCount?: number;
  unreadNotificationsCount?: number;
  enabled?: boolean;
}

export interface UseBadgeCountReturn {
  updateBadge: (count: number) => void;
  clearBadge: () => void;
  isSupported: boolean;
}

/**
 * Hook to manage app badge count
 * Automatically updates badge when counts change
 */
export function useBadgeCount({
  pendingTasksCount = 0,
  unreadNotificationsCount = 0,
  enabled = true,
}: UseBadgeCountOptions = {}): UseBadgeCountReturn {
  const isSupported =
    typeof navigator !== "undefined" && "setAppBadge" in navigator;

  // Update badge count
  const updateBadge = useCallback(
    (count: number) => {
      if (!enabled || !isSupported) {
        return;
      }

      try {
        if (count > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).setAppBadge(count);
          logger.debug("Badge count updated", { count });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).clearAppBadge();
          logger.debug("Badge cleared");
        }
      } catch (error) {
        logger.error("Failed to update badge", { error, count });
        Sentry.captureException(error);
      }
    },
    [enabled, isSupported],
  );

  // Clear badge
  const clearBadge = useCallback(() => {
    if (!isSupported) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).clearAppBadge();
      logger.debug("Badge cleared");
    } catch (error) {
      logger.error("Failed to clear badge", { error });
      Sentry.captureException(error);
    }
  }, [isSupported]);

  // Auto-update badge when counts change
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const totalCount = pendingTasksCount + unreadNotificationsCount;
    updateBadge(totalCount);
    // Note: updateBadge is stable due to useCallback with proper deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTasksCount, unreadNotificationsCount, enabled]);

  // Clear badge when component unmounts or page is focused
  useEffect(() => {
    const handleFocus = () => {
      // Optional: clear badge when app is focused
      // This is commented out as behavior may vary by use case
      // clearBadge();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return {
    updateBadge,
    clearBadge,
    isSupported,
  };
}
