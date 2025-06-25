import { useState, useCallback, useEffect } from 'react';
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

  useEffect(() => {
    console.log("[DEBUG] useChastityState: The `tasksState` object contains:", tasksState);
  }, [tasksState]);

  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
  const [keyholderMessage, setKeyholderMessage] = useState('');

  const generateTempPassword = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSetKeyholderName = useCallback(async (name) => {
    const tempPassword = generateTempPassword();
    const hash = await generateSecureHash(tempPassword);
    setSettings(prev => ({ ...prev, keyholderName: name, keyholderPasswordHash: hash }));
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
      setKeyholderMessage('Incorrect password. Please try again.');
    }
  }, [settings?.keyholderPasswordHash]);

  const handleSetPermanentPassword = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      setKeyholderMessage("Password must be at least 6 characters long.");
      return;
    }
    const newHash = await generateSecureHash(newPassword);
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
    updateTask: tasksState.updateTask,
    saveDataToFirestore: sessionState.saveDataToFirestore,
    requiredKeyholderDurationSeconds: sessionState.requiredKeyholderDurationSeconds,
  });

  // --- Submissive Action Handlers ---
  const handleSubmitForReview = useCallback(async (taskId) => {
    if (!tasksState.updateTask) {
      console.error("updateTask function is not available.");
      return;
    }
    await tasksState.updateTask(taskId, { status: 'pending_approval' });
    // --- THIS IS THE FIX ---
    // The dependency array now correctly includes `tasksState`.
  }, [tasksState]);

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
    handleSubmitForReview,
    keyholderName: settings.keyholderName,
  };
};