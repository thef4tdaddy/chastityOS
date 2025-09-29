import { useState, useCallback, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { 
  AdminSessionData, 
  AdminPermission,
  SaveDataFunction 
} from '../../types/keyholder';

interface UseAdminSessionProps {
  userId: string | null;
  isAuthReady: boolean;
  saveDataToFirestore: SaveDataFunction;
  defaultPermissions?: AdminPermission[];
  sessionTimeoutMinutes?: number;
}

interface UseAdminSessionReturn {
  adminSession: AdminSessionData;
  isAdminActive: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  startAdminSession: (permissions?: AdminPermission[]) => Promise<void>;
  endAdminSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isSessionExpired: () => boolean;
  addPermission: (permission: AdminPermission) => Promise<void>;
  removePermission: (permission: AdminPermission) => Promise<void>;
  setSessionTimeout: (minutes: number) => Promise<void>;
}

const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] = [
  'view_sessions',
  'modify_durations'
];

export function useAdminSession({
  userId,
  isAuthReady,
  saveDataToFirestore,
  defaultPermissions = DEFAULT_ADMIN_PERMISSIONS,
  sessionTimeoutMinutes = 60
}: UseAdminSessionProps): UseAdminSessionReturn {

  const [adminSession, setAdminSession] = useState<AdminSessionData>({
    isAdminModeActive: false,
    adminPermissions: [],
    sessionTimeout: sessionTimeoutMinutes
  });

  const isSessionExpired = useCallback((): boolean => {
    if (!adminSession.isAdminModeActive || !adminSession.adminSessionStartTime) {
      return false;
    }
    
    const now = Date.now();
    const sessionStart = adminSession.adminSessionStartTime.toMillis();
    const timeoutMs = (adminSession.sessionTimeout || sessionTimeoutMinutes) * 60 * 1000;
    
    return (now - sessionStart) > timeoutMs;
  }, [adminSession, sessionTimeoutMinutes]);

  const endAdminSession = useCallback(async (): Promise<void> => {
    const endedSessionData: AdminSessionData = {
      isAdminModeActive: false,
      adminPermissions: [],
      sessionTimeout: sessionTimeoutMinutes
    };

    if (isAuthReady && userId) {
      await saveDataToFirestore({
        adminSession: endedSessionData
      });
    }

    setAdminSession(endedSessionData);
  }, [userId, isAuthReady, saveDataToFirestore, sessionTimeoutMinutes]);

  // Check for expired sessions on mount and when userId changes
  useEffect(() => {
    if (adminSession.isAdminModeActive && isSessionExpired()) {
      void endAdminSession();
    }
  }, [adminSession.isAdminModeActive, isSessionExpired, endAdminSession]);

  const hasPermission = useCallback((permission: AdminPermission): boolean => {
    if (!adminSession.isAdminModeActive) return false;
    if (isSessionExpired()) return false;
    
    return adminSession.adminPermissions.includes(permission);
  }, [adminSession, isSessionExpired]);

  const startAdminSession = useCallback(async (permissions: AdminPermission[] = defaultPermissions): Promise<void> => {
    if (!isAuthReady || !userId) {
      throw new Error('User not authenticated');
    }

    const newSessionData: AdminSessionData = {
      isAdminModeActive: true,
      adminSessionStartTime: Timestamp.now(),
      adminPermissions: [...permissions],
      sessionTimeout: sessionTimeoutMinutes
    };

    await saveDataToFirestore({
      adminSession: newSessionData
    });

    setAdminSession(newSessionData);
  }, [userId, isAuthReady, saveDataToFirestore, defaultPermissions, sessionTimeoutMinutes]);

  const refreshSession = useCallback(async (): Promise<void> => {
    if (!adminSession.isAdminModeActive || !isAuthReady || !userId) return;

    const refreshedSessionData: AdminSessionData = {
      ...adminSession,
      adminSessionStartTime: Timestamp.now()
    };

    await saveDataToFirestore({
      adminSession: refreshedSessionData
    });

    setAdminSession(refreshedSessionData);
  }, [adminSession, userId, isAuthReady, saveDataToFirestore]);

  const addPermission = useCallback(async (permission: AdminPermission): Promise<void> => {
    if (!adminSession.isAdminModeActive || !isAuthReady || !userId) return;
    if (adminSession.adminPermissions.includes(permission)) return;

    const updatedPermissions = [...adminSession.adminPermissions, permission];
    const updatedSessionData: AdminSessionData = {
      ...adminSession,
      adminPermissions: updatedPermissions
    };

    await saveDataToFirestore({
      adminSession: updatedSessionData
    });

    setAdminSession(updatedSessionData);
  }, [adminSession, userId, isAuthReady, saveDataToFirestore]);

  const removePermission = useCallback(async (permission: AdminPermission): Promise<void> => {
    if (!adminSession.isAdminModeActive || !isAuthReady || !userId) return;

    const updatedPermissions = adminSession.adminPermissions.filter(p => p !== permission);
    const updatedSessionData: AdminSessionData = {
      ...adminSession,
      adminPermissions: updatedPermissions
    };

    await saveDataToFirestore({
      adminSession: updatedSessionData
    });

    setAdminSession(updatedSessionData);
  }, [adminSession, userId, isAuthReady, saveDataToFirestore]);

  const setSessionTimeout = useCallback(async (minutes: number): Promise<void> => {
    if (!isAuthReady || !userId || minutes <= 0) return;

    const updatedSessionData: AdminSessionData = {
      ...adminSession,
      sessionTimeout: minutes
    };

    await saveDataToFirestore({
      adminSession: updatedSessionData
    });

    setAdminSession(updatedSessionData);
  }, [adminSession, userId, isAuthReady, saveDataToFirestore]);

  return {
    adminSession,
    isAdminActive: adminSession.isAdminModeActive && !isSessionExpired(),
    hasPermission,
    startAdminSession,
    endAdminSession,
    refreshSession,
    isSessionExpired,
    addPermission,
    removePermission,
    setSessionTimeout
  };
}