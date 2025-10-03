/**
 * Session Loader Hook
 * Provides session loading and restoration functionality for SessionLoader component
 * Extracts business logic from component to maintain clean architecture
 */
import { useState, useCallback, useEffect } from "react";
import { useSessionPersistence } from "../useSessionPersistence";
import type { DBSession } from "../../types/database";
import { serviceLogger } from "../../utils/logging";
import { SessionPersistenceService } from "../../services/SessionPersistenceService";

const logger = serviceLogger("useSessionLoader");

/**
 * Helper function to handle session loading logic
 */
async function handleLoadSession(
  userId: string,
  initializeSession: (
    userId: string,
  ) => Promise<{ session: DBSession | null; wasRestored: boolean }>,
  setError: (error: Error | null) => void,
  setProgress: (progress: number) => void,
  setSession: (session: DBSession | null) => void,
): Promise<void> {
  if (!userId) {
    const err = new Error("User ID is required");
    setError(err);
    logger.error("Load session failed: no user ID", { error: err });
    return;
  }

  try {
    setError(null);
    setProgress(25);

    logger.debug("Loading session", { userId });

    const result = await initializeSession(userId);
    setProgress(75);

    if (result.session) {
      setSession(result.session);
      logger.info("Session loaded successfully", {
        sessionId: result.session.id,
        wasRestored: result.wasRestored,
      });
    }

    setProgress(100);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
    logger.error("Failed to load session", { error, userId });
  }
}

/**
 * Helper function to handle backup restoration
 */
async function handleRestoreFromBackup(
  getBackupState: () => { activeSessionId?: string } | null,
  restorationResult: { session: DBSession | null } | null,
  setIsRestoring: (isRestoring: boolean) => void,
  setError: (error: Error | null) => void,
  setSession: (session: DBSession | null) => void,
): Promise<DBSession | null> {
  try {
    setIsRestoring(true);
    setError(null);

    const backupState = getBackupState();
    if (!backupState?.activeSessionId) {
      throw new Error("No backup available to restore");
    }

    logger.debug("Restoring session from backup", {
      sessionId: backupState.activeSessionId,
    });

    const restoredSession = restorationResult?.session || null;

    if (restoredSession) {
      setSession(restoredSession);
      logger.info("Session restored from backup", {
        sessionId: restoredSession.id,
      });
    }

    return restoredSession;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
    logger.error("Failed to restore from backup", { error });
    throw error;
  } finally {
    setIsRestoring(false);
  }
}

/**
 * Helper function to clear backup data
 */
async function handleClearBackup(
  sessionPersistenceService: ReturnType<
    typeof import("../../services/SessionPersistenceService").SessionPersistenceService.getInstance
  >,
  setError: (error: Error | null) => void,
): Promise<void> {
  try {
    logger.debug("Clearing session backup");
    sessionPersistenceService.clearBackup();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
    logger.error("Failed to clear backup", { error });
    throw error;
  }
}

export interface UseSessionLoaderReturn {
  // State
  session: DBSession | null;
  isLoading: boolean;
  error: Error | null;
  hasBackup: boolean;

  // Actions
  loadSession: (userId: string) => Promise<void>;
  restoreFromBackup: () => Promise<DBSession | null>;
  clearBackup: () => Promise<void>;

  // Status
  isRestoring: boolean;
  canRestore: boolean;

  // Progress tracking
  progress: number;
}

export function useSessionLoader(): UseSessionLoaderReturn {
  const [session, setSession] = useState<DBSession | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    initializeSession,
    isInitializing,
    restorationResult,
    error: persistenceError,
    getBackupState,
  } = useSessionPersistence({ autoInitialize: false });

  // Check if there's a backup available
  const hasBackup = useCallback(() => {
    const backupState = getBackupState();
    return Boolean(backupState?.activeSessionId);
  }, [getBackupState]);

  // Determine if restore is possible
  const canRestore = hasBackup() && !isRestoring && !isInitializing;

  // Load session for a user
  const loadSession = useCallback(
    async (userId: string): Promise<void> => {
      await handleLoadSession(
        userId,
        initializeSession,
        setError,
        setProgress,
        setSession,
      );
    },
    [initializeSession],
  );

  // Restore session from backup
  const restoreFromBackup = useCallback(async (): Promise<DBSession | null> => {
    return handleRestoreFromBackup(
      getBackupState,
      restorationResult,
      setIsRestoring,
      setError,
      setSession,
    );
  }, [getBackupState, restorationResult]);

  // Clear backup data
  const clearBackup = useCallback(async (): Promise<void> => {
    const persistenceService = SessionPersistenceService.getInstance();
    await handleClearBackup(persistenceService, setError);
  }, []);

  // Sync persistence error to local error state
  useEffect(() => {
    if (persistenceError) {
      setError(new Error(persistenceError));
    }
  }, [persistenceError]);

  // Update session when restoration result changes
  useEffect(() => {
    if (restorationResult?.session) {
      setSession(restorationResult.session);
    }
  }, [restorationResult]);

  const isLoading = isInitializing || isRestoring;

  return {
    // State
    session,
    isLoading,
    error,
    hasBackup: hasBackup(),

    // Actions
    loadSession,
    restoreFromBackup,
    clearBackup,

    // Status
    isRestoring,
    canRestore,

    // Progress
    progress,
  };
}
