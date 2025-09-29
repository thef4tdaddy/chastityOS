import { useCallback } from 'react';
import { formatElapsedTime } from '../../utils';

export function usePauseActions({
    saveDataToFirestore, lastPauseEndTime, setPauseCooldownMessage,
    setShowPauseReasonModal, reasonForPauseInput, setReasonForPauseInput,
    setIsPaused, setPauseStartTime, currentSessionPauseEvents, setCurrentSessionPauseEvents,
    pauseStartTime, accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession,
    setLastPauseEndTime
}) {
    const handleInitiatePause = useCallback(() => {
        if (lastPauseEndTime && (new Date().getTime() - lastPauseEndTime.getTime() < 12 * 3600 * 1000)) {
            const remainingCooldown = (12 * 3600 * 1000) - (new Date().getTime() - lastPauseEndTime.getTime());
            setPauseCooldownMessage(`You can pause again in ${formatElapsedTime(Math.ceil(remainingCooldown / 1000))}.`);
            setTimeout(() => setPauseCooldownMessage(''), 5000);
            return;
        }
        setShowPauseReasonModal(true);
    }, [lastPauseEndTime, setPauseCooldownMessage, setShowPauseReasonModal]);

    const handleConfirmPause = useCallback(async () => {
        const now = new Date();
        setIsPaused(true);
        setPauseStartTime(now);
        const updatedPauseEvents = [...currentSessionPauseEvents, { startTime: now, reason: reasonForPauseInput }];
        setCurrentSessionPauseEvents(updatedPauseEvents);
        setShowPauseReasonModal(false);
        setReasonForPauseInput('');
        await saveDataToFirestore({ isPaused: true, pauseStartTime: now, currentSessionPauseEvents: updatedPauseEvents });
    }, [reasonForPauseInput, saveDataToFirestore, currentSessionPauseEvents, setIsPaused, setPauseStartTime, setCurrentSessionPauseEvents, setShowPauseReasonModal, setReasonForPauseInput]);

    const handleCancelPauseModal = useCallback(() => setShowPauseReasonModal(false), [setShowPauseReasonModal]);
    
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
    }, [pauseStartTime, accumulatedPauseTimeThisSession, saveDataToFirestore, currentSessionPauseEvents, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setIsPaused, setPauseStartTime, setLastPauseEndTime]);

    return {
        handleInitiatePause,
        handleConfirmPause,
        handleCancelPauseModal,
        handleResumeSession
    };
}