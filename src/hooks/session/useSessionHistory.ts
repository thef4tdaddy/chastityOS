import { useState, useCallback } from 'react';
import { Timestamp, addDoc } from 'firebase/firestore';

interface ChastityHistoryEntry {
  id: string;
  periodNumber: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  reasonForRemoval: string;
  totalPauseDurationSeconds: number;
  pauseEvents: any[];
}

interface UseSessionHistoryProps {
  chastityHistory: ChastityHistoryEntry[];
  setChastityHistory: (history: ChastityHistoryEntry[]) => void;
  saveDataToFirestore: (data: Record<string, any>) => Promise<void>;
  getEventsCollectionRef?: () => any;
  googleEmail?: string | null;
  fetchEvents?: () => void;
}

export const useSessionHistory = ({
  chastityHistory,
  setChastityHistory,
  saveDataToFirestore,
  getEventsCollectionRef,
  googleEmail,
  fetchEvents
}: UseSessionHistoryProps) => {
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonForRemoval, setReasonForRemoval] = useState('');
  const [tempEndTime, setTempEndTime] = useState<Date | null>(null);
  const [tempStartTime, setTempStartTime] = useState<Date | null>(null);

  const handleEndChastityNow = useCallback(async (
    cageOnTime: Date | null,
    isPaused: boolean,
    pauseStartTime: Date | null,
    accumulatedPauseTimeThisSession: number,
    currentSessionPauseEvents: any[],
    reason = 'Session ended programmatically.'
  ) => {
    if (!cageOnTime) {
      console.error("Cannot end session: No active session.");
      return;
    }
    
    const endTime = new Date();
    let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
    
    if (isPaused && pauseStartTime) {
      finalAccumulatedPauseTime += Math.max(0, Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000));
    }
    
    const rawDurationSeconds = Math.max(0, Math.floor((endTime.getTime() - cageOnTime.getTime()) / 1000));
    const newHistoryEntry: ChastityHistoryEntry = {
      id: crypto.randomUUID(),
      periodNumber: chastityHistory.length + 1,
      startTime: cageOnTime,
      endTime: endTime,
      duration: rawDurationSeconds,
      reasonForRemoval: reason,
      totalPauseDurationSeconds: finalAccumulatedPauseTime,
      pauseEvents: currentSessionPauseEvents
    };
    
    const updatedHistory = [...chastityHistory, newHistoryEntry];
    setChastityHistory(updatedHistory);
    
    await saveDataToFirestore({
      isCageOn: false, 
      cageOnTime: null, 
      timeInChastity: 0,
      chastityHistory: updatedHistory, 
      isPaused: false, 
      pauseStartTime: null,
      accumulatedPauseTimeThisSession: 0, 
      currentSessionPauseEvents: []
    });
  }, [chastityHistory, setChastityHistory, saveDataToFirestore]);

  const logStartTimeEdit = useCallback(async (oldTime: Date, newTime: Date) => {
    const eventsColRef = typeof getEventsCollectionRef === 'function' ? getEventsCollectionRef() : null;
    if (eventsColRef && fetchEvents) {
      try {
        await addDoc(eventsColRef, {
          eventType: 'startTimeEdit',
          eventTimestamp: Timestamp.now(),
          oldStartTime: oldTime.toISOString(),
          newStartTime: newTime.toISOString(),
          notes: `Session start time edited by ${googleEmail || 'Anonymous User'}.`,
          editedBy: googleEmail || 'Anonymous User'
        });
        fetchEvents();
      } catch (error) {
        console.error("Error logging session edit event:", error);
      }
    }
  }, [getEventsCollectionRef, googleEmail, fetchEvents]);

  return {
    showReasonModal,
    reasonForRemoval,
    tempEndTime,
    tempStartTime,
    setShowReasonModal,
    setReasonForRemoval,
    setTempEndTime,
    setTempStartTime,
    handleEndChastityNow,
    logStartTimeEdit
  };
};