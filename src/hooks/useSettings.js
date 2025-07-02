import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as Sentry from '@sentry/react';

export const useSettings = (userId, isAuthReady) => {
    const defaultSettings = {
        submissivesName: '',
        keyholderName: '',
        keyholderPasswordHash: null,
        requiredKeyholderDurationSeconds: null,
        goalDurationSeconds: null,
        rewards: [],
        punishments: [],
        isTrackingAllowed: true,
        eventDisplayMode: 'kinky',
    };

    const [settings, setSettings] = useState(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const [submissivesNameInput, setSubmissivesNameInput] = useState('');
    const [nameMessage, setNameMessage] = useState('');

    const [keyholderMessage, setKeyholderMessage] = useState('');
    const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);

    // Load settings from Firestore on mount
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
                if (docSnap.exists()) {
                    const loadedSettings = { ...defaultSettings, ...docSnap.data() };
                    setSettings(loadedSettings);
                    setSubmissivesNameInput(loadedSettings.submissivesName || '');
                } else {
                    await setDoc(userDocRef, defaultSettings, { merge: true });
                    setSettings(defaultSettings);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                Sentry.captureException?.(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [isAuthReady, userId]);

    const saveSettingsToFirestore = useCallback(async (settingsToSave) => {
        if (!isAuthReady || !userId) return;
        const docRef = doc(db, "users", userId);
        try {
            await setDoc(docRef, settingsToSave, { merge: true });
            setSettings(prev => ({ ...prev, ...settingsToSave }));
        } catch (error) {
            console.error("Error saving settings to Firestore:", error);
        }
    }, [isAuthReady, userId]);

    const handleSubmissivesNameInputChange = useCallback((event) => {
        setSubmissivesNameInput(event.target.value);
    }, []);

    const handleSetSubmissivesName = useCallback(async () => {
        if (!isAuthReady || !userId) {
            setNameMessage("Authentication is not ready.");
            setTimeout(() => setNameMessage(''), 3000);
            return;
        }
        const trimmedName = submissivesNameInput.trim();
        if (!trimmedName) {
            setNameMessage("Name cannot be empty.");
            setTimeout(() => setNameMessage(''), 3000);
            return;
        }
        await saveSettingsToFirestore({ submissivesName: trimmedName });
        setNameMessage("Submissive's name has been set!");
        setTimeout(() => setNameMessage(''), 3000);
    }, [isAuthReady, userId, submissivesNameInput, saveSettingsToFirestore]);

    const handleSetKeyholder = useCallback(async (name) => {
        const khName = name.trim();
        if (!khName) {
            setKeyholderMessage('Keyholder name cannot be empty.');
            return null;
        }
        const hash = await generateHash(userId + khName);
        const preview = hash.substring(0, 8).toUpperCase();

        await saveSettingsToFirestore({
            keyholderName: khName,
            keyholderPasswordHash: hash,
            requiredKeyholderDurationSeconds: null
        });

        setIsKeyholderModeUnlocked(false);
        setKeyholderMessage(`Keyholder "${khName}" set. Password preview: ${preview}`);
        return preview;
    }, [userId, saveSettingsToFirestore]);

    const handleClearKeyholder = useCallback(async () => {
        await saveSettingsToFirestore({
            keyholderName: '',
            keyholderPasswordHash: null,
            requiredKeyholderDurationSeconds: null
        });
        setIsKeyholderModeUnlocked(false);
        setKeyholderMessage('Keyholder data cleared.');
    }, [saveSettingsToFirestore]);

    const handleUnlockKeyholderControls = useCallback(async (enteredPasswordPreview) => {
        if (!settings.keyholderPasswordHash) {
            setKeyholderMessage('Keyholder not fully set up.');
            return false;
        }
        const expectedPreview = settings.keyholderPasswordHash.substring(0, 8).toUpperCase();
        if (enteredPasswordPreview.toUpperCase() === expectedPreview) {
            setIsKeyholderModeUnlocked(true);
            setKeyholderMessage('Keyholder controls unlocked.');
            return true;
        }
        setKeyholderMessage('Incorrect Keyholder password.');
        return false;
    }, [settings.keyholderPasswordHash]);

    const handleLockKeyholderControls = useCallback(() => {
        setIsKeyholderModeUnlocked(false);
        setKeyholderMessage('Keyholder controls locked.');
    }, []);

    const handleSetRequiredDuration = useCallback(async (durationInSeconds) => {
        const newDuration = Number(durationInSeconds);
        if (!isNaN(newDuration) && newDuration >= 0) {
            await saveSettingsToFirestore({ requiredKeyholderDurationSeconds: newDuration });
            setKeyholderMessage('Required duration updated.');
            return true;
        }
        return false;
    }, [saveSettingsToFirestore]);

    const handleSetGoalDuration = useCallback(async (newDurationInSeconds) => {
        const newDuration = newDurationInSeconds === null ? null : Number(newDurationInSeconds);
        if (newDuration === null || (!isNaN(newDuration) && newDuration >= 0)) {
            await saveSettingsToFirestore({ goalDurationSeconds: newDuration });
            return true;
        }
        return false;
    }, [saveSettingsToFirestore]);

    const handleAddReward = useCallback(async ({ timeSeconds = 0, other = '' }) => {
        const newReward = { id: crypto.randomUUID(), timeSeconds: timeSeconds > 0 ? timeSeconds : null, other: other.trim() };
        const updatedRewards = [...(settings.rewards || []), newReward];
        let newRequired = settings.requiredKeyholderDurationSeconds;
        if (timeSeconds > 0 && newRequired !== null) {
            newRequired = Math.max(0, newRequired - timeSeconds);
        }
        await saveSettingsToFirestore({
            rewards: updatedRewards,
            requiredKeyholderDurationSeconds: newRequired
        });
    }, [settings.rewards, settings.requiredKeyholderDurationSeconds, saveSettingsToFirestore]);

    const handleAddPunishment = useCallback(async ({ timeSeconds = 0, other = '' }) => {
        const newPunishment = { id: crypto.randomUUID(), timeSeconds: timeSeconds > 0 ? timeSeconds : null, other: other.trim() };
        const updatedPunishments = [...(settings.punishments || []), newPunishment];
        const newRequired = (settings.requiredKeyholderDurationSeconds || 0) + (timeSeconds > 0 ? timeSeconds : 0);
        await saveSettingsToFirestore({
            punishments: updatedPunishments,
            requiredKeyholderDurationSeconds: newRequired
        });
    }, [settings.punishments, settings.requiredKeyholderDurationSeconds, saveSettingsToFirestore]);

    const handleSetEventDisplayMode = useCallback(async (mode) => {
        if (mode === 'kinky' || mode === 'vanilla') {
            await saveSettingsToFirestore({ eventDisplayMode: mode });
        }
    }, [saveSettingsToFirestore]);

    const handleSetTrackingAllowed = useCallback(async (allowed) => {
        await saveSettingsToFirestore({ isTrackingAllowed: allowed });
    }, [saveSettingsToFirestore]);

    return {
        settings,
        isLoading,
        submissivesNameInput,
        nameMessage,
        keyholderMessage,
        isKeyholderModeUnlocked,
        handleSubmissivesNameInputChange,
        handleSetSubmissivesName,
        handleSetKeyholder,
        handleClearKeyholder,
        handleUnlockKeyholderControls,
        handleLockKeyholderControls,
        handleSetRequiredDuration,
        handleSetGoalDuration,
        handleAddReward,
        handleAddPunishment,
        handleSetEventDisplayMode,
        handleSetTrackingAllowed,
        saveSettingsToFirestore
    };
};
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

  const handleSetEventDisplayMode = useCallback((mode) => {
    updateSettings(prev => ({ ...prev, eventDisplayMode: mode }));
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    setSettings: updateSettings,
    savedSubmissivesName: settings.submissivesName,
    submissivesNameInput,
    handleSubmissivesNameInputChange,
    handleSetSubmissivesName,
    nameMessage,
    eventDisplayMode: settings.eventDisplayMode,
    handleSetEventDisplayMode,
  };
}