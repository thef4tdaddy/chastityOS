import { useEffect, useCallback } from "react";
import { logger } from "../utils/logging";
import type { DBSession } from "../types/database";

interface UseTrackerHandlersProps {
  setCurrentSession: (session: DBSession | null) => void;
  setIsSessionInitialized: (initialized: boolean) => void;
  startHeartbeat: (sessionId: string) => void;
  stopHeartbeat: () => void;
  backupSession: (session: DBSession) => Promise<void>;
  mockData: {
    sessionId: string;
    userId: string;
    refreshPauseState: () => void;
  };
  currentSession: DBSession | null;
  isSessionInitialized: boolean;
}

export const useTrackerHandlers = ({
  setCurrentSession,
  setIsSessionInitialized,
  startHeartbeat: _startHeartbeat,
  stopHeartbeat,
  backupSession,
  mockData,
  currentSession,
  isSessionInitialized,
}: UseTrackerHandlersProps) => {
  const handleSessionInitialized = useCallback(() => {
    setIsSessionInitialized(true);
    logger.debug("Session persistence initialized");
  }, [setIsSessionInitialized]);

  const handleEmergencyUnlock = useCallback(() => {
    logger.info("Emergency unlock completed - refreshing session state", {
      sessionId: mockData.sessionId,
      userId: mockData.userId,
    });
  }, [mockData.sessionId, mockData.userId]);

  const handlePause = useCallback(() => {
    logger.info("Session paused", {
      sessionId: currentSession?.id,
      userId: mockData.userId,
    });
    mockData.refreshPauseState();
  }, [currentSession?.id, mockData]);

  const handleResume = useCallback(() => {
    logger.info("Session resumed", {
      sessionId: currentSession?.id,
      userId: mockData.userId,
    });
    mockData.refreshPauseState();
  }, [currentSession?.id, mockData]);

  // Initialize mock session with real DBSession structure
  useEffect(() => {
    const mockSession: DBSession = {
      id: "session123",
      userId: "user123",
      startTime: new Date(Date.now() - 86400000), // 1 day ago
      endTime: undefined,
      isPaused: false,
      pauseStartTime: undefined,
      accumulatedPauseTime: 3600, // 1 hour of accumulated pause time
      goalDuration: 172800, // 48 hour goal
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced" as const,
      lastModified: new Date(),
    };
    setCurrentSession(mockSession);
    // setCurrentSession is a state setter (stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backup session state when it changes
  useEffect(() => {
    if (currentSession && isSessionInitialized) {
      backupSession(currentSession).catch((error) => {
        logger.error("Failed to backup session", { error: error as Error });
      });
    }
    // backupSession should be stable (useCallback) in parent component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession, isSessionInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    handleSessionInitialized,
    handleEmergencyUnlock,
    handlePause,
    handleResume,
  };
};
