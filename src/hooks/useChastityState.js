import { useState, useEffect } from 'react';
import { useChastitySession } from './useChastitySession.js';
import { useEventLog } from './useEventLog.js';
import { useSettings } from './useSettings.js';
import { useDataManagement } from './useDataManagement.js';
import { hashSHA256 } from '../utils/hash.js';

// The hook now accepts currentUser as an argument.
export function useChastityState(currentUser) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  // The local currentUser and setCurrentUser state has been removed.
  const [nameMessage, setNameMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
  const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');
  const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);

  const { chastityState, setChastityState, loading: sessionLoading, initialCheckComplete } = useChastitySession(currentUser, isRestoring);
  const eventLogHook = useEventLog(currentUser?.uid, initialCheckComplete);
  const settingsHook = useSettings(currentUser);
  
  useEffect(() => {
    if (initialCheckComplete) {
      setIsAuthReady(true);
    }
  }, [initialCheckComplete]);

  const dataManagement = useDataManagement({
    currentUser,
    // Note: there is no setCurrentUser here anymore
    chastityState,
    setChastityState,
    sexualEventsLog: eventLogHook.sexualEventsLog,
    setSexualEventsLog: eventLogHook.setSexualEventsLog,
    settings: settingsHook.settings,
    setSettings: settingsHook.setSettings,
    setNameMessage,
    setEventLogMessage: eventLogHook.setEventLogMessage, 
    confirmReset,
    setConfirmReset,
    setIsRestoring,
    restoreUserIdInput,
    setRestoreUserIdInput,
    setRestoreFromIdMessage,
    setShowRestoreFromIdPrompt,
  });

  return {
    isAuthReady,
    // We no longer return currentUser/setCurrentUser from here. It's managed in App.jsx.
    loading: sessionLoading || settingsHook.loading || eventLogHook.isLoadingEvents,
    chastityState,
    setChastityState,
    chastityHistory: chastityState.chastityHistory,
    settings: settingsHook.settings,
    saveSettings: settingsHook.saveSettings,
    nameMessage,
    keyholderMessage: settingsHook.keyholderMessage,
    isKeyholderModeUnlocked: settingsHook.isKeyholderModeUnlocked,
    handleSetUsername: settingsHook.handleSetUsername,
    handleSetKeyholder: settingsHook.handleSetKeyholder,
    handleClearKeyholder: settingsHook.handleClearKeyholder,
    handleUnlockKeyholderControls: settingsHook.handleUnlockKeyholderControls,
    handleLockKeyholderControls: settingsHook.handleLockKeyholderControls,
    handleSetRequiredDuration: settingsHook.handleSetRequiredDuration,
    handleAddReward: settingsHook.handleAddReward,
    handleAddPunishment: settingsHook.handleAddPunishment,
    ...eventLogHook,
    ...dataManagement,
    confirmReset,
    isRestoring,
    restoreUserIdInput,
    restoreFromIdMessage,
    showRestoreFromIdPrompt,
    hashSHA256,
  };
}
