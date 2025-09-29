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
        console.error('Error loading admin session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load admin session');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminSession();
  }, [isAuthReady, userId, getAdminDocRef]);

  const startAdminSession = useCallback(async (permissions: AdminPermissions) => {
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
      console.error('Error starting admin session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start admin session');
    }
  }, [userId, getAdminDocRef]);

  const endAdminSession = useCallback(async () => {
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
      console.error('Error ending admin session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end admin session');
    }
  }, [getAdminDocRef]);

  const updatePermissions = useCallback(async (newPermissions: Partial<AdminPermissions>) => {
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
      console.error('Error updating admin permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  }, [adminSession, getAdminDocRef]);

  const updateActivity = useCallback(async () => {
    try {
      if (!adminSession || !adminSession.isAdmin) return;

      const adminDocRef = getAdminDocRef();
      if (!adminDocRef) return;

      const now = new Date();
      await updateDoc(adminDocRef, {
        lastActivity: now,
      });

      setAdminSession(prev => prev ? { ...prev, lastActivity: now } : null);
    } catch (err) {
      console.error('Error updating admin activity:', err);
      // Don't set error for activity updates as they're non-critical
    }
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