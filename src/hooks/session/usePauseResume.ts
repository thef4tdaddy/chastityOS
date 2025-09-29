import { useState, useCallback, useEffect } from 'react';

interface PauseEvent {
  id: string;
  startTime: Date;
  endTime?: Date;
  reason: string;
  duration?: number;
}

interface UsePauseResumeProps {
  sessionId: string | null;
  isSessionActive: boolean;
  onPauseStateChange?: (_isPaused: boolean) => void;
}

export const usePauseResume = ({
  sessionId,
  isSessionActive,
  onPauseStateChange
}: UsePauseResumeProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [pauseEvents, setPauseEvents] = useState<PauseEvent[]>([]);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [currentPauseDuration, setCurrentPauseDuration] = useState(0);
  const [canPause, setCanPause] = useState(true);
  const [message, setMessage] = useState('');

  const handlePauseSession = useCallback((reason: string) => {
    if (!isSessionActive || isPaused || !sessionId) {
      setMessage('Cannot pause session at this time');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const now = new Date();
    const newPauseEvent: PauseEvent = {
      id: crypto.randomUUID(),
      startTime: now,
      reason: reason.trim() || 'No reason provided'
    };

    setIsPaused(true);
    setPauseStartTime(now);
    setPauseEvents(prev => [...prev, newPauseEvent]);
    setCanPause(false);

    onPauseStateChange?.(true);
    setMessage('Session paused');
    setTimeout(() => setMessage(''), 3000);
  }, [isSessionActive, isPaused, sessionId, onPauseStateChange]);

  const handleResumeSession = useCallback(() => {
    if (!isPaused || !pauseStartTime) {
      setMessage('No active pause to resume');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const now = new Date();
    const pauseDuration = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);

    setPauseEvents(prev => 
      prev.map((event, index) => 
        index === prev.length - 1
          ? { ...event, endTime: now, duration: pauseDuration }
          : event
      )
    );

    setTotalPausedTime(prev => prev + pauseDuration);
    setIsPaused(false);
    setPauseStartTime(null);
    setCurrentPauseDuration(0);

    // Set cooldown period before next pause (12 hours)
    setCanPause(false);
    setTimeout(() => setCanPause(true), 12 * 60 * 60 * 1000);

    onPauseStateChange?.(false);
    setMessage('Session resumed');
    setTimeout(() => setMessage(''), 3000);
  }, [isPaused, pauseStartTime, onPauseStateChange]);

  const getActivePauseDuration = useCallback((): number => {
    if (!isPaused || !pauseStartTime) return 0;
    return Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
  }, [isPaused, pauseStartTime]);

  // Update current pause duration every second when paused
  useEffect(() => {
    if (!isPaused || !pauseStartTime) {
      setCurrentPauseDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const duration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
      setCurrentPauseDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, pauseStartTime]);

  // Reset state when session becomes inactive
  useEffect(() => {
    if (!isSessionActive) {
      setIsPaused(false);
      setPauseStartTime(null);
      setCurrentPauseDuration(0);
      setCanPause(true);
    }
  }, [isSessionActive]);

  return {
    isPaused,
    pauseEvents,
    totalPausedTime,
    currentPauseDuration,
    canPause,
    message,
    handlePauseSession,
    handleResumeSession,
    getActivePauseDuration
  };
};