// src/hooks/useChastityState.js
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';
import { useEventLog } from './useEventLog';
import { useChastitySession } from './useChastitySession';
import { useDataManagement } from './useDataManagement';
import { useTasks } from './useTasks';
import { usePersonalGoal } from './usePersonalGoal'; // 1. Import the new hook

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

    // 2. Initialize the personal goal hook
    // We pass it the functions it needs to interact with other parts of the state
    const personalGoalState = usePersonalGoal({
        setSettings: settingsState.setSettings,
        handleEndChastityNow: sessionState.handleEndChastityNow, // Give it the ability to end the session
        settings: { // Pass only the specific settings it needs
            goalBackupCodeHash: settingsState.goalBackupCodeHash,
        }
    });

    // The Data Management hook can stay as it is
    const dataManagementState = useDataManagement({
        userId, settingsState, sessionState,
        eventLogState, getEventsCollectionRef
    });

    // We no longer need the local reset logic, as it's handled elsewhere
    // const [confirmReset, setConfirmReset] = useState(false);
    // const handleResetAllData = ...

    // 3. Return all the state and functions, including the new ones from the personal goal hook
    return {
        ...authState,
        ...settingsState,
        ...eventLogState,
        ...sessionState,
        ...dataManagementState,
        ...tasksState,
        ...personalGoalState, // This includes handleEmergencyUnlock, isGoalActive, etc.
    };
};
