import { createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';
import { useEventLog } from './useEventLog';
import { useChastitySession } from './useChastitySession';
import { useTasks } from './useTasks';
import { usePersonalGoal } from './usePersonalGoal';
import { useDataManagement } from './useDataManagement';
import { db } from '../firebase';
import { collection } from 'firebase/firestore';
import { useKeyholderHandlers } from './chastity/keyholderHandlers';
import { useKeyholderSetup } from './useKeyholderSetup'; // Import the keyholder setup hook

const ChastityStateContext = createContext(null);

export const useChastityState = () => {
  const authState = useAuth();
  const { userId, isAuthReady, googleEmail } = authState;

  const getEventsCollectionRef = (uid) => collection(db, 'users', uid, 'events');

  const settingsState = useSettings(userId, isAuthReady);
  const eventLogState = useEventLog(userId, isAuthReady, getEventsCollectionRef);
  const sessionState = useChastitySession(userId, isAuthReady, googleEmail, getEventsCollectionRef, eventLogState.fetchEvents);
  const tasksState = useTasks(userId, isAuthReady);
  const personalGoalState = usePersonalGoal({
    userId,
    isAuthReady,
    chastityDays: sessionState.chastityDays,
    lastCompletedDate: sessionState.lastCompletedDate,
  });
  const dataManagementState = useDataManagement({
    userId,
    isAuthReady,
    userEmail: googleEmail,
    settings: settingsState.settings,
    session: sessionState.session,
    events: eventLogState.events,
    tasks: tasksState.tasks,
  });
  const keyholderSetupState = useKeyholderSetup(); // Call the keyholder setup hook

  // Call the hook to create the handler functions
  const keyholderHandlers = useKeyholderHandlers({
    ...authState,
    ...settingsState,
    ...sessionState,
    ...tasksState,
    ...keyholderSetupState, // Pass the setup state and setters to the handlers
  });

  // Return the handlers so the rest of the app can use them
  return {
    ...authState,
    ...settingsState,
    ...eventLogState,
    ...sessionState,
    ...tasksState,
    ...personalGoalState,
    ...dataManagementState,
    ...keyholderSetupState, // Return the keyholder setup state
    ...keyholderHandlers,
  };
};

export const ChastityStateProvider = ({ children }) => {
  const state = useChastityState();
  return <ChastityStateContext.Provider value={state}>{children}</ChastityStateContext.Provider>;
};

export const useSharedState = () => useContext(ChastityStateContext);
