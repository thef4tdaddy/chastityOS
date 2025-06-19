// src/hooks/useTrackerPage.js
import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * A custom hook to manage all the logic for the TrackerPage component.
 * @param {object} props - The props passed down from the main state, e.g., useChastityState.
 * @returns {object} An object containing all the state and handlers needed by the UI.
 */
export const useTrackerPage = (props) => {
    const {
        isCageOn,
        isPaused,
        goalDurationSeconds,
        timeInChastity,
        accumulatedPauseTimeThisSession,
        chastityHistory,
        cageOnTime,
        handleEmergencyUnlock,
    } = props;

    // State for the goal countdown timer
    const [remainingGoalTime, setRemainingGoalTime] = useState(null);
    const goalTimerRef = useRef(null);

    // State for the emergency unlock modal
    const [showEmergencyUnlockModal, setShowEmergencyUnlockModal] = useState(false);
    const [backupCodeInput, setBackupCodeInput] = useState('');
    const [unlockMessage, setUnlockMessage] = useState('');

    // --- FIX: Wrap safe initial values in useMemo to stabilize them ---
    const safeTimeInChastity = useMemo(() => timeInChastity || 0, [timeInChastity]);
    const safeAccumulatedPauseTime = useMemo(() => accumulatedPauseTimeThisSession || 0, [accumulatedPauseTimeThisSession]);
    const safeHistory = useMemo(() => chastityHistory || [], [chastityHistory]);

    // Effect for the goal timer
    useEffect(() => {
        if (isCageOn && !isPaused && goalDurationSeconds && goalDurationSeconds > 0) {
            const calculateRemaining = () => {
                const currentEffectiveChastity = Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime);
                const remaining = goalDurationSeconds - currentEffectiveChastity;
                setRemainingGoalTime(remaining > 0 ? remaining : 0);
            };
            calculateRemaining();
            goalTimerRef.current = setInterval(calculateRemaining, 1000);
        } else {
            if (goalTimerRef.current) clearInterval(goalTimerRef.current);
            if (!isCageOn || !goalDurationSeconds || goalDurationSeconds <= 0) {
                 setRemainingGoalTime(null);
            } else if (isPaused && goalDurationSeconds && goalDurationSeconds > 0) {
                const currentEffectiveChastity = Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime);
                const remaining = goalDurationSeconds - currentEffectiveChastity;
                setRemainingGoalTime(remaining > 0 ? remaining : 0);
            }
        }
        return () => { if (goalTimerRef.current) clearInterval(goalTimerRef.current); };
    }, [isCageOn, isPaused, safeTimeInChastity, safeAccumulatedPauseTime, goalDurationSeconds]);

    // Derived state calculations using useMemo for performance
    const effectiveTimeInChastityForGoal = useMemo(() => Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime), [safeTimeInChastity, safeAccumulatedPauseTime]);
    const mainChastityDisplayTime = useMemo(() => Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime), [safeTimeInChastity, safeAccumulatedPauseTime]);

    const { topBoxLabel, topBoxTime } = useMemo(() => {
        if (isCageOn) {
            return { topBoxLabel: "Cage On Since:", topBoxTime: cageOnTime };
        } else {
            if (safeHistory.length > 0) {
                return { topBoxLabel: "Cage Off Since:", topBoxTime: safeHistory[safeHistory.length - 1].endTime };
            }
            return { topBoxLabel: "Cage Off Since:", topBoxTime: null };
        }
    }, [isCageOn, cageOnTime, safeHistory]); // This dependency array is now correct and stable

    // Handlers for the emergency unlock modal
    const handleOpenUnlockModal = () => {
        setUnlockMessage('');
        setBackupCodeInput('');
        setShowEmergencyUnlockModal(true);
    };

    const handleAttemptEmergencyUnlock = async () => {
        if (!backupCodeInput) return;
        setUnlockMessage('Verifying code...');
        const result = await handleEmergencyUnlock(backupCodeInput);
        setUnlockMessage(result.message);
        if (result.success) {
            setTimeout(() => { setShowEmergencyUnlockModal(false); }, 2500);
        }
    };

    // Return everything the UI component needs
    return {
        // State and derived values
        remainingGoalTime,
        showEmergencyUnlockModal,
        backupCodeInput,
        unlockMessage,
        effectiveTimeInChastityForGoal,
        mainChastityDisplayTime,
        topBoxLabel,
        topBoxTime,

        // Setters and handlers that the UI will use
        setBackupCodeInput,
        handleOpenUnlockModal,
        handleAttemptEmergencyUnlock,
        setShowEmergencyUnlockModal,
    };
};
