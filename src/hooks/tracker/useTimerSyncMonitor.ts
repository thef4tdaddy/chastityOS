/**
 * useTimerSyncMonitor
 * Hook to monitor timer synchronization issues and provide user feedback
 */

import { useState, useEffect } from "react";
import { TimerService, TimerSyncIssue } from "@/services/TimerService";
import type { DBSession } from "@/types/database";
import { logger } from "@/utils/logging";

interface TimerSyncState {
  issue: TimerSyncIssue | null;
  lastCheck: Date | null;
}

export const useTimerSyncMonitor = (session: DBSession | null) => {
  const [syncState, setSyncState] = useState<TimerSyncState>({
    issue: null,
    lastCheck: null,
  });

  useEffect(() => {
    if (!session) {
      setSyncState({ issue: null, lastCheck: null });
      return;
    }

    // Check timer sync on mount and periodically
    const checkSync = () => {
      const currentTime = new Date();
      const issue = TimerService.validateTimerData(session, currentTime);

      if (issue) {
        logger.warn("Timer sync issue detected", {
          issue,
          sessionId: session.id,
        });
      }

      setSyncState({
        issue,
        lastCheck: currentTime,
      });
    };

    // Initial check
    checkSync();

    // Check every 30 seconds
    const interval = setInterval(checkSync, 30000);

    return () => clearInterval(interval);
  }, [session]);

  return {
    syncIssue: syncState.issue,
    hasSyncIssue: syncState.issue !== null,
    isCriticalSyncIssue: syncState.issue?.severity === "error",
  };
};
