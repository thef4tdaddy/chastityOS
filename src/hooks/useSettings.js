import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as Sentry from '@sentry/react';

const defaultSettings = {
  submissivesName: '',
  keyholderName: '',
  isTrackingAllowed: true,
  eventDisplayMode: 'kinky',
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
          const loadedSettings = { ...defaultSettings, ...docSnap.data().settings };
          setSettings(loadedSettings);
          setSubmissivesNameInput(loadedSettings.submissivesName || '');
        } else {
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

  // This is the generic settings updater function that handles both
  // direct objects and functional updates.
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
    // This handler now uses the generic 'updateSettings' function
    updateSettings(prev => ({ ...prev, submissivesName: submissivesNameInput }));
    setNameMessage("Name updated successfully!");
    setTimeout(() => setNameMessage(''), 3000);
  }, [submissivesNameInput, updateSettings]);

  return { 
    settings, 
    isLoading,
    // Fix: Restore the setSettings function to the return object
    setSettings: updateSettings,
    savedSubmissivesName: settings.submissivesName,
    submissivesNameInput,
    handleSubmissivesNameInputChange,
    handleSetSubmissivesName,
    nameMessage,
  };
}
