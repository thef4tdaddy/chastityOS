// src/hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from '../firebase';
import { generateSecureHash, verifyHash } from '../utils/hash';

export const useSettings = (userId, isAuthReady) => {
    // State for various settings
    const [savedSubmissivesName, setSavedSubmissivesName] = useState('');
    const [keyholderName, setKeyholderName] = useState('');
    const [keyholderPassword, setKeyholderPassword] = useState('');
    const [keyholderPasswordHash, setKeyholderPasswordHash] = useState(null);
    const [keyholderPasswordMessage, setKeyholderPasswordMessage] = useState('');
    const [passwordAcknowledged, setPasswordAcknowledged] = useState(false);
    const [requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds] = useState(null);
    const [goalDurationSeconds, setGoalDurationSeconds] = useState(null);
    const [goalSetDate, setGoalSetDate] = useState(null);
    const [goalBackupCodeHash, setGoalBackupCodeHash] = useState(null);
    const [isHardcoreGoal, setIsHardcoreGoal] = useState(false);
    const [selfLockCode, setSelfLockCode] = useState(null); // Add state for the self-lock code
    const [rewards, setRewards] = useState([]);
    const [punishments, setPunishments] = useState([]);
    const [eventDisplayMode, setEventDisplayMode] = useState('kinky');
    const [nameMessage, setNameMessage] = useState('');
    const [isTrackingAllowed, setIsTrackingAllowed] = useState(true);

    const setSettings = useCallback(async (newSettings) => {
        if (!isAuthReady || !userId) return;
        const docRef = doc(db, "users", userId);
        try {
            await setDoc(docRef, newSettings, { merge: true });
        } catch (error) {
            console.error("Error updating settings:", error);
        }
    }, [isAuthReady, userId]);

    const handleSetKeyholderPassword = useCallback(async () => {
        if (keyholderPassword.length < 6) {
            setKeyholderPasswordMessage('Password must be at least 6 characters long.');
            setTimeout(() => setKeyholderPasswordMessage(''), 3000);
            return;
        }
        try {
            const hash = await generateSecureHash(keyholderPassword);
            await setSettings({ keyholderPasswordHash: hash, passwordAcknowledged: true });
            setKeyholderPassword('');
            setKeyholderPasswordMessage('Keyholder password set successfully.');
            setTimeout(() => setKeyholderPasswordMessage(''), 3000);
        } catch (error) {
            console.error("Error setting keyholder password:", error);
            setKeyholderPasswordMessage('Failed to set password. See console for details.');
            setTimeout(() => setKeyholderPasswordMessage(''), 3000);
        }
    }, [keyholderPassword, setSettings]);

    const handleAcknowledgePassword = useCallback(() => {
        setSettings({ passwordAcknowledged: true });
    }, [setSettings]);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const docRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSavedSubmissivesName(data.savedSubmissivesName || '');
                setKeyholderName(data.keyholderName || '');
                setKeyholderPasswordHash(data.keyholderPasswordHash || null);
                setPasswordAcknowledged(data.passwordAcknowledged || false);
                setRequiredKeyholderDurationSeconds(data.requiredKeyholderDurationSeconds || null);
                setGoalDurationSeconds(data.goalDurationSeconds || null);
                setGoalSetDate(data.goalSetDate || null);
                setGoalBackupCodeHash(data.goalBackupCodeHash || null);
                setIsHardcoreGoal(data.isHardcoreGoal || false);
                setSelfLockCode(data.selfLockCode || null); // **THE FIX IS HERE**
                setRewards(data.rewards || []);
                setPunishments(data.punishments || []);
                setEventDisplayMode(data.eventDisplayMode || 'kinky');
                setIsTrackingAllowed(data.isTrackingAllowed !== false);
            }
        }, (error) => {
            console.error("Error fetching settings:", error);
        });
        return () => unsubscribe();
    }, [isAuthReady, userId]);

    const isGoalActive = goalDurationSeconds > 0 && goalSetDate;
    const goalEndDate = isGoalActive ? new Date(new Date(goalSetDate).getTime() + goalDurationSeconds * 1000) : null;
    const isGoalCompleted = isGoalActive && goalEndDate < new Date();

    return {
        savedSubmissivesName, setSavedSubmissivesName,
        keyholderName, setKeyholderName,
        keyholderPassword, setKeyholderPassword,
        keyholderPasswordHash,
        keyholderPasswordMessage,
        passwordAcknowledged,
        requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds,
        goalDurationSeconds,
        goalSetDate,
        goalBackupCodeHash,
        isGoalActive,
        isHardcoreGoal,
        selfLockCode, // And returned here
        goalEndDate,
        isGoalCompleted,
        rewards, setRewards,
        punishments, setPunishments,
        eventDisplayMode, setEventDisplayMode,
        nameMessage, setNameMessage,
        isTrackingAllowed, setIsTrackingAllowed,
        setSettings,
        handleSetKeyholderPassword,
        handleAcknowledgePassword,
        verifyHash,
    };
};
