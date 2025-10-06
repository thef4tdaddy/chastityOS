/**
 * Custom hook for tracker session management
 * Extracted from ChastityTracking to reduce complexity
 */

import { useState, useCallback } from "react";
import { useSessionPersistence } from "../useSessionPersistence";
import { useTrackerHandlers } from "../useTrackerHandlers";
import type { DBSession } from "@/types/database";
import type { SessionRestorationResult } from "@/services/SessionPersistenceService";

// Helper function to handle session restoration
const createSessionRestorationHandler =
  (
    setCurrentSession: (session: DBSession | null) => void,
    startHeartbeat: (sessionId: string) => void,
    setCorruptedSession: (session: DBSession | null) => void,
    setShowSessionRecovery: (show: boolean) => void,
  ) =>
  (result: SessionRestorationResult) => {
    if (result.session) {
      setCurrentSession(result.session);
      startHeartbeat(result.session.id);

      if (result.error && result.session) {
        setCorruptedSession(result.session);
        setShowSessionRecovery(true);
      }
    }
  };

// Helper function to handle session recovery
const createSessionRecoveryHandler =
  (
    setCurrentSession: (session: DBSession | null) => void,
    backupSession: (session: DBSession) => Promise<void>,
    startHeartbeat: (sessionId: string) => void,
    setShowSessionRecovery: (show: boolean) => void,
    setCorruptedSession: (session: DBSession | null) => void,
  ) =>
  async (session: DBSession) => {
    try {
      await backupSession(session);
      setCurrentSession(session);
      startHeartbeat(session.id);
      setShowSessionRecovery(false);
      setCorruptedSession(null);
    } catch (_error) {
      // Error already logged by service
    }
  };

// Helper function to handle session discard
const createSessionDiscardHandler =
  (
    setCurrentSession: (session: DBSession | null) => void,
    setShowSessionRecovery: (show: boolean) => void,
    setCorruptedSession: (session: DBSession | null) => void,
    stopHeartbeat: () => void,
  ) =>
  () => {
    setCurrentSession(null);
    setShowSessionRecovery(false);
    setCorruptedSession(null);
    stopHeartbeat();
  };

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
    createSessionRestorationHandler(
      setCurrentSession,
      startHeartbeat,
      setCorruptedSession,
      setShowSessionRecovery,
    ),
    [startHeartbeat],
  );

  const handleRecoverSession = useCallback(
    createSessionRecoveryHandler(
      setCurrentSession,
      backupSession,
      startHeartbeat,
      setShowSessionRecovery,
      setCorruptedSession,
    ),
    [backupSession, startHeartbeat],
  );

  const handleDiscardSession = useCallback(
    createSessionDiscardHandler(
      setCurrentSession,
      setShowSessionRecovery,
      setCorruptedSession,
      stopHeartbeat,
    ),
    [stopHeartbeat],
  );

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
