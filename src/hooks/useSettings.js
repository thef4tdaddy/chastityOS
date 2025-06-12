// src/hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { generateHash } from '../utils/hash';

export const useSettings = (userId, isAuthReady) => {
    // All settings-related state is now managed here
    const [savedSubmissivesName, setSavedSubmissivesName] = useState('');
    const [submissivesNameInput, setSubmissivesNameInput] = useState('');
    const [nameMessage, setNameMessage] = useState('');

    const [keyholderName, setKeyholderName] = useState('');
    const [keyholderPasswordHash, setKeyholderPasswordHash] = useState(null);
    const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
    const [requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds] = useState(null);
    const [keyholderMessage, setKeyholderMessage] = useState('');

    const [goalDurationSeconds, setGoalDurationSeconds] = useState(null);
    const [rewards, setRewards] = useState([]);
    const [punishments, setPunishments] = useState([]);
    const [isTrackingAllowed, setIsTrackingAllowed] = useState(true);
    const [eventDisplayMode, setEventDisplayMode] = useState('kinky');

    const saveSettingsToFirestore = useCallback(async (settingsToSave) => {
        if (!isAuthReady || !userId) return;
        const docRef = doc(db, "users", userId);
        try {
            await setDoc(docRef, settingsToSave, { merge: true });
        } catch (error) {
            console.error("Error saving settings to Firestore:", error);
        }
    }, [isAuthReady, userId]);

    useEffect(() => {
        if (!isAuthReady || !userId) return;

        const docRef = doc(db, "users", userId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSavedSubmissivesName(data.submissivesName || '');
                setSubmissivesNameInput(data.submissivesName || '');
                setKeyholderName(data.keyholderName || '');
                setKeyholderPasswordHash(data.keyholderPasswordHash || null);
                setRequiredKeyholderDurationSeconds(data.requiredKeyholderDurationSeconds !== undefined ? data.requiredKeyholderDurationSeconds : null);
                setGoalDurationSeconds(data.goalDurationSeconds !== undefined ? data.goalDurationSeconds : null);
                setRewards(data.rewards || []);
                setPunishments(data.punishments || []);
                setIsTrackingAllowed(data.isTrackingAllowed !== undefined ? data.isTrackingAllowed : true);
                setEventDisplayMode(data.eventDisplayMode || 'kinky');
            }
        });

        return () => unsubscribe();
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
        setSavedSubmissivesName(trimmedName);
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
        if (!keyholderPasswordHash) {
            setKeyholderMessage('Keyholder not fully set up.');
            return false;
        }
        const expectedPreview = keyholderPasswordHash.substring(0, 8).toUpperCase();
        if (enteredPasswordPreview.toUpperCase() === expectedPreview) {
            setIsKeyholderModeUnlocked(true);
            setKeyholderMessage('Keyholder controls unlocked.');
            return true;
        }
        setKeyholderMessage('Incorrect Keyholder password.');
        return false;
    }, [keyholderPasswordHash]);

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
        const updatedRewards = [...rewards, newReward];
        let newRequired = requiredKeyholderDurationSeconds;
        if (timeSeconds > 0 && requiredKeyholderDurationSeconds !== null) {
            newRequired = Math.max(0, requiredKeyholderDurationSeconds - timeSeconds);
        }
        await saveSettingsToFirestore({ rewards: updatedRewards, requiredKeyholderDurationSeconds: newRequired });
    }, [rewards, requiredKeyholderDurationSeconds, saveSettingsToFirestore]);

    const handleAddPunishment = useCallback(async ({ timeSeconds = 0, other = '' }) => {
        const newPunishment = { id: crypto.randomUUID(), timeSeconds: timeSeconds > 0 ? timeSeconds : null, other: other.trim() };
        const updatedPunishments = [...punishments, newPunishment];
        const newRequired = (requiredKeyholderDurationSeconds || 0) + (timeSeconds > 0 ? timeSeconds : 0);
        await saveSettingsToFirestore({ punishments: updatedPunishments, requiredKeyholderDurationSeconds: newRequired });
    }, [punishments, requiredKeyholderDurationSeconds, saveSettingsToFirestore]);
    
    // *** RESTORED THIS HANDLER ***
    const handleSetEventDisplayMode = useCallback(async (mode) => {
        if (mode === 'kinky' || mode === 'vanilla') {
            setEventDisplayMode(mode);
            await saveSettingsToFirestore({ eventDisplayMode: mode });
        }
    }, [saveSettingsToFirestore]);

    return {
        savedSubmissivesName,
        submissivesNameInput,
        nameMessage,
        keyholderName,
        isKeyholderModeUnlocked,
        requiredKeyholderDurationSeconds,
        keyholderMessage,
        goalDurationSeconds,
        rewards,
        punishments,
        isTrackingAllowed,
        eventDisplayMode,
        handleSetSubmissivesName,
        handleSubmissivesNameInputChange,
        handleSetKeyholder,
        handleClearKeyholder,
        handleUnlockKeyholderControls,
        handleLockKeyholderControls,
        handleSetRequiredDuration,
        handleSetGoalDuration,
        handleAddReward,
        handleAddPunishment,
        handleSetEventDisplayMode, // Expose the restored handler
        saveSettingsToFirestore 
    };
};
