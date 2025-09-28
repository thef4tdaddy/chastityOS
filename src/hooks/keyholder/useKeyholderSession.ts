import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, query, where, onSnapshot, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// Types and Interfaces
export interface SessionState {
  id: string;
  userId: string;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  goals: SessionGoals;
  progress: SessionProgress;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  pauseEvents: PauseEvent[];
  controlledBy?: string; // keyholder ID if controlled externally
}

export interface SessionGoals {
  durationMinutes?: number;
  tasksToComplete?: number;
  edgingCount?: number;
  customGoals?: CustomGoal[];
}

export interface CustomGoal {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}

export interface SessionProgress {
  elapsedMinutes: number;
  tasksCompleted: number;
  edgingCompleted: number;
  customProgress: Record<string, number>;
  completionPercentage: number;
}

export interface PauseEvent {
  id: string;
  startTime: Date;
  endTime?: Date;
  reason: string;
  approvedBy?: string;
  duration?: number;
}

export interface SessionSummary {
  id: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  pauseDuration: number;
  effectiveDuration: number;
  goalsAchieved: number;
  totalGoals: number;
  completionRate: number;
}

export interface LiveSessionStats {
  currentDuration: number;
  pausedDuration: number;
  effectiveDuration: number;
  goalProgress: Record<string, number>;
  lastActivity: Date;
  estimatedCompletion?: Date;
}

export interface SessionControlOptions {
  canStart: boolean;
  canStop: boolean;
  canPause: boolean;
  canResume: boolean;
  canModifyGoals: boolean;
  canOverrideCooldowns: boolean;
  canEmergencyUnlock: boolean;
}

export const useKeyholderSession = (relationshipId: string, keyholderId?: string) => {
  // State
  const [activeSession, setActiveSession] = useState<SessionState | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([]);
  const [liveStats, setLiveStats] = useState<LiveSessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute control options based on permissions and session state
  const controlOptions: SessionControlOptions = useMemo(() => {
    // These would be based on keyholder permissions and relationship settings
    return {
      canStart: !activeSession?.isActive,
      canStop: activeSession?.isActive ?? false,
      canPause: activeSession?.isActive && activeSession.status !== 'paused',
      canResume: activeSession?.status === 'paused',
      canModifyGoals: activeSession?.isActive ?? false,
      canOverrideCooldowns: true, // Keyholders typically have override powers
      canEmergencyUnlock: true, // Emergency powers
    };
  }, [activeSession]);

  // Load active session
  useEffect(() => {
    if (!relationshipId) {
      setIsLoading(false);
      return;
    }

    const sessionQuery = query(
      collection(db, 'chastitySession'),
      where('userId', '==', relationshipId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(sessionQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate(),
        pauseEvents: doc.data().pauseEvents?.map((event: any) => ({
          ...event,
          startTime: event.startTime?.toDate(),
          endTime: event.endTime?.toDate(),
        })) || [],
      })) as SessionState[];

      const currentSession = sessions[0] || null;
      setActiveSession(currentSession);
      setIsLoading(false);

      // Update live stats if session is active
      if (currentSession && currentSession.isActive) {
        updateLiveStats(currentSession);
      } else {
        setLiveStats(null);
      }
    }, (err) => {
      console.error('Error loading session:', err);
      setError('Failed to load session');
      setIsLoading(false);
    });

    return unsubscribe;
  }, [relationshipId]);

  // Load session history
  useEffect(() => {
    if (!relationshipId) return;

    const historyQuery = query(
      collection(db, 'chastitySessionHistory'),
      where('userId', '==', relationshipId)
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate(),
      })) as SessionSummary[];

      setSessionHistory(history);
    });

    return unsubscribe;
  }, [relationshipId]);

  // Update live stats
  const updateLiveStats = useCallback((session: SessionState) => {
    const now = new Date();
    const startTime = session.startTime;
    const currentDuration = now.getTime() - startTime.getTime();
    
    const pausedDuration = session.pauseEvents.reduce((total, event) => {
      const end = event.endTime || now;
      return total + (end.getTime() - event.startTime.getTime());
    }, 0);

    const effectiveDuration = currentDuration - pausedDuration;

    const goalProgress: Record<string, number> = {};
    if (session.goals.durationMinutes) {
      goalProgress.duration = Math.min(100, (effectiveDuration / (session.goals.durationMinutes * 60000)) * 100);
    }
    if (session.goals.tasksToComplete) {
      goalProgress.tasks = Math.min(100, (session.progress.tasksCompleted / session.goals.tasksToComplete) * 100);
    }

    setLiveStats({
      currentDuration: Math.floor(currentDuration / 1000), // seconds
      pausedDuration: Math.floor(pausedDuration / 1000),
      effectiveDuration: Math.floor(effectiveDuration / 1000),
      goalProgress,
      lastActivity: now,
      estimatedCompletion: session.goals.durationMinutes ? 
        new Date(startTime.getTime() + session.goals.durationMinutes * 60000 + pausedDuration) : undefined,
    });
  }, []);

  // Actions
  const startSession = useCallback(async (goals?: SessionGoals): Promise<SessionState> => {
    try {
      const now = new Date();
      const defaultGoals: SessionGoals = {
        durationMinutes: 60, // Default 1 hour
        tasksToComplete: 0,
        edgingCount: 0,
        customGoals: [],
        ...goals,
      };

      const sessionDoc = await addDoc(collection(db, 'chastitySession'), {
        userId: relationshipId,
        isActive: true,
        startTime: now,
        goals: defaultGoals,
        progress: {
          elapsedMinutes: 0,
          tasksCompleted: 0,
          edgingCompleted: 0,
          customProgress: {},
          completionPercentage: 0,
        },
        status: 'active',
        pauseEvents: [],
        controlledBy: keyholderId,
        createdAt: serverTimestamp(),
      });

      const newSession: SessionState = {
        id: sessionDoc.id,
        userId: relationshipId,
        isActive: true,
        startTime: now,
        goals: defaultGoals,
        progress: {
          elapsedMinutes: 0,
          tasksCompleted: 0,
          edgingCompleted: 0,
          customProgress: {},
          completionPercentage: 0,
        },
        status: 'active',
        pauseEvents: [],
        controlledBy: keyholderId,
      };

      // Log the action
      await logControlAction('session_started', { goals: defaultGoals });

      return newSession;
    } catch (err) {
      console.error('Error starting session:', err);
      throw new Error('Failed to start session');
    }
  }, [relationshipId, keyholderId]);

  const stopSession = useCallback(async (reason?: string): Promise<void> => {
    if (!activeSession) return;

    try {
      const now = new Date();
      
      await updateDoc(doc(db, 'chastitySession', activeSession.id), {
        isActive: false,
        endTime: now,
        status: 'completed',
        stoppedBy: keyholderId,
        stopReason: reason || 'Stopped by keyholder',
        updatedAt: serverTimestamp(),
      });

      // Move to history
      await addDoc(collection(db, 'chastitySessionHistory'), {
        ...activeSession,
        endTime: now,
        stoppedBy: keyholderId,
        stopReason: reason,
        finalStats: liveStats,
      });

      // Log the action
      await logControlAction('session_stopped', { reason });

    } catch (err) {
      console.error('Error stopping session:', err);
      throw new Error('Failed to stop session');
    }
  }, [activeSession, keyholderId, liveStats]);

  const pauseSession = useCallback(async (reason: string): Promise<void> => {
    if (!activeSession) return;

    try {
      const now = new Date();
      const pauseEvent: PauseEvent = {
        id: `pause_${Date.now()}`,
        startTime: now,
        reason,
        approvedBy: keyholderId,
      };

      const updatedPauseEvents = [...activeSession.pauseEvents, pauseEvent];

      await updateDoc(doc(db, 'chastitySession', activeSession.id), {
        status: 'paused',
        pauseEvents: updatedPauseEvents,
        lastPauseBy: keyholderId,
        updatedAt: serverTimestamp(),
      });

      // Log the action
      await logControlAction('session_paused', { reason });

    } catch (err) {
      console.error('Error pausing session:', err);
      throw new Error('Failed to pause session');
    }
  }, [activeSession, keyholderId]);

  const resumeSession = useCallback(async (): Promise<void> => {
    if (!activeSession || activeSession.status !== 'paused') return;

    try {
      const now = new Date();
      const updatedPauseEvents = activeSession.pauseEvents.map(event => {
        if (!event.endTime && event.startTime) {
          return {
            ...event,
            endTime: now,
            duration: now.getTime() - event.startTime.getTime(),
          };
        }
        return event;
      });

      await updateDoc(doc(db, 'chastitySession', activeSession.id), {
        status: 'active',
        pauseEvents: updatedPauseEvents,
        resumedBy: keyholderId,
        updatedAt: serverTimestamp(),
      });

      // Log the action
      await logControlAction('session_resumed', {});

    } catch (err) {
      console.error('Error resuming session:', err);
      throw new Error('Failed to resume session');
    }
  }, [activeSession, keyholderId]);

  const modifyGoals = useCallback(async (goals: Partial<SessionGoals>): Promise<void> => {
    if (!activeSession) return;

    try {
      const updatedGoals = { ...activeSession.goals, ...goals };

      await updateDoc(doc(db, 'chastitySession', activeSession.id), {
        goals: updatedGoals,
        goalsModifiedBy: keyholderId,
        updatedAt: serverTimestamp(),
      });

      // Log the action
      await logControlAction('goals_modified', { oldGoals: activeSession.goals, newGoals: updatedGoals });

    } catch (err) {
      console.error('Error modifying goals:', err);
      throw new Error('Failed to modify goals');
    }
  }, [activeSession, keyholderId]);

  const addTimeRequirement = useCallback(async (minutes: number, reason: string): Promise<void> => {
    if (!activeSession?.goals.durationMinutes) return;

    const newDuration = activeSession.goals.durationMinutes + minutes;
    await modifyGoals({ durationMinutes: Math.max(0, newDuration) });
    
    // Log with specific reason
    await logControlAction('time_requirement_added', { addedMinutes: minutes, reason });
  }, [activeSession, modifyGoals]);

  const overridePauseCooldown = useCallback(async (reason: string): Promise<void> => {
    try {
      // Override pause cooldown restrictions
      await updateDoc(doc(db, 'users', relationshipId), {
        pauseCooldownOverride: true,
        pauseCooldownOverrideBy: keyholderId,
        pauseCooldownOverrideReason: reason,
        pauseCooldownOverrideAt: serverTimestamp(),
      });

      // Log the action
      await logControlAction('pause_cooldown_overridden', { reason });

    } catch (err) {
      console.error('Error overriding pause cooldown:', err);
      throw new Error('Failed to override pause cooldown');
    }
  }, [relationshipId, keyholderId]);

  const emergencyUnlock = useCallback(async (reason: string): Promise<void> => {
    try {
      // Emergency unlock - stop session and remove restrictions
      if (activeSession) {
        await stopSession('Emergency unlock by keyholder');
      }

      await updateDoc(doc(db, 'users', relationshipId), {
        emergencyUnlocked: true,
        emergencyUnlockedBy: keyholderId,
        emergencyUnlockReason: reason,
        emergencyUnlockAt: serverTimestamp(),
        isCageOn: false,
      });

      // Log the action
      await logControlAction('emergency_unlock', { reason });

    } catch (err) {
      console.error('Error performing emergency unlock:', err);
      throw new Error('Failed to perform emergency unlock');
    }
  }, [activeSession, relationshipId, keyholderId]);

  const getSessionHistory = useCallback((days = 30): SessionSummary[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sessionHistory.filter(session => 
      session.startTime >= cutoffDate
    );
  }, [sessionHistory]);

  const logControlAction = useCallback(async (action: string, details: any): Promise<void> => {
    try {
      await addDoc(collection(db, 'keyholderControlLogs'), {
        keyholderId,
        relationshipId,
        action,
        details,
        timestamp: serverTimestamp(),
        sessionId: activeSession?.id,
      });
    } catch (err) {
      console.error('Error logging control action:', err);
    }
  }, [keyholderId, relationshipId, activeSession]);

  // Computed values
  const sessionDuration = useMemo(() => {
    if (!activeSession) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000);
  }, [activeSession]);

  const goalProgress = useMemo(() => {
    if (!activeSession || !liveStats) return {};
    return liveStats.goalProgress;
  }, [activeSession, liveStats]);

  const canControl = controlOptions.canStart || controlOptions.canStop;
  const hasActiveControl = activeSession && (controlOptions.canPause || controlOptions.canStop);

  return {
    // Session state
    session: activeSession,
    isActive: activeSession?.isActive ?? false,
    controlOptions,
    liveStats,
    sessionHistory,
    isLoading,
    error,

    // Control actions
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    modifyGoals,
    addTimeRequirement,

    // Override capabilities
    overridePauseCooldown,
    emergencyUnlock,

    // Monitoring
    getSessionHistory,

    // Computed
    sessionDuration,
    goalProgress,
    canControl,
    hasActiveControl,

    // Quick access to common stats
    isSessionActive: activeSession?.isActive ?? false,
    sessionStatus: activeSession?.status || 'inactive',
    effectiveDuration: liveStats?.effectiveDuration || 0,
    estimatedCompletion: liveStats?.estimatedCompletion,
  };
};