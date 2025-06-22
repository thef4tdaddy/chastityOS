import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as Sentry from '@sentry/react';

const defaultSettings = {
  submissivesName: '',
  keyholderName: '',
  isTrackingAllowed: true, // Default to true
  eventDisplayMode: 'kinky', // Default display mode
};

export function useSettings(userId, isAuthReady) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [submissivesNameInput, setSubmissivesNameInput] = useState('');
  const [nameMessage, setNameMessage] = useState('');

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
          // Ensure default settings are merged with loaded settings
          const loadedSettings = { ...defaultSettings, ...docSnap.data().settings };
          setSettings(loadedSettings);
          setSubmissivesNameInput(loadedSettings.submissivesName || '');
        } else {
          // If no settings exist, create them with the default values
          await setDoc(userDocRef, { settings: defaultSettings }, { merge: true });
          setSettings(defaultSettings);
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

  const saveSettingsToFirestore = useCallback(async (newSettingsObject) => {
    if (!isAuthReady || !userId) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      await setDoc(userDocRef, { settings: newSettingsObject }, { merge: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      Sentry.captureException(error);
    }
  }, [isAuthReady, userId]);

  const updateSettings = useCallback((value) => {
    if (typeof value === 'function') {
      setSettings(prevState => {
        const newState = value(prevState);
        saveSettingsToFirestore(newState);
        return newState;
      });
    } else {
      setSettings(value);
      saveSettingsToFirestore(value);
    }
  }, [saveSettingsToFirestore]);

  const handleSubmissivesNameInputChange = (e) => {
    setSubmissivesNameInput(e.target.value);
  };

  const handleSetSubmissivesName = useCallback(() => {
    updateSettings(prev => ({ ...prev, submissivesName: submissivesNameInput }));
    setNameMessage("Name updated successfully!");
    setTimeout(() => setNameMessage(''), 3000);
  }, [submissivesNameInput, updateSettings]);

  return { 
    settings, 
    isLoading,
    setSettings: updateSettings,
    savedSubmissivesName: settings.submissivesName,
    submissivesNameInput,
    handleSubmissivesNameInputChange,
    handleSetSubmissivesName,
    nameMessage,
    // Explicitly return the tracking and display mode flags
    isTrackingAllowed: settings.isTrackingAllowed,
    eventDisplayMode: settings.eventDisplayMode,
  };
}
