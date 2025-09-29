import { useState, useEffect, useCallback, useRef } from 'react';
import { formatElapsedTime } from '../../utils';

interface PauseEvent {
  startTime: Date;
  endTime?: Date;
  reason: string;
  duration?: number;
}

interface UsePauseResumeProps {
  isPaused: boolean;
  pauseStartTime: Date | null;
  lastPauseEndTime: Date | null;
  currentSessionPauseEvents: PauseEvent[];
  saveDataToFirestore: (data: Record<string, any>) => Promise<void>;
  reasonForPauseInput: string;
  setReasonForPauseInput: (reason: string) => void;
  setIsPaused: (paused: boolean) => void;
  setPauseStartTime: (time: Date | null) => void;
  setCurrentSessionPauseEvents: (events: PauseEvent[]) => void;
  setLastPauseEndTime: (time: Date | null) => void;
  accumulatedPauseTimeThisSession: number;
  setAccumulatedPauseTimeThisSession: (time: number) => void;
}

export const usePauseResume = ({
  isPaused,
  pauseStartTime,
  lastPauseEndTime,
  currentSessionPauseEvents,
  saveDataToFirestore,
  reasonForPauseInput,
  setReasonForPauseInput,
  setIsPaused,
  setPauseStartTime,
  setCurrentSessionPauseEvents,
  setLastPauseEndTime,
  accumulatedPauseTimeThisSession,
  setAccumulatedPauseTimeThisSession
}: UsePauseResumeProps) => {
  const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
  const [livePauseDuration, setLivePauseDuration] = useState(0);
  const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');
  
  const pauseDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect for live pause duration display
  useEffect(() => {
    if (pauseDisplayTimerRef.current) {
      clearInterval(pauseDisplayTimerRef.current);
    }
    
    if (isPaused && pauseStartTime) {
      pauseDisplayTimerRef.current = setInterval(() => {
        setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      setLivePauseDuration(0);
    }
    
    return () => {
      if (pauseDisplayTimerRef.current) {
        clearInterval(pauseDisplayTimerRef.current);
      }
    };
  }, [isPaused, pauseStartTime]);

  const handleInitiatePause = useCallback(() => {
    if (lastPauseEndTime && (new Date().getTime() - lastPauseEndTime.getTime() < 12 * 3600 * 1000)) {
      const remainingCooldown = (12 * 3600 * 1000) - (new Date().getTime() - lastPauseEndTime.getTime());
      setPauseCooldownMessage(`You can pause again in ${formatElapsedTime(Math.ceil(remainingCooldown / 1000))}.`);
      setTimeout(() => setPauseCooldownMessage(''), 5000);
      return;
    }
    setShowPauseReasonModal(true);
  }, [lastPauseEndTime]);

  const handleConfirmPause = useCallback(async () => {
    const now = new Date();
    setIsPaused(true);
    setPauseStartTime(now);
    const updatedPauseEvents = [...currentSessionPauseEvents, { startTime: now, reason: reasonForPauseInput }];
    setCurrentSessionPauseEvents(updatedPauseEvents);
    setShowPauseReasonModal(false);
    setReasonForPauseInput('');
    await saveDataToFirestore({ 
      isPaused: true, 
      pauseStartTime: now, 
      currentSessionPauseEvents: updatedPauseEvents 
    });
  }, [reasonForPauseInput, saveDataToFirestore, currentSessionPauseEvents, setIsPaused, setPauseStartTime, setCurrentSessionPauseEvents, setShowPauseReasonModal, setReasonForPauseInput]);

  const handleResumeSession = useCallback(async () => {
    const now = new Date();
    if (!pauseStartTime) {
      console.error("No pause start time found to resume session.");
      return;
    }
    const duration = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);
    const newAccumulated = accumulatedPauseTimeThisSession + duration;

    const updatedPauseEvents = currentSessionPauseEvents.map((e, i) =>
      i === currentSessionPauseEvents.length - 1 ? { ...e, endTime: now, duration } : e
    );

    setAccumulatedPauseTimeThisSession(newAccumulated);
    setCurrentSessionPauseEvents(updatedPauseEvents);
    setIsPaused(false);
    setPauseStartTime(null);
    setLastPauseEndTime(now);

    await saveDataToFirestore({
      isPaused: false,
      pauseStartTime: null,
      accumulatedPauseTimeThisSession: newAccumulated,
      currentSessionPauseEvents: updatedPauseEvents,
      lastPauseEndTime: now
    });
  }, [
    pauseStartTime, 
    accumulatedPauseTimeThisSession, 
    currentSessionPauseEvents, 
    saveDataToFirestore,
    setAccumulatedPauseTimeThisSession,
    setCurrentSessionPauseEvents,
    setIsPaused,
    setPauseStartTime,
    setLastPauseEndTime
  ]);

  const handleCancelPauseModal = useCallback(() => setShowPauseReasonModal(false), []);

  return {
    showPauseReasonModal,
    livePauseDuration,
    pauseCooldownMessage,
    handleInitiatePause,
    handleConfirmPause,
    handleResumeSession,
    handleCancelPauseModal,
    setShowPauseReasonModal
  };
};