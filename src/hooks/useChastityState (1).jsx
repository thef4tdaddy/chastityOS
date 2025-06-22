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
  const { settings, setSettings } = settingsState;
  
  const getEventsCollectionRef = (uid) => collection(db, 'users', uid, 'events');
  const eventLogState = useEventLog(userId, isAuthReady, getEventsCollectionRef);
  const sessionState = useChastitySession(
    userId, isAuthReady, googleEmail, getEventsCollectionRef, eventLogState.fetchEvents
  );
  const tasksState = useTasks(userId, isAuthReady);

  // The personal goal state needs access to settings
  const personalGoalState = usePersonalGoal({ userId, isAuthReady, settings: settings });
  
  // The data management state needs access to all other states
  const dataManagementState = useDataManagement({
    userId, isAuthReady, userEmail: googleEmail, settings: settings,
    session: sessionState, events: eventLogState.events, tasks: tasksState.tasks,
  });

  // --- Keyholder Setup and Authentication Logic ---
  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
  const [keyholderMessage, setKeyholderMessage] = useState('');
  
  // Generates a temporary password for initial setup
  const generateTempPassword = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSetKeyholderName = useCallback(async (name) => {
    const tempPassword = generateTempPassword();
    const hash = await generateSecureHash(tempPassword);
    
    // Save the keyholder's name AND the new password hash to settings.
    setSettings(prev => ({
      ...prev,
      keyholderName: name,
      keyholderPasswordHash: hash,
    }));
    
    setKeyholderMessage(`Your keyholder password is: ${tempPassword}. This is now the permanent password unless you set a custom one.`);

  }, [setSettings]);

  const handleKeyholderPasswordCheck = useCallback(async (passwordAttempt) => {
    const storedHash = settings?.keyholderPasswordHash;
    if (!storedHash) {
      setKeyholderMessage("Error: No keyholder password is set in the database.");
      return;
    }
    const attemptHash = await generateSecureHash(passwordAttempt);
    if (attemptHash === storedHash) {
      setIsKeyholderModeUnlocked(true);
      setKeyholderMessage('Controls are now unlocked.');
    } else {
      setIsKeyholderModeUnlocked(false);
      setKeyholderMessage('Incorrect password. Please try again.');
    }
  }, [settings?.keyholderPasswordHash]);

  // Sets a new custom permanent password
  const handleSetPermanentPassword = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      setKeyholderMessage("Password must be at least 6 characters long.");
      return;
    }
    const newHash = await generateSecureHash(newPassword);
    setSettings(prev => ({ ...prev, keyholderPasswordHash: newHash }));
    setKeyholderMessage("Permanent password has been updated successfully!");
  }, [setSettings]);

  // Locks the keyholder controls and clears any related messages
  const lockKeyholderControls = useCallback(() => {
    setIsKeyholderModeUnlocked(false);
    setKeyholderMessage('');
  }, []);
  
  // Instantiate the keyholder action handlers, passing in necessary functions from other hooks
  const keyholderHandlers = useKeyholderHandlers({
    userId,
    addTask: tasksState.addTask, // <-- This is the crucial connection
    saveDataToFirestore: sessionState.saveData,
    requiredKeyholderDurationSeconds: sessionState.session.requiredKeyholderDurationSeconds,
  });

  // Combine and return all state and functions
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
    handleSetPermanentPassword,
    lockKeyholderControls,
    keyholderName: settings.keyholderName,
  };
};
