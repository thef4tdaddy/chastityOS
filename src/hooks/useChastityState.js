import { createContext, useState, useEffect } from 'react';
import useChastitySession from './useChastitySession';
import useEventLog from './useEventLog';
import useSettings from './useSettings';
import useDataManagement from './useDataManagement';
import { hashSHA256 } from '../utils/hash';

// Export the context so other components can use it
export const ChastityOSContext = createContext();

export const ChastityOSProvider = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [nameMessage, setNameMessage] = useState('');
  const [eventLogMessage, setEventLogMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
  const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');
  const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);

  const { chastityState, setChastityState, loading, setLoading, initialCheckComplete } = useChastitySession(currentUser, isRestoring);
  const { sexualEventsLog, setSexualEventsLog, logEvent, deleteEvent } = useEventLog(currentUser);
  const { settings, setSettings, saveSettings } = useSettings(currentUser);

  useEffect(() => {
    if (initialCheckComplete) {
      setIsAuthReady(true);
    }
  }, [initialCheckComplete]);

  const {
    handleExportJSON,
    handleImportJSON,
    handleResetAllData,
    handleExportTextReport,
    handleExportTrackerCSV,
    handleExportEventLogCSV,
    handleInitiateRestoreFromId,
    handleConfirmRestoreFromId,
    handleCancelRestoreFromId,
    handleRestoreUserIdInputChange,
  } = useDataManagement({
    currentUser,
    setCurrentUser,
    chastityState,
    setChastityState,
    sexualEventsLog,
    setSexualEventsLog,
    settings,
    setSettings,
    setNameMessage,
    setEventLogMessage,
    confirmReset,
    setConfirmReset,
    isRestoring,
    setIsRestoring,
    restoreUserIdInput,
    setRestoreUserIdInput,
    restoreFromIdMessage,
    setRestoreFromIdMessage,
    showRestoreFromIdPrompt,
    setShowRestoreFromIdPrompt,
  });

  const value = {
    isAuthReady,
    currentUser,
    setCurrentUser,
    chastityState,
    setChastityState,
    sexualEventsLog,
    logEvent,
    deleteEvent,
    settings,
    setSettings,
    saveSettings,
    nameMessage,
    setNameMessage,
    eventLogMessage,
    setEventLogMessage,
    loading,
    setLoading,
    handleExportJSON,
    handleImportJSON,
    handleResetAllData,
    confirmReset,
    setConfirmReset,
    handleExportTextReport,
    handleExportTrackerCSV,
    handleExportEventLogCSV,
    isRestoring,
    setIsRestoring,
    restoreUserIdInput,
    handleRestoreUserIdInputChange,
    handleInitiateRestoreFromId,
    restoreFromIdMessage,
    showRestoreFromIdPrompt,
    handleConfirmRestoreFromId,
    handleCancelRestoreFromId,
    hashSHA256,
    chastityHistory: chastityState.chastityHistory,
  };

  return (
    <ChastityOSContext.Provider value={value}>
      {children}
    </ChastityOSContext.Provider>
  );
};
