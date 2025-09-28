import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, addDoc, updateDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

// Types and Interfaces
export interface AdminSession {
  id: string;
  keyholderId: string;
  relationshipId: string;
  startTime: Date;
  expiresAt: Date;
  permissions: AdminPermission[];
  isActive: boolean;
  lastActivity: Date;
}

export interface AdminAction {
  id: string;
  sessionId: string;
  action: string;
  details: any;
  timestamp: Date;
  result: 'success' | 'failed';
}

export type AdminPermission = 
  | 'session_control'
  | 'time_modification' 
  | 'task_management'
  | 'reward_punishment'
  | 'emergency_unlock'
  | 'relationship_management';

export interface AdminSessionActions {
  startSession: (relationshipId: string, duration?: number) => Promise<AdminSession>;
  endSession: () => Promise<void>;
  extendSession: (additionalMinutes: number) => Promise<void>;
  validatePermission: (permission: AdminPermission) => boolean;
  logAction: (action: AdminAction) => Promise<void>;
  updateActivity: () => Promise<void>;
}

export const useAdminSession = (relationshipId: string, keyholderId?: string) => {
  // State
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Load active admin session
  useEffect(() => {
    if (!relationshipId || !keyholderId) {
      setIsLoading(false);
      return;
    }

    const sessionQuery = query(
      collection(db, 'adminSessions'),
      where('keyholderId', '==', keyholderId),
      where('relationshipId', '==', relationshipId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(sessionQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        lastActivity: doc.data().lastActivity?.toDate(),
      })) as AdminSession[];

      // Should only be one active session per relationship
      const activeSession = sessions[0] || null;
      setSession(activeSession);
      setIsLoading(false);

      // Check if session has expired
      if (activeSession && activeSession.expiresAt < new Date()) {
        endSession();
      }
    }, (err) => {
      console.error('Error loading admin session:', err);
      setError('Failed to load admin session');
      setIsLoading(false);
    });

    return unsubscribe;
  }, [relationshipId, keyholderId]);

  // Update time remaining every second
  useEffect(() => {
    if (!session || !session.isActive) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, session.expiresAt.getTime() - now.getTime());
      setTimeRemaining(Math.floor(remaining / 1000)); // Convert to seconds

      // Auto-expire if time is up
      if (remaining <= 0 && session.isActive) {
        endSession();
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Auto-update activity every 5 minutes
  useEffect(() => {
    if (!session?.isActive) return;

    const activityInterval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(activityInterval);
  }, [session?.isActive]);

  // Actions
  const startSession = useCallback(async (
    targetRelationshipId: string, 
    duration = 30
  ): Promise<AdminSession> => {
    try {
      // End any existing session first
      if (session?.isActive) {
        await endSession();
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + duration * 60000); // duration in minutes

      const sessionDoc = await addDoc(collection(db, 'adminSessions'), {
        keyholderId,
        relationshipId: targetRelationshipId,
        startTime: now,
        expiresAt,
        permissions: [
          'session_control',
          'time_modification',
          'task_management',
          'reward_punishment'
        ] as AdminPermission[],
        isActive: true,
        lastActivity: now,
        createdAt: serverTimestamp(),
      });

      const newSession: AdminSession = {
        id: sessionDoc.id,
        keyholderId: keyholderId!,
        relationshipId: targetRelationshipId,
        startTime: now,
        expiresAt,
        permissions: [
          'session_control',
          'time_modification',
          'task_management',
          'reward_punishment'
        ],
        isActive: true,
        lastActivity: now,
      };

      // Log session start
      await logAction({
        id: '',
        sessionId: sessionDoc.id,
        action: 'session_started',
        details: { duration, relationshipId: targetRelationshipId },
        timestamp: now,
        result: 'success',
      });

      return newSession;
    } catch (err) {
      console.error('Error starting admin session:', err);
      throw new Error('Failed to start admin session');
    }
  }, [keyholderId, session]);

  const endSession = useCallback(async (): Promise<void> => {
    if (!session) return;

    try {
      await updateDoc(doc(db, 'adminSessions', session.id), {
        isActive: false,
        endedAt: serverTimestamp(),
      });

      // Log session end
      await logAction({
        id: '',
        sessionId: session.id,
        action: 'session_ended',
        details: { duration: Date.now() - session.startTime.getTime() },
        timestamp: new Date(),
        result: 'success',
      });

      setSession(null);
    } catch (err) {
      console.error('Error ending admin session:', err);
      setError('Failed to end admin session');
    }
  }, [session]);

  const extendSession = useCallback(async (additionalMinutes: number): Promise<void> => {
    if (!session) return;

    try {
      const newExpiresAt = new Date(session.expiresAt.getTime() + additionalMinutes * 60000);
      
      await updateDoc(doc(db, 'adminSessions', session.id), {
        expiresAt: newExpiresAt,
        lastActivity: serverTimestamp(),
      });

      // Log session extension
      await logAction({
        id: '',
        sessionId: session.id,
        action: 'session_extended',
        details: { additionalMinutes, newExpiresAt },
        timestamp: new Date(),
        result: 'success',
      });
    } catch (err) {
      console.error('Error extending admin session:', err);
      throw new Error('Failed to extend admin session');
    }
  }, [session]);

  const validatePermission = useCallback((permission: AdminPermission): boolean => {
    if (!session?.isActive) return false;
    if (timeRemaining <= 0) return false;
    return session.permissions.includes(permission);
  }, [session, timeRemaining]);

  const logAction = useCallback(async (action: Omit<AdminAction, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(db, 'adminActionLogs'), {
        ...action,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error logging admin action:', err);
      // Don't throw here as logging failures shouldn't break the main action
    }
  }, []);

  const updateActivity = useCallback(async (): Promise<void> => {
    if (!session?.isActive) return;

    try {
      await updateDoc(doc(db, 'adminSessions', session.id), {
        lastActivity: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating session activity:', err);
    }
  }, [session]);

  // Computed values
  const isActive = session?.isActive ?? false;
  const permissions = session?.permissions ?? [];
  const canExtend = useMemo(() => {
    return timeRemaining > 0 && timeRemaining < 5 * 60; // Last 5 minutes
  }, [timeRemaining]);
  
  const needsReauth = useMemo(() => {
    return session && timeRemaining < 60; // Last minute warning
  }, [session, timeRemaining]);

  const hasPermission = useCallback((permission: AdminPermission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  // Format time remaining
  const formatTimeRemaining = useCallback((): string => {
    if (timeRemaining <= 0) return '00:00';
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    // State
    session,
    isActive,
    timeRemaining,
    permissions,
    isLoading,
    error,

    // Actions
    startSession,
    endSession,
    extendSession,
    validatePermission,
    logAction,
    updateActivity,

    // Computed
    canExtend,
    needsReauth,
    hasPermission,
    formatTimeRemaining,
    
    // Utility
    timeRemainingMinutes: Math.floor(timeRemaining / 60),
    isExpiringSoon: timeRemaining > 0 && timeRemaining < 5 * 60,
    isExpired: timeRemaining <= 0 && session?.isActive,
  };
};