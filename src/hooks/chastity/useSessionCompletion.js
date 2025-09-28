import { useCallback } from 'react';

/**
 * Custom hook for handling session completion operations
 */
export const useSessionCompletion = (sessionState, saveDataToFirestore) => {
    const {
        isCageOn, cageOnTime, isPaused, pauseStartTime, chastityHistory,
        accumulatedPauseTimeThisSession, currentSessionPauseEvents,
        tempStartTime, tempEndTime, reasonForRemoval,
        setChastityHistory, setIsCageOn, setCageOnTime, setTimeInChastity,
        setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession,
        setCurrentSessionPauseEvents, setReasonForRemoval, setTempEndTime,
        setTempStartTime, setShowReasonModal
    } = sessionState;

    const createHistoryEntry = useCallback((startTime, endTime, reason, finalPauseTime = 0) => {
        const rawDurationSeconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
        
        return {
            id: crypto.randomUUID(),
            periodNumber: chastityHistory.length + 1,
            startTime: startTime,
            endTime: endTime,
            duration: rawDurationSeconds,
            reasonForRemoval: reason,
            totalPauseDurationSeconds: finalPauseTime,
            pauseEvents: currentSessionPauseEvents
        };
    }, [chastityHistory.length, currentSessionPauseEvents]);

    const resetSessionState = useCallback(() => {
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
    }, []);

    const handleConfirmRemoval = useCallback(async () => {
        if (!tempStartTime || !tempEndTime) {
            console.error("Missing data for confirming removal.");
            return;
        }
        
        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
        if (isPaused && pauseStartTime) {
            finalAccumulatedPauseTime += Math.max(0, Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000));
        }
        
        const newHistoryEntry = createHistoryEntry(tempStartTime, tempEndTime, reasonForRemoval, finalAccumulatedPauseTime);
        const updatedHistory = [...chastityHistory, newHistoryEntry];
        
        setChastityHistory(updatedHistory);
        resetSessionState();
        
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
        
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, [tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, isPaused, pauseStartTime, reasonForRemoval, chastityHistory, createHistoryEntry, resetSessionState, saveDataToFirestore]);

    const handleCancelRemoval = useCallback(() => {
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, []);

    const handleEndChastityNow = useCallback(async (reason = 'Session ended programmatically.') => {
        if (!isCageOn || !cageOnTime) {
            console.error("Cannot end session: No active session.");
            return;
        }
        
        const endTime = new Date();
        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
        
        if (isPaused && pauseStartTime) {
            finalAccumulatedPauseTime += Math.max(0, Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000));
        }
        
        const newHistoryEntry = createHistoryEntry(cageOnTime, endTime, reason, finalAccumulatedPauseTime);
        const updatedHistory = [...chastityHistory, newHistoryEntry];
        
        setChastityHistory(updatedHistory);
        resetSessionState();
        
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
    }, [isCageOn, cageOnTime, accumulatedPauseTimeThisSession, isPaused, pauseStartTime, chastityHistory, createHistoryEntry, resetSessionState, saveDataToFirestore]);

    return {
        handleConfirmRemoval,
        handleCancelRemoval,
        handleEndChastityNow
    };
};