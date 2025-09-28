import { useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Custom hook for data restoration operations
 */
export const useDataRestoration = (sessionState, saveDataToFirestore, userId, fetchEvents) => {
    const {
        setChastityHistory, setTotalTimeCageOff, setLastPauseEndTime, setIsCageOn, setCageOnTime,
        setTimeInChastity, setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession,
        setCurrentSessionPauseEvents, setHasSessionEverBeenActive, setRequiredKeyholderDurationSeconds,
        setShowRestoreSessionPrompt, setLoadedSessionData, setShowRestoreFromIdPrompt,
        setRestoreUserIdInput, setRestoreFromIdMessage
    } = sessionState;

    const applyRestoredData = useCallback((data) => {
        if (!data || typeof data !== 'object') {
            console.warn("⚠️ Skipping applyRestoredData: invalid or empty data", data);
            return;
        }
        
        const loadedHist = (data.chastityHistory || []).map(item => ({
            ...item,
            startTime: item.startTime?.toDate ? item.startTime.toDate() : null,
            endTime: item.endTime?.toDate ? item.endTime.toDate() : null,
            totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0,
            pauseEvents: (item.pauseEvents || []).map(p => ({
                ...p,
                startTime: p.startTime?.toDate ? p.startTime.toDate() : null,
                endTime: p.endTime?.toDate ? p.endTime.toDate() : null
            }))
        }));
        
        setChastityHistory(loadedHist);
        setTotalTimeCageOff(data.totalTimeCageOff || 0);
        
        const lPauseEndTime = data.lastPauseEndTime?.toDate ? data.lastPauseEndTime.toDate() : null;
        setLastPauseEndTime(lPauseEndTime && !isNaN(lPauseEndTime.getTime()) ? lPauseEndTime : null);
        
        const loadedCageOn = data.isCageOn || false;
        const loadedCageOnTime = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null;
        const loadedPauseStart = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;
        
        setIsCageOn(loadedCageOn);
        setCageOnTime(loadedCageOn && loadedCageOnTime && !isNaN(loadedCageOnTime.getTime()) ? loadedCageOnTime : null);
        
        if (loadedCageOn && loadedCageOnTime) {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - loadedCageOnTime.getTime()) / 1000);
            setTimeInChastity(elapsed);
        } else {
            setTimeInChastity(0);
        }
        
        setIsPaused(loadedCageOn ? (data.isPaused || false) : false);
        setPauseStartTime(loadedCageOn && data.isPaused && loadedPauseStart && !isNaN(loadedPauseStart.getTime()) ? loadedPauseStart : null);
        setAccumulatedPauseTimeThisSession(loadedCageOn ? (data.accumulatedPauseTimeThisSession || 0) : 0);
        setCurrentSessionPauseEvents(
            loadedCageOn
                ? (data.currentSessionPauseEvents || []).map(p => ({
                    ...p,
                    startTime: p.startTime?.toDate(),
                    endTime: p.endTime?.toDate()
                }))
                : []
        );
        setHasSessionEverBeenActive(data.hasSessionEverBeenActive !== undefined ? data.hasSessionEverBeenActive : true);
        setRequiredKeyholderDurationSeconds(data.requiredKeyholderDurationSeconds || 0);
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, []);

    const handleConfirmRestoreFromId = useCallback(async () => {
        const { restoreUserIdInput } = sessionState;
        
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
    }, [sessionState.restoreUserIdInput, userId, applyRestoredData, fetchEvents]);

    const handleConfirmRestoreSession = useCallback(async () => {
        const { loadedSessionData } = sessionState;
        
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
    }, [sessionState.loadedSessionData, applyRestoredData, saveDataToFirestore]);

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
    }, [saveDataToFirestore]);

    // Simple handlers for input changes
    const handleRestoreUserIdInputChange = (e) => setRestoreUserIdInput(e.target.value);
    const handleInitiateRestoreFromId = () => setShowRestoreFromIdPrompt(true);
    const handleCancelRestoreFromId = () => setShowRestoreFromIdPrompt(false);

    return {
        applyRestoredData,
        handleConfirmRestoreFromId,
        handleConfirmRestoreSession,
        handleDiscardAndStartNew,
        handleRestoreUserIdInputChange,
        handleInitiateRestoreFromId,
        handleCancelRestoreFromId
    };
};