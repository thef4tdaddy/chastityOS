// src/hooks/usePersonalGoal.js
import { useState, useCallback, useMemo } from 'react';
import { generateSecureHash, verifyHash } from '../utils/hash';

// Generates a simple, memorable backup code
const generateBackupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const usePersonalGoal = ({ setSettings, handleEndChastityNow, settings }) => {
  // State for the form inputs
  const [goalDuration, setGoalDuration] = useState('');
  const [isSelfLocking, setIsSelfLocking] = useState(false); // This is our "Hardcore Mode" checkbox state
  const [selfLockCodeInput, setSelfLockCodeInput] = useState('');
  const [generatedBackupCode, setGeneratedBackupCode] = useState(null);

  /**
   * Sets the personal goal.
   * @param {boolean} isHardcore - The status of the "Hardcore Mode" checkbox.
   * @param {string|null} combination - The user's optional physical lock combination.
   */
  const handleSetPersonalGoal = useCallback(async (isHardcore, combination) => {
    if (!goalDuration || isNaN(parseInt(goalDuration, 10)) || parseInt(goalDuration, 10) <= 0) {
      alert('Please enter a valid number of days for the goal.');
      return;
    }

    const durationInSeconds = parseInt(goalDuration, 10) * 24 * 60 * 60;
    
    // --- Hardcore Mode Logic ---
    let backupCodeHash = null;
    let encodedCombination = null;

    if (isHardcore) {
      // If hardcore mode is on, a backup code is mandatory for emergency unlocks.
      const backupCode = generateBackupCode();
      backupCodeHash = await generateSecureHash(backupCode);
      setGeneratedBackupCode(backupCode); // Store code temporarily to show in modal

      // If the user also provided a physical lock combination, encode and store it.
      if (combination && combination.trim() !== '') {
        encodedCombination = btoa(combination);
      }
    }

    // Save all relevant data to Firestore
    setSettings({
      goalDurationSeconds: durationInSeconds,
      goalSetDate: new Date().toISOString(),
      isHardcoreGoal: isHardcore, // ** THIS IS THE FIX ** Store the checkbox state
      goalBackupCodeHash: backupCodeHash, // Will be null if not hardcore
      selfLockCode: encodedCombination,    // Will be null if not provided
    });

    // Clear inputs after setting the goal
    setGoalDuration('');
    setIsSelfLocking(false);
    setSelfLockCodeInput('');

  }, [goalDuration, setSettings]);

  /**
   * Clears all goal-related data from the settings.
   */
  const handleClearPersonalGoal = useCallback(() => {
    setSettings({
      goalDurationSeconds: 0,
      goalSetDate: null,
      isHardcoreGoal: false, // Explicitly turn off hardcore mode
      goalBackupCodeHash: null,
      selfLockCode: null,
    });
  }, [setSettings]);

  /**
   * Handles the emergency unlock process using the backup code.
   */
  const handleEmergencyUnlock = useCallback(async (providedCode) => {
    if (!settings.goalBackupCodeHash) {
      return { success: false, message: 'No hardcore goal is active.' };
    }
    
    const isCodeValid = await verifyHash(providedCode.toUpperCase(), settings.goalBackupCodeHash);

    if (isCodeValid) {
      let revealedCode = null;
      if (settings.selfLockCode) {
        try { revealedCode = atob(settings.selfLockCode); } catch (e) { console.error(e); }
      }
      
      const reason = `Emergency unlock using backup code. Goal terminated.`;
      handleEndChastityNow(reason); // Ends the session with a note
      handleClearPersonalGoal(); // Clears the goal
      
      return { 
        success: true, 
        message: revealedCode 
          ? `Unlock successful! Your saved combination was: ${revealedCode}`
          : 'Unlock successful! Goal has been cleared.',
        revealedCode: revealedCode 
      };
    } else {
      return { success: false, message: 'Invalid backup code.' };
    }
  }, [settings.goalBackupCodeHash, settings.selfLockCode, handleEndChastityNow, handleClearPersonalGoal]);

  /**
   * Decodes and reveals the self-lock code ONLY if the goal is completed.
   */
  const revealedSelfLockCode = useMemo(() => {
    const isGoalCompleted = settings.isHardcoreGoal && settings.goalDurationSeconds > 0 && settings.goalSetDate && 
                            (new Date(settings.goalSetDate).getTime() + settings.goalDurationSeconds * 1000 < new Date().getTime());
    
    if (isGoalCompleted && settings.selfLockCode) {
      try { return atob(settings.selfLockCode); } catch (e) { return "Error"; }
    }
    return null;
  }, [settings.isHardcoreGoal, settings.goalDurationSeconds, settings.goalSetDate, settings.selfLockCode]);

  return {
    goalDuration,
    setGoalDuration,
    isSelfLocking,
    setIsSelfLocking,
    selfLockCodeInput,
    setSelfLockCodeInput,
    generatedBackupCode,
    setGeneratedBackupCode,
    revealedSelfLockCode,
    handleSetPersonalGoal,
    handleClearPersonalGoal,
    handleEmergencyUnlock,
  };
};
