import { useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Import focused hooks
import { useSessionState } from './chastity/sessionState';
import { usePauseState } from './chastity/pauseState';
import { useModalState } from './chastity/modalState';
import { useDataRestoration } from './chastity/dataRestoration';
import { useSessionActions } from './chastity/sessionActions';
import { usePauseActions } from './chastity/pauseActions';
import { useRestoreActions } from './chastity/restoreActions';
import { useSessionEffects } from './chastity/sessionEffects';

export const useChastitySession = (
    userId,
    isAuthReady,
    googleEmail,
    getEventsCollectionRef,
    fetchEvents
) => {
    // --- Use focused state hooks ---
    const sessionState = useSessionState();
    const pauseState = usePauseState();
    const modalState = useModalState();

    const getDocRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return doc(db, "users", targetUserId);
    }, [userId]);

    const saveDataToFirestore = useCallback(async (dataToSave) => {
        if (!isAuthReady || !userId) {
            console.warn("Attempted to save data before authentication was ready or user ID was available.");
            return;
        }
        const docRef = getDocRef();
        if (!docRef) {
            console.error("Firestore document reference is null, cannot save data.");
            return;
        }
        try {
            await setDoc(docRef, dataToSave, { merge: true });
        } catch (error) {
            console.error("Error saving session data to Firestore:", error);
        }
    }, [isAuthReady, userId, getDocRef]);

    // --- Use data restoration hook ---
    const { applyRestoredData } = useDataRestoration({
        ...sessionState,
        ...pauseState,
        ...modalState
    });

    // --- Use action hooks ---
    const sessionActions = useSessionActions({
        isAuthReady, googleEmail, getEventsCollectionRef, fetchEvents, saveDataToFirestore,
        ...sessionState, ...pauseState, ...modalState
    });

    const pauseActions = usePauseActions({
        saveDataToFirestore, ...pauseState
    });

    const restoreActions = useRestoreActions({
        userId, fetchEvents, saveDataToFirestore, applyRestoredData,
        ...modalState, ...sessionState, ...pauseState
    });

    // --- Use effects hook ---
    useSessionEffects({
        isAuthReady, userId, getDocRef, applyRestoredData,
        isCageOn: sessionState.isCageOn,
        showRestoreSessionPrompt: modalState.showRestoreSessionPrompt,
        setLoadedSessionData: modalState.setLoadedSessionData,
        setShowRestoreSessionPrompt: modalState.setShowRestoreSessionPrompt,
        chastityHistory: sessionState.chastityHistory,
        setTotalChastityTime: sessionState.setTotalChastityTime,
        setOverallTotalPauseTime: sessionState.setOverallTotalPauseTime,
        hasSessionEverBeenActive: sessionState.hasSessionEverBeenActive,
        isPaused: pauseState.isPaused,
        cageOnTime: sessionState.cageOnTime,
        pauseStartTime: pauseState.pauseStartTime,
        setTimeInChastity: sessionState.setTimeInChastity,
        setTimeCageOff: sessionState.setTimeCageOff,
        setLivePauseDuration: pauseState.setLivePauseDuration
    });

    return {
        ...sessionState,
        ...pauseState,
        ...modalState,
        ...sessionActions,
        ...pauseActions,
        ...restoreActions,
        saveDataToFirestore
    };
};
