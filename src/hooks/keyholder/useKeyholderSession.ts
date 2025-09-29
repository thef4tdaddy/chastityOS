import { useState, useCallback, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { 
  KeyholderSession, 
  SaveDataFunction
} from '../../types/keyholder';

interface UseKeyholderSessionProps {
  userId: string | null;
  isAuthReady: boolean;
  saveDataToFirestore: SaveDataFunction;
  initialData?: Partial<KeyholderSession>;
}

interface UseKeyholderSessionReturn {
  session: KeyholderSession;
  isSessionLocked: boolean;
  lockSession: () => Promise<void>;
  unlockSession: () => Promise<void>;
  setRequiredDuration: (seconds: number) => Promise<void>;
  updateKeyholderName: (name: string) => Promise<void>;
  updatePasswordHash: (hash: string) => Promise<void>;
  refreshLastActivity: () => Promise<void>;
  isSessionExpired: (timeoutMinutes?: number) => boolean;
}

export function useKeyholderSession({
  userId,
  isAuthReady,
  saveDataToFirestore,
  initialData
}: UseKeyholderSessionProps): UseKeyholderSessionReturn {
  const [session, setSession] = useState<KeyholderSession>({
    isKeyholderControlsLocked: false,
    requiredKeyholderDurationSeconds: 0,
    keyholderName: undefined,
    keyholderPasswordHash: undefined,
    lastActivity: undefined,
    ...initialData
  });

  // Update session state when initial data changes
  useEffect(() => {
    if (initialData) {
      setSession(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const lockSession = useCallback(async (): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updates: Partial<KeyholderSession> = {
      isKeyholderControlsLocked: true,
      lastActivity: Timestamp.now()
    };

    await saveDataToFirestore(updates);
    setSession(prev => ({ ...prev, ...updates }));
  }, [userId, isAuthReady, saveDataToFirestore]);

  const unlockSession = useCallback(async (): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updates: Partial<KeyholderSession> = {
      isKeyholderControlsLocked: false,
      lastActivity: Timestamp.now()
    };

    await saveDataToFirestore(updates);
    setSession(prev => ({ ...prev, ...updates }));
  }, [userId, isAuthReady, saveDataToFirestore]);

  const setRequiredDuration = useCallback(async (seconds: number): Promise<void> => {
    if (!isAuthReady || !userId || seconds < 0) return;

    const updates: Partial<KeyholderSession> = {
      requiredKeyholderDurationSeconds: seconds,
      lastActivity: Timestamp.now()
    };

    await saveDataToFirestore(updates);
    setSession(prev => ({ ...prev, ...updates }));
  }, [userId, isAuthReady, saveDataToFirestore]);

  const updateKeyholderName = useCallback(async (name: string): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updates: Partial<KeyholderSession> = {
      keyholderName: name.trim() || undefined,
      lastActivity: Timestamp.now()
    };

    await saveDataToFirestore(updates);
    setSession(prev => ({ ...prev, ...updates }));
  }, [userId, isAuthReady, saveDataToFirestore]);

  const updatePasswordHash = useCallback(async (hash: string): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updates: Partial<KeyholderSession> = {
      keyholderPasswordHash: hash,
      lastActivity: Timestamp.now()
    };

    await saveDataToFirestore(updates);
    setSession(prev => ({ ...prev, ...updates }));
  }, [userId, isAuthReady, saveDataToFirestore]);

  const refreshLastActivity = useCallback(async (): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updates: Partial<KeyholderSession> = {
      lastActivity: Timestamp.now()
    };

    await saveDataToFirestore(updates);
    setSession(prev => ({ ...prev, ...updates }));
  }, [userId, isAuthReady, saveDataToFirestore]);

  const isSessionExpired = useCallback((timeoutMinutes: number = 30): boolean => {
    if (!session.lastActivity) return false;
    
    const now = Date.now();
    const lastActivityTime = session.lastActivity.toMillis();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    return (now - lastActivityTime) > timeoutMs;
  }, [session.lastActivity]);

  return {
    session,
    isSessionLocked: session.isKeyholderControlsLocked || false,
    lockSession,
    unlockSession,
    setRequiredDuration,
    updateKeyholderName,
    updatePasswordHash,
    refreshLastActivity,
    isSessionExpired
  };
}