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
    // --- Compose all specialized hooks ---
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

    // --- State for the Reset Modal ---
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

    // --- Handlers to control the modal ---
    const handleInitiateReset = () => {
      setShowResetConfirmModal(true);
    };
    const handleCancelReset = () => {
      setShowResetConfirmModal(false);
    };

    // --- The actual data reset function ---
    const handleResetAllData = useCallback(async (isAccountDeletion = false) => {
      if (!isAuthReady || !userId) return;

      const batch = writeBatch(db);
      const userDocRef = doc(db, "users", userId);
      
      // Full reset of all user document fields
      batch.set(userDocRef, {
          submissivesName: '', 
          keyholderName: '', 
          keyholderPasswordHash: null, 
          passwordAcknowledged: false, 
          requiredKeyholderDurationSeconds: null, 
          goalDurationSeconds: null, 
          rewards: [], 
          punishments: [], 
          isTrackingAllowed: true, 
          eventDisplayMode: 'kinky',
          isCageOn: false, 
          cageOnTime: null, 
          timeInChastity: 0, 
          chastityHistory: [], 
          totalTimeCageOff: 0, 
          isPaused: false, 
          pauseStartTime: null, 
          accumulatedPauseTimeThisSession: 0, 
          currentSessionPauseEvents: [], 
          lastPauseEndTime: null, 
          hasSessionEverBeenActive: false,
          tasks: [], 
          isSelfLocked: false, 
          selfLockCode: null,
          selfLockBackupCode: null, 
          selfLockBackupAcknowledged: false
      });

      // Delete all documents in the events subcollection
      const eventsColRef = getEventsCollectionRef();
      if (eventsColRef) {
          const q = query(eventsColRef);
          const querySnapshot = await getDocs(q);
          querySnapshot.docs.forEach(docSnapshot => batch.delete(docSnapshot.ref));
      }
      
      try {
          await batch.commit();
          // Close the modal on success
          setShowResetConfirmModal(false); 
          if(!isAccountDeletion) alert('All data has been reset.');
      } 
      catch (error) {
          console.error("Error resetting data:", error);
          if(!isAccountDeletion) alert(`Failed to reset data: ${error.message}`);
          // Also close the modal on failure
          setShowResetConfirmModal(false);
      }
    }, [isAuthReady, userId, getEventsCollectionRef]);

    // This is the final object returned by the main hook
    return {
        ...authState,
        ...settingsState,
        ...eventLogState,
        ...sessionState,
        ...dataManagementState,
        ...tasksState,

        // Return the new modal state and handlers
        showResetConfirmModal,
        handleInitiateReset,
        handleCancelReset,
        handleResetAllData,
    };
};
