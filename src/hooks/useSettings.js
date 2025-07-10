import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as Sentry from '@sentry/react';

const defaultSettings = {
  submissivesName: '',
  keyholderName: '',
  rulesText: '',
  isTrackingAllowed: true,
  eventDisplayMode: 'kinky',
  publicProfileEnabled: false,
  publicStatsVisibility: {
    currentStatus: true,
    totals: true,
    arousalChart: true,
    chastityHistory: true,
    sexualEvents: true,
  },
  linkedKeyholderId: '',
};

export function useSettings(userId, isAuthReady) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [submissivesNameInput, setSubmissivesNameInput] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [documentExists, setDocumentExists] = useState(true);

  useEffect(() => {
    if (settings.submissivesName) {
      setSubmissivesNameInput(settings.submissivesName);
    }
  }, [settings.submissivesName]);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }
    const fetchSettings = async () => {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', userId);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().settings) {
          const loadedSettings = { ...defaultSettings, ...docSnap.data().settings };
          setSettings(loadedSettings);
          setSubmissivesNameInput(loadedSettings.submissivesName || '');
        } else {
          console.warn("User document does not exist. Not creating automatically.");
          setDocumentExists(false);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [isAuthReady, userId]);

  const setSettingsOnly = useCallback((value) => {
    if (typeof value === 'function') {
      setSettings(prevState => value(prevState));
    } else {
      setSettings(value);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    if (!isAuthReady || !userId || !documentExists) {
      console.warn("Skipping save because document does not exist.");
      return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
      await setDoc(userDocRef, { settings }, { merge: true });
      console.log("✅ Settings saved to Firestore.");
    } catch (error) {
      console.error("Error saving settings:", error);
      Sentry.captureException(error);
    }
  }, [isAuthReady, userId, documentExists, settings]);

  const handleSubmissivesNameInputChange = (e) => {
    setSubmissivesNameInput(e.target.value);
  };

  const handleSetSubmissivesName = useCallback(() => {
    setSettingsOnly(prev => ({ ...prev, submissivesName: submissivesNameInput }));
    setNameMessage("Name updated successfully!");
    setTimeout(() => setNameMessage(''), 3000);
  }, [submissivesNameInput, setSettingsOnly]);

  const handleSetEventDisplayMode = useCallback((mode) => {
    setSettingsOnly(prev => ({ ...prev, eventDisplayMode: mode }));
  }, [setSettingsOnly]);

  const togglePublicProfileEnabled = useCallback(() => {
    setSettingsOnly(prev => ({
      ...prev,
      publicProfileEnabled: !prev.publicProfileEnabled,
    }));
  }, [setSettingsOnly]);

  const togglePublicStatVisibility = useCallback((key) => {
    setSettingsOnly(prev => ({
      ...prev,
      publicStatsVisibility: {
        ...prev.publicStatsVisibility,
        [key]: !prev.publicStatsVisibility?.[key],
      },
    }));
  }, [setSettingsOnly]);

  return {
    settings,
    isLoading,
    setSettings: setSettingsOnly,
    saveSettings,
    savedSubmissivesName: settings.submissivesName,
    submissivesNameInput,
    handleSubmissivesNameInputChange,
    handleSetSubmissivesName,
    nameMessage,
    eventDisplayMode: settings.eventDisplayMode,
    handleSetEventDisplayMode,
    publicProfileEnabled: settings.publicProfileEnabled,
    publicStatsVisibility: settings.publicStatsVisibility,
    togglePublicProfileEnabled,
    togglePublicStatVisibility,
    linkedKeyholderId: settings.linkedKeyholderId,
  };
}