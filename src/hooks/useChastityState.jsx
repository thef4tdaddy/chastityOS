import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '/src/hooks/useAuth.js';
import { useSettings } from '/src/hooks/useSettings.js';
import { useEventLog } from '/src/hooks/useEventLog.js';
import { useChastitySession } from '/src/hooks/useChastitySession.js';
import { useTasks } from '/src/hooks/useTasks.js';
import { usePersonalGoal } from '/src/hooks/usePersonalGoal.js';
import { useDataManagement } from '/src/hooks/useDataManagement.js';
import { db, toggleAnalyticsCollection } from '/src/firebase.js';
import { collection } from 'firebase/firestore';
import { useKeyholderHandlers } from '/src/hooks/chastity/keyholderHandlers.js';
import { generateSecureHash } from '/src/utils/hash.js';

export const useChastityState = () => {
  const authState = useAuth();
  const { userId, isAuthReady, googleEmail } = authState;

  const settingsState = useSettings(userId, isAuthReady);
  const { settings, setSettings, isTrackingAllowed } = settingsState;
  
  const getEventsCollectionRef = (uid) => collection(db, 'users', uid, 'events');
  const eventLogState = useEventLog(userId, isAuthReady, getEventsCollectionRef);

  const sessionState = useChastitySession(
    userId, isAuthReady, googleEmail, getEventsCollectionRef, eventLogState.fetchEvents
  );

  const tasksState = useTasks(userId, isAuthReady);
  const personalGoalState = usePersonalGoal({ userId, isAuthReady, settings: settings });
  const dataManagementState = useDataManagement({
    userId, isAuthReady, userEmail: googleEmail, settings: settings,
    session: sessionState.session,
    events: eventLogState.events, tasks: tasksState.tasks,
  });

  useEffect(() => {
    if (typeof isTrackingAllowed === 'boolean') {
      toggleAnalyticsCollection(isTrackingAllowed);
    }
  }, [isTrackingAllowed]);

  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
  const [keyholderMessage, setKeyholderMessage] = useState('');
  
  const generateTempPassword = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSetKeyholderName = useCallback(async (name) => {
    const tempPassword = generateTempPassword();
    const hash = await generateSecureHash(tempPassword);
    
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
    saveDataToFirestore: sessionState.saveData,
    requiredKeyholderDurationSeconds: sessionState.session?.requiredKeyholderDurationSeconds,
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
    handleSetPermanentPassword,
    lockKeyholderControls,
    keyholderName: settings.keyholderName,
  };
};
