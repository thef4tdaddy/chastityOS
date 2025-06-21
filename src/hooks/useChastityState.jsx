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
  const personalGoalState = usePersonalGoal({ userId, isAuthReady, settings: settings });
  const dataManagementState = useDataManagement({
    userId, isAuthReady, userEmail: googleEmail, settings: settings,
    session: sessionState, events: eventLogState.events, tasks: tasksState.tasks,
  });

  // --- Keyholder Setup Logic with Permanent Password ---
  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
  const [keyholderMessage, setKeyholderMessage] = useState('');
  
  const generateTempPassword = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSetKeyholderName = useCallback(async (name) => {
    const tempPassword = generateTempPassword();
    const hash = await generateSecureHash(tempPassword);
    
    // Save the keyholder's name AND the new password hash to the database.
    setSettings(prev => ({
      ...prev,
      keyholderName: name,
      keyholderPasswordHash: hash,
    }));
    
    setKeyholderMessage(`Your keyholder password is: ${tempPassword}. This is now the permanent password unless you set a custom one.`);

  }, [setSettings]);

  const handleKeyholderPasswordCheck = useCallback(async (passwordAttempt) => {
    // Check against the password hash stored in the main settings.
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
      setKeyholderMessage('Incorrect password. Please try again.');
    }
  }, [settings?.keyholderPasswordHash]);

  // --- New function to set a custom permanent password ---
  const handleSetPermanentPassword = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      setKeyholderMessage("Password must be at least 6 characters long.");
      return;
    }
    const newHash = await generateSecureHash(newPassword);
    // Overwrite the old hash with the new one.
    setSettings(prev => ({ ...prev, keyholderPasswordHash: newHash }));
    setKeyholderMessage("Permanent password has been updated successfully!");
  }, [setSettings]);

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
    handleSetPermanentPassword, // Return the new function
    lockKeyholderControls,
    keyholderName: settings.keyholderName,
  };
};
