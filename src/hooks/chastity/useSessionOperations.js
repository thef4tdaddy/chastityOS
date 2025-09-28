import { useCallback } from 'react';
import { addDoc, Timestamp } from 'firebase/firestore';
import { formatTime, formatElapsedTime } from '../../utils';

/**
 * Custom hook for chastity session operations (start, end, pause, resume)
 */
export const useSessionOperations = (
    sessionState,
    firestoreOps,
    googleEmail,
    getEventsCollectionRef,
    fetchEvents
) => {
    const {
        isCageOn, cageOnTime, isPaused, pauseStartTime, confirmReset, totalTimeCageOff, timeCageOff,
        accumulatedPauseTimeThisSession, chastityHistory, currentSessionPauseEvents, lastPauseEndTime,
        reasonForPauseInput, editSessionDateInput, editSessionTimeInput,
        setCageOnTime, setIsCageOn, setTimeInChastity, setTimeCageOff, setAccumulatedPauseTimeThisSession,
        setCurrentSessionPauseEvents, setPauseStartTime, setIsPaused, setHasSessionEverBeenActive,
        setConfirmReset, setTempEndTime, setTempStartTime, setShowReasonModal, setChastityHistory,
        setIsPaused: setIsPausedState, setLastPauseEndTime, setShowPauseReasonModal, setReasonForPauseInput,
        setPauseCooldownMessage, setEditSessionMessage, resetTimeoutRef
    } = sessionState;

    const { saveDataToFirestore } = firestoreOps;

    const handleToggleCage = useCallback(() => {
        if (!firestoreOps.userId || !firestoreOps.isAuthReady || isPaused) {
            if (isPaused) {
                console.warn("Cannot toggle cage while session is paused.");
            }
            return;
        }
        
        const currentTime = new Date();
        
        if (confirmReset) {
            setConfirmReset(false);
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
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
    }, [firestoreOps.userId, firestoreOps.isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, saveDataToFirestore]);

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
        await saveDataToFirestore({ isPaused: true, pauseStartTime: now, currentSessionPauseEvents: updatedPauseEvents });
    }, [reasonForPauseInput, saveDataToFirestore, currentSessionPauseEvents]);

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
    }, [pauseStartTime, accumulatedPauseTimeThisSession, saveDataToFirestore, currentSessionPauseEvents]);
    
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
    }, [isCageOn, cageOnTime, editSessionDateInput, editSessionTimeInput, getEventsCollectionRef, googleEmail, saveDataToFirestore, fetchEvents]);

    return {
        handleToggleCage,
        handleInitiatePause,
        handleConfirmPause,
        handleResumeSession,
        handleUpdateCurrentCageOnTime
    };
};