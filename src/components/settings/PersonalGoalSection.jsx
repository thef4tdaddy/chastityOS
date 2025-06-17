// src/components/settings/PersonalGoalSection.jsx
import React from 'react';
import { formatElapsedTime } from '../../utils';
import { usePersonalGoal } from '../../hooks/usePersonalGoal'; // Import the new hook

const PersonalGoalSection = (props) => {
  // All the complex logic is now handled by the custom hook
  const {
    days, setDays,
    hours, setHours,
    minutes, setMinutes,
    isSelfLockEnabled, setIsSelfLockEnabled,
    selfLockCombination, setSelfLockCombination,
    onSetGoal,
    onClearGoal,
  } = usePersonalGoal(props);
  
  // Destructure the remaining props needed directly by the view
  const {
    goalDurationSeconds,
    isAuthReady,
    isSelfLocked,
    selfLockMessage,
    onAcknowledgeBackupCode
  } = props;

  const hasTimeInput = parseInt(days) > 0 || parseInt(hours) > 0 || parseInt(minutes) > 0;

  return (
    <div className="personal-goal-section">
      <h3>Personal Chastity Goal</h3>
      <p className="text-sm mb-4">
        Set a personal time goal. To take it further, enable Hardcore Mode to lock yourself in.
      </p>
      
      {isSelfLocked && (
        <div className="locked-state-message">
          A self-lock goal is currently active for <strong>{formatElapsedTime(goalDurationSeconds)}</strong>. Controls are disabled until the goal is complete.
        </div>
      )}
      
      {goalDurationSeconds > 0 && !isSelfLocked && (
        <p className="current-goal-message">
          Current Goal: <strong>{formatElapsedTime(goalDurationSeconds)}</strong>
        </p>
      )}

      <fieldset disabled={isSelfLocked}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div><label htmlFor="goalDays">Days</label><input type="number" id="goalDays" value={days} onChange={(e) => setDays(e.target.value)} placeholder="0" /></div>
          <div><label htmlFor="goalHours">Hours</label><input type="number" id="goalHours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" /></div>
          <div><label htmlFor="goalMinutes">Minutes</label><input type="number" id="goalMinutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" /></div>
        </div>

        <div className="self-lock-toggle">
            <label htmlFor="selfLockEnable">Enable Self-Lock (Hardcore Mode)</label>
            <input id="selfLockEnable" type="checkbox" checked={isSelfLockEnabled} onChange={(e) => setIsSelfLockEnabled(e.target.checked)} />
        </div>

        {isSelfLockEnabled && (
            <div className="self-lock-input-box">
                <h4>Set Lock Combination</h4>
                <p className="text-xs mb-3">Enter the combination for your physical lock. This will be hidden and revealed only after your goal is complete.</p>
                <input
                    type="text"
                    value={selfLockCombination}
                    onChange={(e) => setSelfLockCombination(e.target.value)}
                    placeholder="e.g., 12-34-56"
                    className="w-full font-mono tracking-widest"
                />
            </div>
        )}

        <div className="flex space-x-3 mt-4">
          <button type="button" onClick={onSetGoal} disabled={!isAuthReady || !hasTimeInput || (isSelfLockEnabled && !selfLockCombination.trim())}>
            {isSelfLockEnabled ? 'Set Goal & Lock' : 'Set/Update Goal'}
          </button>
          <button type="button" onClick={onClearGoal} disabled={!isAuthReady || !goalDurationSeconds}>
            Clear Goal
          </button>
        </div>
      </fieldset>
      
      {selfLockMessage && (
        <div className="util-box box-red mt-4">
            <h4>IMPORTANT: Backup Code</h4>
            <p className="text-sm">{selfLockMessage}</p>
            <p className="text-xs text-yellow-400 mt-2">This is the **only** time this backup code will be shown. Write it down and keep it somewhere safe.</p>
            <button onClick={onAcknowledgeBackupCode} className="w-full mt-3">I have saved my backup code</button>
        </div>
      )}
    </div>
  );
};

export default PersonalGoalSection;
