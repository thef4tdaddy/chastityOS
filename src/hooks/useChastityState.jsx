import { useState, useCallback, useEffect } from 'react';
import { serverTimestamp } from 'firebase/firestore';
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
import { sha256 } from '../utils/hash';

export const useChastityState = () => {
  const authState = useAuth();
  const { userId, isAuthReady, googleEmail } = authState;

  const settingsState = useSettings(userId, isAuthReady);
  const { settings, setSettings } = settingsState;

  const getEventsCollectionRef = (uid) => collection(db, 'users', uid, 'events');
  const eventLogState = useEventLog(userId, isAuthReady, getEventsCollectionRef);
  
  // This hook returns a flat object of state values
  const sessionState = useChastitySession(
    userId, isAuthReady, googleEmail, getEventsCollectionRef, eventLogState.fetchEvents
  );
  
  const tasksState = useTasks(userId, isAuthReady);
  
  // FIX: Manually assemble the `session` object that other hooks expect,
  // using the flat data returned from the new `useChastitySession` hook.
  const sessionObjectForHooks = {
      isChastityOn: sessionState.isCageOn,
      chastityStartTimestamp: sessionState.cageOnTime,
      requiredKeyholderDurationSeconds: sessionState.requiredKeyholderDurationSeconds,
      // Add any other session-related fields here if other hooks need them
  };

  const personalGoalState = usePersonalGoal({
    userId,
    settings,
    setSettings,
    session: sessionObjectForHooks, // Pass the correctly assembled object
  });

  const dataManagementState = useDataManagement({
    userId, isAuthReady, userEmail: googleEmail, settings: settings,
    session: sessionObjectForHooks, // Pass the same object here
    events: eventLogState.events, tasks: tasksState.tasks,
  });

  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
  const [keyholderMessage, setKeyholderMessage] = useState('');

  const generateTempPassword = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSetKeyholderName = useCallback(async (name) => {
    const tempPassword = generateTempPassword();
    const hash = await sha256(tempPassword);
    setSettings(prev => ({ ...prev, keyholderName: name, keyholderPasswordHash: hash }));
    setKeyholderMessage(`Your keyholder password is: ${tempPassword}. This is now the permanent password unless you set a custom one.`);
  }, [setSettings]);

  const handleKeyholderPasswordCheck = useCallback(async (passwordAttempt) => {
    const storedHash = settings?.keyholderPasswordHash;
    if (!storedHash) {
      setKeyholderMessage("Error: No keyholder password is set in the database.");
      return;
    }
    const attemptHash = await sha256(passwordAttempt);
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
    const newHash = await sha256(newPassword);
    setSettings(prev => ({ ...prev, keyholderPasswordHash: newHash }));
    setKeyholderMessage("Permanent password has been updated successfully!");
  }, [setSettings]);

  const lockKeyholderControls = useCallback(() => {
    setIsKeyholderModeUnlocked(false);
    setKeyholderMessage('');
  }, []);

  const keyholderHandlers = useKeyholderHandlers({
    userId,
    tasks: tasksState.tasks,
    addTask: tasksState.addTask,
    updateTask: tasksState.updateTask,
    saveDataToFirestore: sessionState.saveDataToFirestore,
    requiredKeyholderDurationSeconds: sessionState.requiredKeyholderDurationSeconds,
  });

  const handleSubmitForReview = useCallback(async (taskId, note) => {
    if (!tasksState.updateTask) {
      console.error("updateTask function is not available.");
      return;
    }
    await tasksState.updateTask(taskId, {
      status: 'pending_approval',
      submissiveNote: note,
      submittedAt: serverTimestamp()
    });
  }, [tasksState]);

  useEffect(() => {
    const checkOverdueTasks = () => {
      const now = new Date();
      const pendingTasks = tasksState.tasks.filter(t => t.status === 'pending' && t.deadline);

      for (const task of pendingTasks) {
        if (now > task.deadline) {
          console.log(`Task "${task.text}" is overdue. Auto-submitting...`);
          handleSubmitForReview(task.id, 'Automatically submitted: Deadline passed.');
        }
      }
    };
    const intervalId = setInterval(checkOverdueTasks, 30000);
    return () => clearInterval(intervalId);
  }, [tasksState.tasks, handleSubmitForReview]);

  return {
    ...authState,
    ...settingsState,
    ...eventLogState,
    ...sessionState,
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
