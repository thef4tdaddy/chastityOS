import { useState, useCallback, useEffect } from 'react';

interface SessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  isActive: boolean;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

interface UseSessionProps {
  userId: string | null;
  isAuthReady: boolean;
  autoSave?: boolean;
}

export const useSession = ({ userId, isAuthReady, autoSave = true }: UseSessionProps) => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = useCallback(() => {
    if (!userId || !isAuthReady) {
      setError('User not authenticated');
      return;
    }

    if (currentSession?.isActive) {
      setError('Session already active');
      return;
    }

    const newSession: SessionData = {
      id: crypto.randomUUID(),
      startTime: new Date(),
      duration: 0,
      isActive: true,
      status: 'active'
    };

    setCurrentSession(newSession);
    setError(null);
  }, [userId, isAuthReady, currentSession?.isActive]);

  const handleEndSession = useCallback((reason?: string) => {
    if (!currentSession?.isActive) {
      setError('No active session to end');
      return;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);

    const completedSession: SessionData = {
      ...currentSession,
      endTime,
      duration,
      isActive: false,
      status: reason === 'cancelled' ? 'cancelled' : 'completed'
    };

    setCurrentSession(null);
    setSessionHistory(prev => [...prev, completedSession]);
    setError(null);
  }, [currentSession]);

  const handlePauseSession = useCallback(() => {
    if (!currentSession?.isActive) {
      setError('No active session to pause');
      return;
    }

    setCurrentSession(prev => 
      prev ? { ...prev, status: 'paused' } : null
    );
    setError(null);
  }, [currentSession?.isActive]);

  const handleResumeSession = useCallback(() => {
    if (!currentSession || currentSession.status !== 'paused') {
      setError('No paused session to resume');
      return;
    }

    setCurrentSession(prev => 
      prev ? { ...prev, status: 'active' } : null
    );
    setError(null);
  }, [currentSession]);

  const getCurrentSessionDuration = useCallback((): number => {
    if (!currentSession?.isActive) return 0;
    return Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000);
  }, [currentSession]);

  const getSessionStats = useCallback(() => {
    const totalSessions = sessionHistory.length + (currentSession ? 1 : 0);
    const completedSessions = sessionHistory.filter(s => s.status === 'completed');
    const totalDuration = completedSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageDuration = completedSessions.length > 0 ? totalDuration / completedSessions.length : 0;

    return {
      totalSessions,
      completedSessions: completedSessions.length,
      totalDuration,
      averageDuration,
      longestSession: completedSessions.length > 0 ? Math.max(...completedSessions.map(s => s.duration)) : 0
    };
  }, [sessionHistory, currentSession]);

  // Update current session duration every second
  useEffect(() => {
    if (!currentSession?.isActive || currentSession.status === 'paused') return;

    const interval = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return prev;
        const duration = Math.floor((new Date().getTime() - prev.startTime.getTime()) / 1000);
        return { ...prev, duration };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession?.isActive, currentSession?.status]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !userId) return;

    const saveData = async () => {
      // In a real implementation, this would save to Firestore
      try {
        const dataToSave = {
          currentSession,
          sessionHistory
        };
        // await saveToFirestore(userId, dataToSave);
        console.log('Session data auto-saved:', dataToSave);
      } catch (saveError) {
        console.error('Failed to auto-save session data:', saveError);
      }
    };

    const timeoutId = setTimeout(saveData, 5000); // Save every 5 seconds
    return () => clearTimeout(timeoutId);
  }, [autoSave, userId, currentSession, sessionHistory]);

  return {
    currentSession,
    sessionHistory,
    isLoading,
    error,
    handleStartSession,
    handleEndSession,
    handlePauseSession,
    handleResumeSession,
    getCurrentSessionDuration,
    getSessionStats
  };
};