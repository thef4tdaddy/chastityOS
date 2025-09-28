/**
 * Session Persistence Hook
 * Provides React integration for session persistence functionality
 */
import { useState, useEffect, useCallback } from "react";
import { sessionPersistenceService } from "../services";
import type {
  SessionRestorationResult,
  SessionPersistenceState,
} from "../services/SessionPersistenceService";
import type { DBSession } from "../types/database";
import { serviceLogger } from "../utils/logging";

const logger = serviceLogger("useSessionPersistence");

export interface UseSessionPersistenceOptions {
  userId?: string;
  autoInitialize?: boolean;
}

export interface UseSessionPersistenceReturn {
  isInitializing: boolean;
  restorationResult: SessionRestorationResult | null;
  error: string | null;
  isSessionRestored: boolean;

  // Actions
  initializeSession: (userId: string) => Promise<SessionRestorationResult>;
  backupSession: (session: DBSession) => Promise<void>;
  startHeartbeat: (sessionId: string) => void;
  stopHeartbeat: () => void;
  detectAndRecover: (userId: string) => Promise<SessionRestorationResult>;

  // State getters
  getBackupState: () => SessionPersistenceState | null;
}

export function useSessionPersistence(
  options: UseSessionPersistenceOptions = {},
): UseSessionPersistenceReturn {
  const { userId, autoInitialize = true } = options;

  const [isInitializing, setIsInitializing] = useState(false);
  const [restorationResult, setRestorationResult] =
    useState<SessionRestorationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSessionRestored, setIsSessionRestored] = useState(false);

  // Initialize session persistence when userId is available
  const initializeSession = useCallback(
    async (targetUserId: string): Promise<SessionRestorationResult> => {
      try {
        setIsInitializing(true);
        setError(null);

        logger.debug("Initializing session persistence", {
          userId: targetUserId,
        });

        const result =
          await sessionPersistenceService.initializeSessionState(targetUserId);
        setRestorationResult(result);
        setIsSessionRestored(result.wasRestored);

        if (!result.success && result.error) {
          setError(result.error);
        }

        logger.debug("Session persistence initialized", {
          userId: targetUserId,
          wasRestored: result.wasRestored,
          success: result.success,
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        logger.error("Failed to initialize session persistence", {
          error: err as Error,
          userId: targetUserId,
        });

        return {
          success: false,
          error: errorMessage,
          wasRestored: false,
        };
      } finally {
        setIsInitializing(false);
      }
    },
    [],
  );

  // Backup session state
  const backupSession = useCallback(
    async (session: DBSession): Promise<void> => {
      try {
        await sessionPersistenceService.backupSessionState(session);
        logger.debug("Session backed up", { sessionId: session.id });
      } catch (err) {
        logger.error("Failed to backup session", {
          error: err as Error,
          sessionId: session.id,
        });
        throw err;
      }
    },
    [],
  );

  // Start heartbeat
  const startHeartbeat = useCallback((sessionId: string): void => {
    sessionPersistenceService.startHeartbeat(sessionId);
    logger.debug("Heartbeat started", { sessionId });
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback((): void => {
    sessionPersistenceService.stopHeartbeat();
    logger.debug("Heartbeat stopped");
  }, []);

  // Detect and recover from interruptions
  const detectAndRecover = useCallback(
    async (targetUserId: string): Promise<SessionRestorationResult> => {
      try {
        logger.debug("Detecting and recovering session", {
          userId: targetUserId,
        });

        const result =
          await sessionPersistenceService.detectAndRecover(targetUserId);

        if (result.wasRestored) {
          setRestorationResult(result);
          setIsSessionRestored(true);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        logger.error("Failed to detect and recover session", {
          error: err as Error,
          userId: targetUserId,
        });

        return {
          success: false,
          error: errorMessage,
          wasRestored: false,
        };
      }
    },
    [],
  );

  // Get current backup state
  const getBackupState = useCallback((): SessionPersistenceState | null => {
    try {
      const backup = localStorage.getItem("chastity_session_backup");
      return backup ? JSON.parse(backup) : null;
    } catch (err) {
      logger.error("Failed to get backup state", { error: err as Error });
      return null;
    }
  }, []);

  // Auto-initialize when userId is provided
  useEffect(() => {
    if (autoInitialize && userId && !isInitializing && !restorationResult) {
      initializeSession(userId);
    }
  }, [
    userId,
    autoInitialize,
    isInitializing,
    restorationResult,
    initializeSession,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    isInitializing,
    restorationResult,
    error,
    isSessionRestored,

    // Actions
    initializeSession,
    backupSession,
    startHeartbeat,
    stopHeartbeat,
    detectAndRecover,

    // State getters
    getBackupState,
  };
}
