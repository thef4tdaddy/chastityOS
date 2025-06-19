// src/hooks/useChastityState.js
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';
import { useEventLog } from './useEventLog';
import { useChastitySession } from './useChastitySession';
import { useDataManagement } from './useDataManagement';
import { useTasks } from './useTasks';
import { usePersonalGoal } from './usePersonalGoal';

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

    // Initialize the personal goal hook
    const personalGoalState = usePersonalGoal({
        setSettings: settingsState.setSettings,
        handleEndChastityNow: sessionState.handleEndChastityNow,
        settings: {
            // **THE FIX IS HERE**
            // Pass down all the necessary goal-related settings
            goalBackupCodeHash: settingsState.goalBackupCodeHash,
            selfLockCode: settingsState.selfLockCode,
            isHardcoreGoal: settingsState.isHardcoreGoal,
            goalDurationSeconds: settingsState.goalDurationSeconds,
            goalSetDate: settingsState.goalSetDate,
        }
    });

    const dataManagementState = useDataManagement({
        userId, settingsState, sessionState,
        eventLogState, getEventsCollectionRef
    });
    
    // Return all state and functions, ensuring they are correctly spread
    return {
        ...authState,
        ...settingsState,
        ...eventLogState,
        ...sessionState,
        ...dataManagementState,
        ...tasksState,
        ...personalGoalState,
    };
};
