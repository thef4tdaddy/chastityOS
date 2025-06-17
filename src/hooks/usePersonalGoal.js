// src/hooks/usePersonalGoal.js
import { useState, useEffect } from 'react';

// This hook encapsulates all the UI logic for the PersonalGoalSection
export const usePersonalGoal = ({
  goalDurationSeconds,
  handleSetGoalDuration,
  isSelfLocked,
  handleSetSelfLock,
  handleClearSelfLock,
}) => {
  // State for the form input fields
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  
  // State for the self-lock UI
  const [isSelfLockEnabled, setIsSelfLockEnabled] = useState(false);
  const [selfLockCombination, setSelfLockCombination] = useState('');

  // Effect to sync the input fields when the main goal duration changes
  useEffect(() => {
    if (goalDurationSeconds !== null && goalDurationSeconds > 0) {
      const d = Math.floor(goalDurationSeconds / 86400);
      const h = Math.floor((goalDurationSeconds % 86400) / 3600);
      const m = Math.floor((goalDurationSeconds % 3600) / 60);
      setDays(d.toString());
      setHours(h.toString());
      setMinutes(m.toString());
    } else {
      setDays('');
      setHours('');
      setMinutes('');
    }
  }, [goalDurationSeconds]);

  // Handler for the main "Set/Update" button
  const onSetGoal = () => {
    const totalSeconds = (parseInt(days) || 0) * 86400 + (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
    
    if (isSelfLockEnabled && selfLockCombination.trim()) {
      // Call the parent handler for setting a self-locked goal
      handleSetSelfLock(totalSeconds > 0 ? totalSeconds : null, selfLockCombination);
    } else {
      // Call the parent handler for setting a simple goal
      handleSetGoalDuration(totalSeconds > 0 ? totalSeconds : null);
    }
  };

  // Handler for the "Clear Goal" button
  const onClearGoal = () => {
    if (isSelfLocked) {
      handleClearSelfLock();
    } else {
      handleSetGoalDuration(null);
    }
    // Reset the local form state
    setIsSelfLockEnabled(false);
    setSelfLockCombination('');
  };

  // Return all the state and handlers needed by the component's UI
  return {
    days, setDays,
    hours, setHours,
    minutes, setMinutes,
    isSelfLockEnabled, setIsSelfLockEnabled,
    selfLockCombination, setSelfLockCombination,
    onSetGoal,
    onClearGoal,
  };
};
