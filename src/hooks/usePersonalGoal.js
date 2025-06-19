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

  const handleSetPersonalGoal = useCallback(async (isHardcore, combination) => {
    if (!goalDuration || isNaN(parseInt(goalDuration, 10)) || parseInt(goalDuration, 10) <= 0) {
      alert('Please enter a valid number of days for the goal.');
      return;
    }

    const durationInSeconds = parseInt(goalDuration, 10) * 24 * 60 * 60;
    
    let backupCodeHash = null;
    let encodedCombination = null;

    if (isHardcore) {
      const backupCode = generateBackupCode();
      backupCodeHash = await generateSecureHash(backupCode);
      setGeneratedBackupCode(backupCode); 

      if (combination && combination.trim() !== '') {
        encodedCombination = btoa(combination);
      }
    }

    setSettings({
      goalDurationSeconds: durationInSeconds,
      goalSetDate: new Date().toISOString(),
      isHardcoreGoal: isHardcore,
      goalBackupCodeHash: backupCodeHash,
      selfLockCode: encodedCombination,
    });

    setGoalDuration('');
    setIsSelfLocking(false);
    setSelfLockCodeInput('');

  }, [goalDuration, setSettings]);

  const handleClearPersonalGoal = useCallback(() => {
    setSettings({
      goalDurationSeconds: 0,
      goalSetDate: null,
      isHardcoreGoal: false,
      goalBackupCodeHash: null,
      selfLockCode: null,
    });
  }, [setSettings]);

  const handleEmergencyUnlock = useCallback(async (providedCode) => {
    if (!settings.goalBackupCodeHash) {
      return { success: false, message: 'No hardcore goal is active.' };
    }
    
    const isCodeValid = await verifyHash(providedCode.toUpperCase(), settings.goalBackupCodeHash);

    if (isCodeValid) {
      let revealedCode = null;
      if (settings.selfLockCode) {
        try { revealedCode = atob(settings.selfLockCode); } catch (error) { console.error("Failed to decode self-lock code during emergency unlock:", error); }
      }
      
      const reason = `Hardcore Goal terminated early using backup code.`;
      handleEndChastityNow(reason);
      handleClearPersonalGoal();
      
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

  const revealedSelfLockCode = useMemo(() => {
    const isGoalCompleted = settings.isHardcoreGoal && settings.goalDurationSeconds > 0 && settings.goalSetDate && 
                            (new Date(settings.goalSetDate).getTime() + settings.goalDurationSeconds * 1000 < new Date().getTime());
    
    if (isGoalCompleted && settings.selfLockCode) {
      try { 
        return atob(settings.selfLockCode); 
      } catch (error) { 
        // FIX: The unused variable 'e' is now 'error' and is logged to the console.
        console.error("Failed to decode self-lock code on goal completion:", error);
        return "Error"; 
      }
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
