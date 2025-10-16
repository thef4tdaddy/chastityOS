import { useState, useEffect, useCallback } from "react";
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentReference,
} from "firebase/firestore";
import { db } from "../../firebase";
import { KeyholderSession, KeyholderPermissions } from "../../types";

interface UseKeyholderSessionProps {
  userId: string;
  isAuthReady: boolean;
  keyholderName?: string;
}

interface UseKeyholderSessionReturn {
  keyholderSession: KeyholderSession | null;
  isActive: boolean;
  permissions: KeyholderPermissions | null;
  isLoading: boolean;
  error: string | null;
  startSession: (
    keyholderName: string,
    permissions: KeyholderPermissions,
  ) => Promise<void>;
  endSession: () => Promise<void>;
  updatePermissions: (
    permissions: Partial<KeyholderPermissions>,
  ) => Promise<void>;
  updateKeyholderName: (name: string) => Promise<void>;
}

const defaultPermissions: KeyholderPermissions = {
  canLockSessions: false,
  canUnlockSessions: false,
  canCreateTasks: false,
  canApproveTasks: false,
  canViewFullHistory: false,
  canEditGoals: false,
  canSetRules: false,
};

export function useKeyholderSession({
  userId,
  isAuthReady,
  keyholderName,
}: UseKeyholderSessionProps): UseKeyholderSessionReturn {
  const [keyholderSession, setKeyholderSession] =
    useState<KeyholderSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getKeyholderDocRef = useCallback(() => {
    if (!userId) return null;
    return doc(db, "users", userId, "keyholderSession", "current");
  }, [userId]);

  // Set up real-time listener for keyholder session
  useEffect(() => {
    return setupKeyholderListener({
      isAuthReady,
      userId,
      keyholderName,
      getKeyholderDocRef,
      setKeyholderSession,
      setError,
      setIsLoading,
    });
  }, [isAuthReady, userId, keyholderName, getKeyholderDocRef]);

  const { startSession, endSession, updatePermissions, updateKeyholderName } =
    useSessionActions({
      userId,
      keyholderSession,
      getKeyholderDocRef,
      setError,
    });

  return {
    keyholderSession,
    isActive: keyholderSession?.isActive || false,
    permissions: keyholderSession?.permissions || null,
    isLoading,
    error,
    startSession,
    endSession,
    updatePermissions,
    updateKeyholderName,
  };
}

// Hook to setup listener and handle cleanup
function setupKeyholderListener(params: {
  isAuthReady: boolean;
  userId: string;
  keyholderName?: string;
  getKeyholderDocRef: () => DocumentReference | null;
  setKeyholderSession: (value: KeyholderSession | null) => void;
  setError: (value: string | null) => void;
  setIsLoading: (value: boolean) => void;
}) {
  const {
    isAuthReady,
    userId,
    keyholderName,
    getKeyholderDocRef,
    setKeyholderSession,
    setError,
    setIsLoading,
  } = params;

  if (!isAuthReady || !userId) {
    setIsLoading(false);
    setKeyholderSession(null);
    return () => {};
  }

  const keyholderDocRef = getKeyholderDocRef();
  if (!keyholderDocRef) {
    setIsLoading(false);
    return () => {};
  }

  setIsLoading(true);

  const unsubscribe = setupSessionListener(
    keyholderDocRef,
    keyholderName,
    setKeyholderSession,
    setError,
    setIsLoading,
  );

  return () => unsubscribe();
}

// Hook to encapsulate session actions
function useSessionActions(params: {
  userId: string;
  keyholderSession: KeyholderSession | null;
  getKeyholderDocRef: () => DocumentReference | null;
  setError: (value: string | null) => void;
}) {
  const { userId, keyholderSession, getKeyholderDocRef, setError } = params;

  const startSession = useCallback(
    async (sessionKeyholderName: string, permissions: KeyholderPermissions) => {
      await handleStartSession(
        sessionKeyholderName,
        permissions,
        userId,
        getKeyholderDocRef,
        setError,
      );
    },
    [userId, getKeyholderDocRef, setError],
  );

  const endSession = useCallback(async () => {
    await handleEndSession(getKeyholderDocRef, setError);
  }, [getKeyholderDocRef, setError]);

  const updatePermissions = useCallback(
    async (newPermissions: Partial<KeyholderPermissions>) => {
      await handleUpdatePermissions(
        keyholderSession,
        newPermissions,
        getKeyholderDocRef,
        setError,
      );
    },
    [keyholderSession, getKeyholderDocRef, setError],
  );

  const updateKeyholderName = useCallback(
    async (name: string) => {
      await handleUpdateKeyholderName(
        name,
        userId,
        getKeyholderDocRef,
        setError,
      );
    },
    [userId, getKeyholderDocRef, setError],
  );

  return { startSession, endSession, updatePermissions, updateKeyholderName };
}

// Helper functions for useKeyholderSession
function setupSessionListener(
  keyholderDocRef: DocumentReference,
  keyholderName: string | undefined,
  setKeyholderSession: (value: KeyholderSession | null) => void,
  setError: (value: string | null) => void,
  setIsLoading: (value: boolean) => void,
) {
  return onSnapshot(
    keyholderDocRef,
    (docSnapshot) => {
      try {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const session: KeyholderSession = {
            keyholderName: data.keyholderName || keyholderName,
            isActive: data.isActive || false,
            startTime: data.startTime?.toDate(),
            endTime: data.endTime?.toDate(),
            permissions: { ...defaultPermissions, ...data.permissions },
          };
          setKeyholderSession(session);
        } else {
          setKeyholderSession(null);
        }
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to process session data",
        );
      } finally {
        setIsLoading(false);
      }
    },
    (err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to listen to session changes",
      );
      setIsLoading(false);
    },
  );
}

async function handleStartSession(
  sessionKeyholderName: string,
  permissions: KeyholderPermissions,
  userId: string,
  getKeyholderDocRef: () => DocumentReference | null,
  setError: (value: string | null) => void,
): Promise<void> {
  try {
    setError(null);
    const keyholderDocRef = getKeyholderDocRef();
    if (!keyholderDocRef) {
      throw new Error("No keyholder document reference available");
    }

    if (!sessionKeyholderName.trim()) {
      throw new Error("Keyholder name is required");
    }

    const sessionData = {
      keyholderName: sessionKeyholderName.trim(),
      isActive: true,
      startTime: new Date(),
      endTime: null,
      permissions,
    };

    await setDoc(keyholderDocRef, sessionData);

    // Also update the main user document with keyholder name
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      keyholderName: sessionKeyholderName.trim(),
    });
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to start keyholder session",
    );
    throw err;
  }
}

async function handleEndSession(
  getKeyholderDocRef: () => DocumentReference | null,
  setError: (value: string | null) => void,
): Promise<void> {
  try {
    setError(null);
    const keyholderDocRef = getKeyholderDocRef();
    if (!keyholderDocRef) return;

    await updateDoc(keyholderDocRef, {
      isActive: false,
      endTime: new Date(),
    });
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to end keyholder session",
    );
    throw err;
  }
}

async function handleUpdatePermissions(
  keyholderSession: KeyholderSession | null,
  newPermissions: Partial<KeyholderPermissions>,
  getKeyholderDocRef: () => DocumentReference | null,
  setError: (value: string | null) => void,
): Promise<void> {
  try {
    setError(null);
    if (!keyholderSession || !keyholderSession.isActive) {
      throw new Error("No active keyholder session to update");
    }

    const keyholderDocRef = getKeyholderDocRef();
    if (!keyholderDocRef) return;

    const updatedPermissions = {
      ...keyholderSession.permissions,
      ...newPermissions,
    };

    await updateDoc(keyholderDocRef, {
      permissions: updatedPermissions,
    });
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to update permissions",
    );
    throw err;
  }
}

async function handleUpdateKeyholderName(
  name: string,
  userId: string,
  getKeyholderDocRef: () => DocumentReference | null,
  setError: (value: string | null) => void,
): Promise<void> {
  try {
    setError(null);
    if (!name.trim()) {
      throw new Error("Keyholder name cannot be empty");
    }

    const keyholderDocRef = getKeyholderDocRef();
    if (!keyholderDocRef) return;

    await updateDoc(keyholderDocRef, {
      keyholderName: name.trim(),
    });

    // Also update the main user document
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      keyholderName: name.trim(),
    });
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to update keyholder name",
    );
    throw err;
  }
}
