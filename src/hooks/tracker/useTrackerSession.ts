/**
 * Custom hook for tracker session management
 * Extracted from ChastityTracking to reduce complexity
 */

import { useState, useCallback } from "react";
import { useSessionPersistence } from "../useSessionPersistence";
import { useTrackerHandlers } from "../useTrackerHandlers";
import type { DBSession } from "@/types/database";
import type { SessionRestorationResult } from "@/services/SessionPersistenceService";

export const useTrackerSession = (
  userId: string | undefined,
  mockData: {
    sessionId: string;
    userId: string;
    refreshPauseState: () => void;
  },
) => {
  // Session persistence state
  const {
    isInitializing,
    error: persistenceError,
    backupSession,
    startHeartbeat,
    stopHeartbeat,
  } = useSessionPersistence({
    userId,
    autoInitialize: true,
  });

  // Session state management
  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);
  const [corruptedSession, setCorruptedSession] = useState<DBSession | null>(
    null,
  );

  // Tracker handlers
  const { handleSessionInitialized, handleEmergencyUnlock } =
    useTrackerHandlers({
      setCurrentSession,
      setIsSessionInitialized,
      startHeartbeat,
      stopHeartbeat,
      backupSession,
      mockData,
      currentSession,
      isSessionInitialized,
    });

  // Create handler functions
  const handleSessionRestored = useCallback(
    (result: SessionRestorationResult) => {
      if (result.session) {
        setCurrentSession(result.session);
        startHeartbeat(result.session.id);

        if (result.error && result.session) {
          setCorruptedSession(result.session);
          setShowSessionRecovery(true);
        }
      }
    },
    [startHeartbeat],
  );

  const handleRecoverSession = useCallback(
    async (session: DBSession) => {
      try {
        await backupSession(session);
        setCurrentSession(session);
        startHeartbeat(session.id);
        setShowSessionRecovery(false);
        setCorruptedSession(null);
      } catch {
        // Error already logged by service
      }
    },
    [backupSession, startHeartbeat],
  );

  const handleDiscardSession = useCallback(() => {
    setCurrentSession(null);
    setShowSessionRecovery(false);
    setCorruptedSession(null);
    stopHeartbeat();
  }, [stopHeartbeat]);

  return {
    // State
    isInitializing,
    persistenceError,
    currentSession,
    showSessionRecovery,
    isSessionInitialized,
    corruptedSession,
    // Handlers
    handleSessionInitialized,
    handleEmergencyUnlock,
    handleSessionRestored,
    handleRecoverSession,
    handleDiscardSession,
  };
};
