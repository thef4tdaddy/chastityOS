import { useState, useEffect, useCallback } from "react";
import { onSnapshot, query, where, QuerySnapshot } from "firebase/firestore";
import {
  MultiWearerSession,
  Wearer,
  KeyholderPermissions,
  SessionData,
} from "../../types";
import {
  getMultiWearerCollectionRef,
  getWearersCollectionRef,
  createMultiWearerSession,
  endMultiWearerSession,
  addWearerToSession,
  removeWearerFromSession,
  updateWearerInSession,
  parseWearerData,
  parseSessionData,
} from "./multiWearerHelpers";
import { logger } from "../../utils/logging";

interface UseMultiWearerProps {
  keyholderUserId: string;
  isAuthReady: boolean;
}

interface UseMultiWearerReturn {
  session: MultiWearerSession | null;
  wearers: Wearer[];
  isLoading: boolean;
  error: string | null;
  createSession: () => Promise<void>;
  endSession: () => Promise<void>;
  addWearer: (wearerData: Omit<Wearer, "id">) => Promise<void>;
  removeWearer: (wearerId: string) => Promise<void>;
  updateWearer: (wearerId: string, updates: Partial<Wearer>) => Promise<void>;
  updateWearerPermissions: (
    wearerId: string,
    permissions: Partial<KeyholderPermissions>,
  ) => Promise<void>;
  updateWearerSession: (
    wearerId: string,
    sessionData: Partial<SessionData>,
  ) => Promise<void>;
  activateWearer: (wearerId: string) => Promise<void>;
  deactivateWearer: (wearerId: string) => Promise<void>;
}

export function useMultiWearer({
  keyholderUserId,
  isAuthReady,
}: UseMultiWearerProps): UseMultiWearerReturn {
  const [session, setSession] = useState<MultiWearerSession | null>(null);
  const [wearers, setWearers] = useState<Wearer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time listener for multi-wearer session
  useEffect(() => {
    return setupMultiWearerListener({
      isAuthReady,
      keyholderUserId,
      setSession,
      setWearers,
      setError,
      setIsLoading,
    });
  }, [isAuthReady, keyholderUserId]);

  const { createSession, endSession } = useSessionManagement(
    keyholderUserId,
    session,
    setError,
  );

  const { addWearer, removeWearer, updateWearer } = useWearerManagement(
    keyholderUserId,
    session,
    setError,
  );

  const {
    updateWearerPermissions,
    updateWearerSession,
    activateWearer,
    deactivateWearer,
  } = useWearerOperations(wearers, updateWearer);

  return {
    session,
    wearers,
    isLoading,
    error,
    createSession,
    endSession,
    addWearer,
    removeWearer,
    updateWearer,
    updateWearerPermissions,
    updateWearerSession,
    activateWearer,
    deactivateWearer,
  };
}

// Hook to setup multi-wearer listener
function setupMultiWearerListener(params: {
  isAuthReady: boolean;
  keyholderUserId: string;
  setSession: (
    value:
      | MultiWearerSession
      | null
      | ((prev: MultiWearerSession | null) => MultiWearerSession | null),
  ) => void;
  setWearers: (value: Wearer[]) => void;
  setError: (value: string | null) => void;
  setIsLoading: (value: boolean) => void;
}) {
  const {
    isAuthReady,
    keyholderUserId,
    setSession,
    setWearers,
    setError,
    setIsLoading,
  } = params;

  if (!isAuthReady || !keyholderUserId) {
    setIsLoading(false);
    setSession(null);
    setWearers([]);
    return () => {};
  }

  const multiWearerCollectionRef = getMultiWearerCollectionRef();
  const q = query(
    multiWearerCollectionRef,
    where("keyholderUserId", "==", keyholderUserId),
    where("isActive", "==", true),
  );

  setIsLoading(true);

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot: QuerySnapshot) =>
      handleSessionSnapshot(
        querySnapshot,
        setSession,
        setWearers,
        setError,
        setIsLoading,
      ),
    (err) => handleSnapshotError(err, setError, setIsLoading),
  );

  return () => unsubscribe();
}

// Helper to handle session snapshot
function handleSessionSnapshot(
  querySnapshot: QuerySnapshot,
  setSession: (
    value:
      | MultiWearerSession
      | null
      | ((prev: MultiWearerSession | null) => MultiWearerSession | null),
  ) => void,
  setWearers: (value: Wearer[]) => void,
  setError: (value: string | null) => void,
  setIsLoading: (value: boolean) => void,
) {
  try {
    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      const sessionData = parseSessionData(docSnapshot);
      setSession({ ...sessionData, wearers: [] });

      // Set up listener for wearers
      const wearersCollectionRef = getWearersCollectionRef(docSnapshot.id);
      const wearersUnsubscribe = onSnapshot(
        wearersCollectionRef,
        (wearersSnapshot) => {
          const wearersData: Wearer[] =
            wearersSnapshot.docs.map(parseWearerData);
          setWearers(wearersData);
          setSession((prev) =>
            prev ? { ...prev, wearers: wearersData } : null,
          );
        },
      );

      return () => wearersUnsubscribe();
    } else {
      setSession(null);
      setWearers([]);
    }
    setError(null);
  } catch (err) {
    logger.error("Error processing multi-wearer session data", err);
    setError(
      err instanceof Error ? err.message : "Failed to process session data",
    );
  } finally {
    setIsLoading(false);
  }
}

// Helper to handle snapshot errors
function handleSnapshotError(
  err: Error,
  setError: (value: string | null) => void,
  setIsLoading: (value: boolean) => void,
) {
  logger.error("Error listening to multi-wearer session", err);
  setError(
    err instanceof Error ? err.message : "Failed to listen to session changes",
  );
  setIsLoading(false);
}

// Hook for session management
function useSessionManagement(
  keyholderUserId: string,
  session: MultiWearerSession | null,
  setError: (value: string | null) => void,
) {
  const createSession = useCallback(async () => {
    try {
      setError(null);
      if (!keyholderUserId) {
        throw new Error("Keyholder user ID is required");
      }
      await createMultiWearerSession(keyholderUserId);
    } catch (err) {
      logger.error("Error creating multi-wearer session", err);
      setError(err instanceof Error ? err.message : "Failed to create session");
      throw err;
    }
  }, [keyholderUserId, setError]);

  const endSession = useCallback(async () => {
    try {
      setError(null);
      if (!session) return;
      await endMultiWearerSession(keyholderUserId);
    } catch (err) {
      logger.error("Error ending multi-wearer session", err);
      setError(err instanceof Error ? err.message : "Failed to end session");
      throw err;
    }
  }, [session, keyholderUserId, setError]);

  return { createSession, endSession };
}

// Hook for wearer management
function useWearerManagement(
  keyholderUserId: string,
  session: MultiWearerSession | null,
  setError: (value: string | null) => void,
) {
  const addWearer = useCallback(
    async (wearerData: Omit<Wearer, "id">) => {
      try {
        setError(null);
        if (!session) {
          throw new Error("No active session to add wearer to");
        }
        await addWearerToSession(keyholderUserId, wearerData);
      } catch (err) {
        logger.error("Error adding wearer", err);
        setError(err instanceof Error ? err.message : "Failed to add wearer");
        throw err;
      }
    },
    [session, keyholderUserId, setError],
  );

  const removeWearer = useCallback(
    async (wearerId: string) => {
      try {
        setError(null);
        if (!session) return;
        await removeWearerFromSession(keyholderUserId, wearerId);
      } catch (err) {
        logger.error("Error removing wearer", err);
        setError(
          err instanceof Error ? err.message : "Failed to remove wearer",
        );
        throw err;
      }
    },
    [session, keyholderUserId, setError],
  );

  const updateWearer = useCallback(
    async (wearerId: string, updates: Partial<Wearer>) => {
      try {
        setError(null);
        if (!session) return;
        await updateWearerInSession(keyholderUserId, wearerId, updates);
      } catch (err) {
        logger.error("Error updating wearer", err);
        setError(
          err instanceof Error ? err.message : "Failed to update wearer",
        );
        throw err;
      }
    },
    [session, keyholderUserId, setError],
  );

  return { addWearer, removeWearer, updateWearer };
}

// Hook for wearer operations
function useWearerOperations(
  wearers: Wearer[],
  updateWearer: (wearerId: string, updates: Partial<Wearer>) => Promise<void>,
) {
  const updateWearerPermissions = useCallback(
    async (wearerId: string, permissions: Partial<KeyholderPermissions>) => {
      const wearer = wearers.find((w) => w.id === wearerId);
      if (!wearer) return;

      const updatedPermissions = {
        ...wearer.keyholderPermissions,
        ...permissions,
      };
      await updateWearer(wearerId, {
        keyholderPermissions: updatedPermissions,
      });
    },
    [wearers, updateWearer],
  );

  const updateWearerSession = useCallback(
    async (wearerId: string, sessionData: Partial<SessionData>) => {
      const wearer = wearers.find((w) => w.id === wearerId);
      if (!wearer) return;

      const updatedSessionData = { ...wearer.sessionData, ...sessionData };
      await updateWearer(wearerId, { sessionData: updatedSessionData });
    },
    [wearers, updateWearer],
  );

  const activateWearer = useCallback(
    async (wearerId: string) => {
      await updateWearer(wearerId, { isActive: true });
    },
    [updateWearer],
  );

  const deactivateWearer = useCallback(
    async (wearerId: string) => {
      await updateWearer(wearerId, { isActive: false });
    },
    [updateWearer],
  );

  return {
    updateWearerPermissions,
    updateWearerSession,
    activateWearer,
    deactivateWearer,
  };
}
