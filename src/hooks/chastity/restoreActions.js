import { useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export function useRestoreActions({
    userId, fetchEvents, saveDataToFirestore, applyRestoredData,
    restoreUserIdInput, setRestoreUserIdInput, setRestoreFromIdMessage, setShowRestoreFromIdPrompt,
    loadedSessionData, setShowRestoreSessionPrompt, setLoadedSessionData,
    setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime,
    setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setLastPauseEndTime,
    setHasSessionEverBeenActive
}) {
    const handleRestoreUserIdInputChange = (e) => setRestoreUserIdInput(e.target.value);
    const handleInitiateRestoreFromId = () => setShowRestoreFromIdPrompt(true);
    const handleCancelRestoreFromId = () => setShowRestoreFromIdPrompt(false);

    const handleConfirmRestoreFromId = useCallback(async () => {
        if (!restoreUserIdInput.trim()) {
            setRestoreFromIdMessage("Please enter a User ID.");
            setTimeout(() => setRestoreFromIdMessage(''), 3000);
            setShowRestoreFromIdPrompt(false);
            return;
        }
        const docRef = doc(db, 'users', restoreUserIdInput);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                applyRestoredData(docSnap.data());
                setRestoreFromIdMessage("Data successfully loaded from User ID!");
                await setDoc(doc(db, "users", userId), docSnap.data(), { merge: true });
                fetchEvents(userId);
            } else {
                setRestoreFromIdMessage("No data found for the provided User ID.");
            }
        } catch (error) {
            console.error("Error restoring data from ID:", error);
            setRestoreFromIdMessage(`Error restoring data: ${error.message}`);
        } finally {
            setShowRestoreFromIdPrompt(false);
            setRestoreUserIdInput('');
            setTimeout(() => setRestoreFromIdMessage(''), 3000);
        }
    }, [restoreUserIdInput, userId, applyRestoredData, fetchEvents, setRestoreFromIdMessage, setShowRestoreFromIdPrompt, setRestoreUserIdInput]);

    const handleConfirmRestoreSession = useCallback(async () => {
        if (loadedSessionData) {
            const mergedData = {
                ...loadedSessionData,
                chastityHistory: loadedSessionData.chastityHistory || [],
                totalTimeCageOff: loadedSessionData.totalTimeCageOff || 0
            };
            applyRestoredData(mergedData);
            await saveDataToFirestore(mergedData);
        }
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [loadedSessionData, applyRestoredData, saveDataToFirestore, setShowRestoreSessionPrompt, setLoadedSessionData]);

    const handleDiscardAndStartNew = useCallback(async () => {
        await saveDataToFirestore({
            isCageOn: false,
            cageOnTime: null,
            timeInChastity: 0,
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0,
            currentSessionPauseEvents: [],
            lastPauseEndTime: null,
            hasSessionEverBeenActive: false
        });
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
        setLastPauseEndTime(null);
        setHasSessionEverBeenActive(false);
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [saveDataToFirestore, setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setLastPauseEndTime, setHasSessionEverBeenActive, setShowRestoreSessionPrompt, setLoadedSessionData]);

    return {
        handleRestoreUserIdInputChange,
        handleInitiateRestoreFromId,
        handleCancelRestoreFromId,
        handleConfirmRestoreFromId,
        handleConfirmRestoreSession,
        handleDiscardAndStartNew
    };
}