// src/hooks/useChastityState.js
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';
import { useEventLog } from './useEventLog';
import { useChastitySession } from './useChastitySession';
import { doc, getDocs, deleteDoc, query } from 'firebase/firestore';
import { db } from '../firebase';

export const useChastityState = () => {
    // 1. Compose all specialized hooks
    const authState = useAuth();
    const { userId, isAuthReady, googleEmail } = authState;

    const settingsState = useSettings(userId, isAuthReady);
    const { savedSubmissivesName, goalDurationSeconds, keyholderName, requiredKeyholderDurationSeconds } = settingsState;
    
    const eventLogState = useEventLog(userId, isAuthReady);
    const { getEventsCollectionRef } = eventLogState;

    const sessionState = useChastitySession(
        userId,
        isAuthReady,
        savedSubmissivesName,
        goalDurationSeconds,
        keyholderName,
        requiredKeyholderDurationSeconds,
        getEventsCollectionRef,
        eventLogState.fetchEvents,
        googleEmail
    );

    const [confirmReset, setConfirmReset] = useState(false);

    // --- Global Handlers that need access to multiple hooks ---
    const handleResetAllData = useCallback(async () => {
        if (!confirmReset) {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
            return;
        }

        if (!isAuthReady) return;

        // Clear Session Data
        await sessionState.saveDataToFirestore({ 
            isCageOn: false, cageOnTime: null, timeInChastity: 0, 
            chastityHistory: [], totalTimeCageOff: 0, 
            isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, 
            currentSessionPauseEvents: [], lastPauseEndTime: null, hasSessionEverBeenActive: false 
        });
        sessionState.setChastityHistory([]);
        sessionState.setTimeCageOff(0);


        // Clear Settings Data
        await settingsState.saveSettingsToFirestore({ 
            submissivesName: '', keyholderName: '', keyholderPasswordHash: null, 
            requiredKeyholderDurationSeconds: null, goalDurationSeconds: null, rewards: [], 
            punishments: [], isTrackingAllowed: true, eventDisplayMode: 'kinky' 
        });

        // Clear Event Log
        const eventsColRef = getEventsCollectionRef();
        if (eventsColRef) {
            const q = query(eventsColRef);
            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, eventsColRef.path, docSnapshot.id)));
            await Promise.all(deletePromises);
            eventLogState.setSexualEventsLog([]);
        }

        setConfirmReset(false);

    }, [isAuthReady, confirmReset, sessionState, settingsState, eventLogState, getEventsCollectionRef]);


    // 5. Combine and return everything
    return {
        ...authState,
        ...settingsState,
        ...eventLogState,
        ...sessionState,
        confirmReset,
        handleResetAllData,
    };
};
