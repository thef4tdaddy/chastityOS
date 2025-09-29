import { useCallback } from 'react';
import { addDoc, Timestamp } from 'firebase/firestore';
import { formatTime } from '../../utils';

export function useSessionActions({
    isAuthReady, googleEmail, getEventsCollectionRef, fetchEvents, saveDataToFirestore,
    // Session state
    isCageOn, cageOnTime, setIsCageOn, setCageOnTime, setTimeInChastity, setTimeCageOff,
    totalTimeCageOff, timeCageOff, chastityHistory, setChastityHistory,
    setHasSessionEverBeenActive,
    // Pause state
    isPaused, setIsPaused, pauseStartTime, setPauseStartTime,
    accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession,
    currentSessionPauseEvents, setCurrentSessionPauseEvents,
    // Modal state
    confirmReset, setConfirmReset, tempStartTime, tempEndTime,
    setTempEndTime, setTempStartTime, setShowReasonModal,
    reasonForRemoval, setReasonForRemoval,
    editSessionDateInput, editSessionTimeInput, setEditSessionMessage
}) {
    const handleToggleCage = useCallback(() => {
        if (!isAuthReady || isPaused) {
            if (isPaused) {
                console.warn("Cannot toggle cage while session is paused.");
            }
            return;
        }
        const currentTime = new Date();
        if (confirmReset) {
            setConfirmReset(false);
        }
        if (!isCageOn) {
            const newTotalOffTime = totalTimeCageOff + timeCageOff;
            setCageOnTime(currentTime);
            setIsCageOn(true);
            setTimeInChastity(0);
            setTimeCageOff(0);
            setAccumulatedPauseTimeThisSession(0);
            setCurrentSessionPauseEvents([]);
            setPauseStartTime(null);
            setIsPaused(false);
            setHasSessionEverBeenActive(true);
            saveDataToFirestore({
                isCageOn: true,
                cageOnTime: currentTime,
                totalTimeCageOff: newTotalOffTime,
                timeInChastity: 0,
                hasSessionEverBeenActive: true,
                isPaused: false,
                pauseStartTime: null,
                accumulatedPauseTimeThisSession: 0,
                currentSessionPauseEvents: []
            });
        } else {
            setTempEndTime(currentTime);
            setTempStartTime(cageOnTime);
            setShowReasonModal(true);
        }
    }, [isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, saveDataToFirestore, setCageOnTime, setIsCageOn, setTimeInChastity, setTimeCageOff, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setPauseStartTime, setIsPaused, setHasSessionEverBeenActive, setTempEndTime, setTempStartTime, setShowReasonModal, setConfirmReset]);

    const handleConfirmRemoval = useCallback(async () => {
        if (!isAuthReady || !tempStartTime || !tempEndTime) {
            console.error("Missing data for confirming removal.");
            return;
        }
        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
        if (isPaused && pauseStartTime) {
            finalAccumulatedPauseTime += Math.max(0, Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000));
        }
        const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));
        const newHistoryEntry = {
            id: crypto.randomUUID(),
            periodNumber: chastityHistory.length + 1,
            startTime: tempStartTime,
            endTime: tempEndTime,
            duration: rawDurationSeconds,
            reasonForRemoval: reasonForRemoval,
            totalPauseDurationSeconds: finalAccumulatedPauseTime,
            pauseEvents: currentSessionPauseEvents
        };
        const updatedHistory = [...chastityHistory, newHistoryEntry];
        setChastityHistory(updatedHistory);
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);

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
    }, [isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, isPaused, pauseStartTime, chastityHistory, reasonForRemoval, saveDataToFirestore, setChastityHistory, setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setReasonForRemoval, setTempEndTime, setTempStartTime, setShowReasonModal]);

    const handleCancelRemoval = useCallback(() => {
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, [setReasonForRemoval, setTempEndTime, setTempStartTime, setShowReasonModal]);

    const handleUpdateCurrentCageOnTime = useCallback(async () => {
        if (!isCageOn || !cageOnTime) {
            setEditSessionMessage("No active session to edit.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        const newTime = new Date(`${editSessionDateInput}T${editSessionTimeInput}`);
        if (isNaN(newTime.getTime())) {
            setEditSessionMessage("Invalid date and/or time provided.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        if (newTime.getTime() > new Date().getTime()) {
            setEditSessionMessage("Start time cannot be in the future.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        const oldTimeForLog = formatTime(cageOnTime, true, true);
        setCageOnTime(newTime);
        setTimeInChastity(Math.max(0, Math.floor((new Date().getTime() - newTime.getTime()) / 1000)));
        const newTimeForLog = formatTime(newTime, true, true);
        const eventsColRef = typeof getEventsCollectionRef === 'function' ? getEventsCollectionRef() : null;
        if (eventsColRef) {
            try {
                await addDoc(eventsColRef, {
                    eventType: 'startTimeEdit',
                    eventTimestamp: Timestamp.now(),
                    oldStartTime: cageOnTime.toISOString(),
                    newStartTime: newTime.toISOString(),
                    notes: `Session start time edited by ${googleEmail || 'Anonymous User'}.\nOriginal: ${oldTimeForLog}.\nNew: ${newTimeForLog}.`,
                    editedBy: googleEmail || 'Anonymous User'
                });
                fetchEvents();
            } catch (error) {
                console.error("Error logging session edit event:", error);
                setEditSessionMessage("Error logging edit. Update applied locally.");
                setTimeout(() => setEditSessionMessage(''), 3000);
            }
        }
        await saveDataToFirestore({ cageOnTime: newTime });
        setEditSessionMessage("Start time updated successfully!");
        setTimeout(() => setEditSessionMessage(''), 3000);
    }, [isCageOn, cageOnTime, editSessionDateInput, editSessionTimeInput, getEventsCollectionRef, googleEmail, saveDataToFirestore, fetchEvents, setCageOnTime, setTimeInChastity, setEditSessionMessage]);

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
        const rawDurationSeconds = Math.max(0, Math.floor((endTime.getTime() - cageOnTime.getTime()) / 1000));
        const newHistoryEntry = {
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
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
        await saveDataToFirestore({
            isCageOn: false, cageOnTime: null, timeInChastity: 0,
            chastityHistory: updatedHistory, isPaused: false, pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: []
        });
    }, [isCageOn, cageOnTime, accumulatedPauseTimeThisSession, isPaused, pauseStartTime, chastityHistory, currentSessionPauseEvents, saveDataToFirestore, setChastityHistory, setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents]);

    return {
        handleToggleCage,
        handleConfirmRemoval,
        handleCancelRemoval,
        handleUpdateCurrentCageOnTime,
        handleEndChastityNow
    };
}