import { useState, useCallback } from 'react';
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
import { generateSecureHash } from '../utils/hash';

export const useChastityState = () => {
  const authState = useAuth();
  const { userId, isAuthReady, googleEmail } = authState;

  const settingsState = useSettings(userId, isAuthReady);
  // Fix: Destructure the setSettings function to provide a stable dependency.
  const { setSettings } = settingsState;
  
  const getEventsCollectionRef = (uid) => collection(db, 'users', uid, 'events');
  const eventLogState = useEventLog(userId, isAuthReady, getEventsCollectionRef);
  const sessionState = useChastitySession(
    userId, isAuthReady, googleEmail, getEventsCollectionRef, eventLogState.fetchEvents
  );
  const tasksState = useTasks(userId, isAuthReady);
  const personalGoalState = usePersonalGoal({ userId, isAuthReady, settings: settingsState.settings });
  const dataManagementState = useDataManagement({
    userId, isAuthReady, userEmail: googleEmail, settings: settingsState.settings,
    session: sessionState, events: eventLogState.events, tasks: tasksState.tasks,
  });

  const [keyholderPasswordHash, setKeyholderPasswordHash] = useState('');
  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
  const [keyholderMessage, setKeyholderMessage] = useState('');
  
  const generateTempPassword = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSetKeyholderName = useCallback(async (name) => {
    // Persistently save the keyholder's name
    // The call now uses the destructured, stable 'setSettings' function.
    setSettings(prev => ({...prev, keyholderName: name}));

    const tempPassword = generateTempPassword();
    const hash = await generateSecureHash(tempPassword);
    setKeyholderPasswordHash(hash);
    
    setKeyholderMessage(`Your keyholder password is: ${tempPassword}. Enter it below to unlock controls.`);

  // The dependency array now correctly lists the stable 'setSettings' function.
  }, [setSettings]);

  const handleKeyholderPasswordCheck = useCallback(async (passwordAttempt) => {
    if (!keyholderPasswordHash) {
      setKeyholderMessage("Error: No password has been generated. Please set the keyholder name again.");
      return;
    }
    const attemptHash = await generateSecureHash(passwordAttempt);
    if (attemptHash === keyholderPasswordHash) {
      setIsKeyholderModeUnlocked(true);
      setKeyholderMessage('Controls are now unlocked.');
    } else {
      setKeyholderMessage('Incorrect password. Please try again.');
    }
  }, [keyholderPasswordHash]);

  const lockKeyholderControls = useCallback(() => {
    setIsKeyholderModeUnlocked(false);
    setKeyholderMessage('');
  }, []);
  
  const keyholderHandlers = useKeyholderHandlers({
    userId,
    addTask: tasksState.addTask,
    saveDataToFirestore: sessionState.saveDataToFirestore,
    requiredKeyholderDurationSeconds: sessionState.requiredKeyholderDurationSeconds,
  });

  return {
    ...authState,
    ...settingsState,
    ...eventLogState,
    ...sessionState,
    ...tasksState,
    ...personalGoalState,
    ...dataManagementState,
    ...keyholderHandlers,
    isKeyholderModeUnlocked,
    keyholderMessage,
    handleSetKeyholderName,
    handleKeyholderPasswordCheck,
    lockKeyholderControls,
    keyholderName: settingsState.settings?.keyholderName,
  };
};
