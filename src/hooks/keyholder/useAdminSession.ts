import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AdminSession, AdminPermissions } from '../../types';

interface UseAdminSessionProps {
  userId: string;
  isAuthReady: boolean;
}

interface UseAdminSessionReturn {
  adminSession: AdminSession | null;
  isAdmin: boolean;
  permissions: AdminPermissions | null;
  isLoading: boolean;
  error: string | null;
  startAdminSession: (permissions: AdminPermissions) => Promise<void>;
  endAdminSession: () => Promise<void>;
  updatePermissions: (permissions: Partial<AdminPermissions>) => Promise<void>;
  updateActivity: () => Promise<void>;
}

const defaultPermissions: AdminPermissions = {
  canManageUsers: false,
  canViewAllSessions: false,
  canModifySettings: false,
  canAccessLogs: false,
};

export function useAdminSession({ userId, isAuthReady }: UseAdminSessionProps): UseAdminSessionReturn {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAdminDocRef = useCallback(() => {
    if (!userId) return null;
    return doc(db, 'admins', userId);
  }, [userId]);

  // Load existing admin session
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      setAdminSession(null);
      return;
    }

    const loadAdminSession = async () => {
      await loadExistingAdminSession(
        getAdminDocRef,
        setAdminSession,
        setError,
        setIsLoading
      );
    };

    loadAdminSession();
  }, [isAuthReady, userId, getAdminDocRef]);

  const startAdminSession = useCallback(async (permissions: AdminPermissions) => {
    await handleStartAdminSession(
      userId,
      permissions,
      getAdminDocRef,
      setAdminSession,
      setError
    );
  }, [userId, getAdminDocRef]);

  const endAdminSession = useCallback(async () => {
    await handleEndAdminSession(getAdminDocRef, setAdminSession, setError);
  }, [getAdminDocRef]);

  const updatePermissions = useCallback(async (newPermissions: Partial<AdminPermissions>) => {
    await handleUpdatePermissions(
      adminSession,
      newPermissions,
      getAdminDocRef,
      setAdminSession,
      setError
    );
  }, [adminSession, getAdminDocRef]);

  const updateActivity = useCallback(async () => {
    await handleUpdateActivity(adminSession, getAdminDocRef, setAdminSession);
  }, [adminSession, getAdminDocRef]);

  return {
    adminSession,
    isAdmin: adminSession?.isAdmin || false,
    permissions: adminSession?.permissions || null,
    isLoading,
    error,
    startAdminSession,
    endAdminSession,
    updatePermissions,
    updateActivity,
  };
}

// Helper functions for useAdminSession
async function loadExistingAdminSession(
  getAdminDocRef: () => any,
  setAdminSession: React.Dispatch<React.SetStateAction<AdminSession | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> {
  try {
    setIsLoading(true);
    const adminDocRef = getAdminDocRef();
    if (!adminDocRef) return;

    const adminDoc = await getDoc(adminDocRef);
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      const session: AdminSession = {
        userId: data.userId,
        isAdmin: data.isAdmin || false,
        permissions: { ...defaultPermissions, ...data.permissions },
        sessionStart: data.sessionStart?.toDate() || new Date(),
        lastActivity: data.lastActivity?.toDate() || new Date(),
      };
      setAdminSession(session);
    } else {
      setAdminSession(null);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load admin session');
  } finally {
    setIsLoading(false);
  }
}

async function handleStartAdminSession(
  userId: string,
  permissions: AdminPermissions,
  getAdminDocRef: () => any,
  setAdminSession: React.Dispatch<React.SetStateAction<AdminSession | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> {
  try {
    setError(null);
    const adminDocRef = getAdminDocRef();
    if (!adminDocRef) {
      throw new Error('No admin document reference available');
    }

    const now = new Date();
    const newSession: AdminSession = {
      userId,
      isAdmin: true,
      permissions,
      sessionStart: now,
      lastActivity: now,
    };

    await setDoc(adminDocRef, {
      userId,
      isAdmin: true,
      permissions,
      sessionStart: now,
      lastActivity: now,
    });

    setAdminSession(newSession);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to start admin session');
  }
}

async function handleEndAdminSession(
  getAdminDocRef: () => any,
  setAdminSession: React.Dispatch<React.SetStateAction<AdminSession | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> {
  try {
    setError(null);
    const adminDocRef = getAdminDocRef();
    if (!adminDocRef) return;

    await updateDoc(adminDocRef, {
      isAdmin: false,
      lastActivity: new Date(),
    });

    setAdminSession(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to end admin session');
  }
}

async function handleUpdatePermissions(
  adminSession: AdminSession | null,
  newPermissions: Partial<AdminPermissions>,
  getAdminDocRef: () => any,
  setAdminSession: React.Dispatch<React.SetStateAction<AdminSession | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> {
  try {
    setError(null);
    if (!adminSession) return;

    const adminDocRef = getAdminDocRef();
    if (!adminDocRef) return;

    const updatedPermissions = { ...adminSession.permissions, ...newPermissions };
    
    await updateDoc(adminDocRef, {
      permissions: updatedPermissions,
      lastActivity: new Date(),
    });

    setAdminSession(prev => prev ? {
      ...prev,
      permissions: updatedPermissions,
      lastActivity: new Date(),
    } : null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to update permissions');
  }
}

async function handleUpdateActivity(
  adminSession: AdminSession | null,
  getAdminDocRef: () => any,
  setAdminSession: React.Dispatch<React.SetStateAction<AdminSession | null>>
): Promise<void> {
  try {
    if (!adminSession || !adminSession.isAdmin) return;

    const adminDocRef = getAdminDocRef();
    if (!adminDocRef) return;

    const now = new Date();
    await updateDoc(adminDocRef, {
      lastActivity: now,
    });

    setAdminSession(prev => prev ? { ...prev, lastActivity: now } : null);
  } catch (_err) {
    // Don't set error for activity updates as they're non-critical
  }
}