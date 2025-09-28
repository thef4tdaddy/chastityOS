import { useEffect, useCallback } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useSessionState } from './chastity/useSessionState';
import { useFirestoreOperations } from './chastity/useFirestoreOperations';
import { useSessionOperations } from './chastity/useSessionOperations';
import { useDataRestoration } from './chastity/useDataRestoration';
import { useSessionCompletion } from './chastity/useSessionCompletion';

export const useChastitySession = (
    userId,
    isAuthReady,
    googleEmail,
    getEventsCollectionRef,
    fetchEvents
) => {
    // Use modular hooks for state management
    const sessionState = useSessionState();
    const firestoreOps = useFirestoreOperations(userId, isAuthReady);
    
    // Add userId and isAuthReady to firestoreOps for operations hook
    const firestoreOpsWithUser = { ...firestoreOps, userId, isAuthReady };
    
    const sessionOperations = useSessionOperations(
        sessionState,
        firestoreOpsWithUser,
        googleEmail,
        getEventsCollectionRef,
        fetchEvents
    );

    const {
        cageOnTime, setCageOnTime, isCageOn, setIsCageOn, timeInChastity, setTimeInChastity,
        chastityHistory, setChastityHistory, totalChastityTime, setTotalChastityTime,
        overallTotalPauseTime, setOverallTotalPauseTime, showRestoreSessionPrompt,
        setShowRestoreSessionPrompt, loadedSessionData, setLoadedSessionData,
        hasSessionEverBeenActive, isPaused, pauseStartTime, currentSessionPauseEvents,
        accumulatedPauseTimeThisSession, livePauseDuration, setLivePauseDuration,
        timerInChastityRef, timerCageOffRef, pauseDisplayTimerRef,
        restoreUserIdInput, setRestoreUserIdInput, showRestoreFromIdPrompt,
        setShowRestoreFromIdPrompt, restoreFromIdMessage, setRestoreFromIdMessage
    } = sessionState;

    const { getDocRef, saveDataToFirestore } = firestoreOps;

    // Use additional custom hooks for complex operations
    const dataRestoration = useDataRestoration(sessionState, saveDataToFirestore, userId, fetchEvents);
    const sessionCompletion = useSessionCompletion(sessionState, saveDataToFirestore);

    // Extract handlers from hooks
    const {
        handleToggleCage,
        handleInitiatePause,
        handleConfirmPause,
        handleResumeSession,
        handleUpdateCurrentCageOnTime
    } = sessionOperations;

    const {
        applyRestoredData,
        handleConfirmRestoreFromId,
        handleConfirmRestoreSession,
        handleDiscardAndStartNew,
        handleRestoreUserIdInputChange,
        handleInitiateRestoreFromId,
        handleCancelRestoreFromId
    } = dataRestoration;

    const {
        handleConfirmRemoval,
        handleCancelRemoval,
        handleEndChastityNow
    } = sessionCompletion;

    // Simple handlers
    const handleCancelPauseModal = useCallback(() => sessionState.setShowPauseReasonModal(false), []);

    // Effects for data loading and timers
    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) return;
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isCageOn && !isCageOn && !showRestoreSessionPrompt && data.cageOnTime) {
                    sessionState.setLoadedSessionData(data);
                    sessionState.setShowRestoreSessionPrompt(true);
                } else {
                    applyRestoredData(data);
                }
            } else {
                applyRestoredData({});
            }
        }, (error) => {
            console.error("Error listening to session data:", error);
        });
        
        return () => unsubscribe();
    }, [isAuthReady, userId, getDocRef, applyRestoredData, isCageOn, showRestoreSessionPrompt]);

    useEffect(() => {
        firestoreOps.ensureUserDocExists();
    }, [isAuthReady, userId, firestoreOps.ensureUserDocExists]);

    useEffect(() => {
        let totalEffective = 0;
        let totalPaused = 0;
        chastityHistory.forEach(p => {
            totalEffective += (p.duration || 0) - (p.totalPauseDurationSeconds || 0);
            totalPaused += p.totalPauseDurationSeconds || 0;
        });
        sessionState.setTotalChastityTime(totalEffective);
        sessionState.setOverallTotalPauseTime(totalPaused);
    }, [chastityHistory]);

    useEffect(() => {
        clearInterval(timerInChastityRef.current);
        clearInterval(timerCageOffRef.current);
        clearInterval(pauseDisplayTimerRef.current);
        
        if (isCageOn && !isPaused && cageOnTime) {
            timerInChastityRef.current = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - cageOnTime.getTime()) / 1000);
                setTimeInChastity(elapsed);
            }, 1000);
        } else if (!isCageOn && hasSessionEverBeenActive) {
            timerCageOffRef.current = setInterval(() => sessionState.setTimeCageOff(prev => prev + 1), 1000);
        }
        
        if (isPaused && pauseStartTime) {
            pauseDisplayTimerRef.current = setInterval(() => {
                setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000));
            }, 1000);
        } else {
            setLivePauseDuration(0);
        }
        
        return () => {
            clearInterval(timerInChastityRef.current);
            clearInterval(timerCageOffRef.current);
            clearInterval(pauseDisplayTimerRef.current);
        };
    }, [isCageOn, isPaused, cageOnTime, hasSessionEverBeenActive, pauseStartTime]);

    return {
        // Core session state
        cageOnTime, isCageOn, timeInChastity, 
        timeCageOff: sessionState.timeCageOff, 
        chastityHistory, 
        totalChastityTime: sessionState.totalChastityTime,
        totalTimeCageOff: sessionState.totalTimeCageOff, 
        overallTotalPauseTime: sessionState.overallTotalPauseTime, 
        
        // Modal states
        showReasonModal: sessionState.showReasonModal, 
        reasonForRemoval: sessionState.reasonForRemoval, 
        setReasonForRemoval: sessionState.setReasonForRemoval,
        tempEndTime: sessionState.tempEndTime, 
        tempStartTime: sessionState.tempStartTime, 
        
        // Pause-related state
        isPaused, pauseStartTime, accumulatedPauseTimeThisSession,
        showPauseReasonModal: sessionState.showPauseReasonModal, 
        reasonForPauseInput: sessionState.reasonForPauseInput, 
        setReasonForPauseInput: sessionState.setReasonForPauseInput, 
        currentSessionPauseEvents,
        livePauseDuration, 
        lastPauseEndTime: sessionState.lastPauseEndTime, 
        pauseCooldownMessage: sessionState.pauseCooldownMessage, 
        
        // Restore functionality
        showRestoreSessionPrompt, loadedSessionData,
        hasSessionEverBeenActive, 
        confirmReset: sessionState.confirmReset, 
        setConfirmReset: sessionState.setConfirmReset, 
        
        // Session editing
        editSessionDateInput: sessionState.editSessionDateInput, 
        setEditSessionDateInput: sessionState.setEditSessionDateInput,
        editSessionTimeInput: sessionState.editSessionTimeInput, 
        setEditSessionTimeInput: sessionState.setEditSessionTimeInput, 
        editSessionMessage: sessionState.editSessionMessage, 
        
        // Restore from ID
        restoreUserIdInput, showRestoreFromIdPrompt, restoreFromIdMessage, 
        
        // Keyholder duration
        requiredKeyholderDurationSeconds: sessionState.requiredKeyholderDurationSeconds,
        
        // Handlers
        handleUpdateCurrentCageOnTime, handleToggleCage,
        handleConfirmRemoval, handleCancelRemoval, handleEndChastityNow,
        handleInitiatePause, handleConfirmPause, handleCancelPauseModal, handleResumeSession, 
        handleRestoreUserIdInputChange, handleInitiateRestoreFromId, handleCancelRestoreFromId, 
        handleConfirmRestoreFromId, handleConfirmRestoreSession, handleDiscardAndStartNew, 
        
        // Direct state setters for external use
        saveDataToFirestore, setChastityHistory, 
        setTimeCageOff: sessionState.setTimeCageOff, 
        setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime,
        setAccumulatedPauseTimeThisSession: sessionState.setAccumulatedPauseTimeThisSession, 
        setCurrentSessionPauseEvents: sessionState.setCurrentSessionPauseEvents, 
        setLastPauseEndTime: sessionState.setLastPauseEndTime, 
        setHasSessionEverBeenActive: sessionState.setHasSessionEverBeenActive
    };
};
