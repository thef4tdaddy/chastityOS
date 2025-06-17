// src/hooks/useChastityState.js
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';
import { useEventLog } from './useEventLog';
import { useChastitySession } from './useChastitySession';
import { useDataManagement } from './useDataManagement';
import { useTasks } from './useTasks';
import { doc, getDocs, query, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export const useChastityState = () => {
    // Compose all specialized hooks
    const authState = useAuth();
    const { userId, isAuthReady, googleEmail } = authState;

    const settingsState = useSettings(userId, isAuthReady);
    const eventLogState = useEventLog(userId, isAuthReady);
    const tasksState = useTasks(userId, isAuthReady);
    const { getEventsCollectionRef } = eventLogState;

    const sessionState = useChastitySession(
        userId, isAuthReady, googleEmail,
        getEventsCollectionRef, eventLogState.fetchEvents
    );

    const dataManagementState = useDataManagement({
        userId, settingsState, sessionState,
        eventLogState, getEventsCollectionRef
    });

    const [confirmReset, setConfirmReset] = useState(false);

    const handleResetAllData = useCallback(async (isAccountDeletion = false) => {
        if (!isAccountDeletion && !confirmReset) {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
            return;
        }
        if (!isAuthReady || !userId) return;

        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", userId);
        batch.set(userDocRef, {
            submissivesName: '', keyholderName: '', keyholderPasswordHash: null, 
            passwordAcknowledged: false, requiredKeyholderDurationSeconds: null, 
            goalDurationSeconds: null, rewards: [], punishments: [], 
            isTrackingAllowed: true, eventDisplayMode: 'kinky',
            isCageOn: false, cageOnTime: null, timeInChastity: 0, 
            chastityHistory: [], totalTimeCageOff: 0, 
            isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, 
            currentSessionPauseEvents: [], lastPauseEndTime: null, hasSessionEverBeenActive: false,
            tasks: [], isSelfLocked: false, selfLockCode: null,
            selfLockBackupCode: null, selfLockBackupAcknowledged: false
        });

        // Correctly query and delete all documents in the events subcollection
        const eventsColRef = getEventsCollectionRef();
        if (eventsColRef) {
            const q = query(eventsColRef);
            const querySnapshot = await getDocs(q);
            querySnapshot.docs.forEach(docSnapshot => batch.delete(docSnapshot.ref));
        }
        
        try {
            await batch.commit();
            if(!isAccountDeletion) alert('All data has been reset.');
        } 
        catch (error) {
            console.error("Error resetting data:", error);
            if(!isAccountDeletion) alert(`Failed to reset data: ${error.message}`);
        }
        setConfirmReset(false);
    }, [isAuthReady, userId, confirmReset, getEventsCollectionRef]);

    return {
        ...authState,
        ...settingsState,
        ...eventLogState,
        ...sessionState,
        ...dataManagementState,
        ...tasksState,
        confirmReset,
        handleResetAllData,
    };
};
