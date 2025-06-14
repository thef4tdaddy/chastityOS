import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { hashSHA256 } from '../utils/hash.js';

const useSettings = (currentUser) => {
  // --- STATE MANAGEMENT ---
  // A single settings object to hold all user preferences.
  const [settings, setSettings] = useState({
    username: '',
    keyholderName: '',
    keyholderPasswordHash: null,
    requiredKeyholderDurationSeconds: null,
    goalDurationSeconds: null,
    rewards: [],
    punishments: [],
    isTrackingAllowed: true,
    eventDisplayMode: 'kinky', // 'kinky' or 'vanilla'
    enableSessionManagement: true,
    enableHistoryTracking: true,
    enableWearerReview: false,
    enableKeyholderReview: false,
    personalGoal: 0,
    displayOption: 'both',
  });
  const [loading, setLoading] = useState(true);

  // State for UI messages and inputs
  const [nameMessage, setNameMessage] = useState('');
  const [keyholderMessage, setKeyholderMessage] = useState('');
  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);

  // --- DATA PERSISTENCE ---

  // A single function to save any part of the settings object to Firestore.
  const saveSettingsToFirestore = useCallback(async (settingsToSave) => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      // We use setDoc with merge:true to only update the fields that have changed.
      await setDoc(userRef, { settings: settingsToSave }, { merge: true });
    } catch (error) {
      console.error("Error saving settings to Firestore:", error);
    }
  }, [currentUser]);


  // Effect to listen for real-time settings changes from Firestore.
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().settings) {
        // Merge fetched settings with default values to prevent missing fields
        setSettings(prevSettings => ({ ...prevSettings, ...docSnap.data().settings }));
      }
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [currentUser]);


  // --- HANDLERS AND LOGIC ---

  // Updates the username/submissive name
  const handleSetUsername = useCallback(async (newName) => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
          setNameMessage("Name cannot be empty.");
          setTimeout(() => setNameMessage(''), 3000);
          return;
      }
      setSettings(prev => ({ ...prev, username: trimmedName }));
      await saveSettingsToFirestore({ username: trimmedName });
      setNameMessage("Submissive's name has been set!");
      setTimeout(() => setNameMessage(''), 3000);
  }, [saveSettingsToFirestore]);

  // Sets up a new keyholder
  const handleSetKeyholder = useCallback(async (name) => {
      const khName = name.trim();
      if (!khName) {
          setKeyholderMessage('Keyholder name cannot be empty.');
          return null;
      }
      const hash = await hashSHA256(currentUser.uid + khName);
      const preview = hash.substring(0, 8).toUpperCase();

      const newKeyholderSettings = {
          keyholderName: khName,
          keyholderPasswordHash: hash,
          requiredKeyholderDurationSeconds: null
      };
      setSettings(prev => ({ ...prev, ...newKeyholderSettings }));
      await saveSettingsToFirestore(newKeyholderSettings);

      setIsKeyholderModeUnlocked(false);
      setKeyholderMessage(`Keyholder "${khName}" set. Password preview: ${preview}`);
      return preview;
  }, [currentUser, saveSettingsToFirestore]);

  // Clears keyholder data
  const handleClearKeyholder = useCallback(async () => {
      const clearedSettings = {
          keyholderName: '',
          keyholderPasswordHash: null,
          requiredKeyholderDurationSeconds: null
      };
      setSettings(prev => ({ ...prev, ...clearedSettings }));
      await saveSettingsToFirestore(clearedSettings);
      setIsKeyholderModeUnlocked(false);
      setKeyholderMessage('Keyholder data cleared.');
  }, [saveSettingsToFirestore]);
  
    // Unlocks keyholder controls
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

  // Locks keyholder controls
  const handleLockKeyholderControls = useCallback(() => {
    setIsKeyholderModeUnlocked(false);
    setKeyholderMessage('Keyholder controls locked.');
  }, []);

  // Sets required duration by keyholder
  const handleSetRequiredDuration = useCallback(async (durationInSeconds) => {
    const newDuration = Number(durationInSeconds);
    if (!isNaN(newDuration) && newDuration >= 0) {
        setSettings(prev => ({ ...prev, requiredKeyholderDurationSeconds: newDuration }));
        await saveSettingsToFirestore({ requiredKeyholderDurationSeconds: newDuration });
        setKeyholderMessage('Required duration updated.');
        return true;
    }
    return false;
  }, [saveSettingsToFirestore]);
  
  // Adds a reward
  const handleAddReward = useCallback(async ({ timeSeconds = 0, other = '' }) => {
    const newReward = { id: crypto.randomUUID(), timeSeconds: timeSeconds > 0 ? timeSeconds : null, other: other.trim() };
    const updatedRewards = [...settings.rewards, newReward];
    let newRequired = settings.requiredKeyholderDurationSeconds;
    if (timeSeconds > 0 && newRequired !== null) {
        newRequired = Math.max(0, newRequired - timeSeconds);
    }
    const updatedSettings = { rewards: updatedRewards, requiredKeyholderDurationSeconds: newRequired };
    setSettings(prev => ({ ...prev, ...updatedSettings }));
    await saveSettingsToFirestore(updatedSettings);
  }, [settings.rewards, settings.requiredKeyholderDurationSeconds, saveSettingsToFirestore]);

  // Adds a punishment
  const handleAddPunishment = useCallback(async ({ timeSeconds = 0, other = '' }) => {
    const newPunishment = { id: crypto.randomUUID(), timeSeconds: timeSeconds > 0 ? timeSeconds : null, other: other.trim() };
    const updatedPunishments = [...settings.punishments, newPunishment];
    const newRequired = (settings.requiredKeyholderDurationSeconds || 0) + (timeSeconds > 0 ? timeSeconds : 0);
    
    const updatedSettings = { punishments: updatedPunishments, requiredKeyholderDurationSeconds: newRequired };
    setSettings(prev => ({ ...prev, ...updatedSettings }));
    await saveSettingsToFirestore(updatedSettings);
  }, [settings.punishments, settings.requiredKeyholderDurationSeconds, saveSettingsToFirestore]);


  // --- RETURN VALUE ---
  // Expose all state and handler functions needed by the UI components
  return {
    settings,
    setSettings,
    saveSettings: saveSettingsToFirestore,
    loading,
    nameMessage,
    keyholderMessage,
    isKeyholderModeUnlocked,
    handleSetUsername,
    handleSetKeyholder,
    handleClearKeyholder,
    handleUnlockKeyholderControls,
    handleLockKeyholderControls,
    handleSetRequiredDuration,
    handleAddReward,
    handleAddPunishment
  };
};

export { useSettings };
