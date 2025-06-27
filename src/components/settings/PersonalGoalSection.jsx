import React, { useState, useEffect, useRef } from 'react';
import { FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { formatElapsedTime } from '../../utils';

const PersonalGoalSection = ({
  // Props from the hook
  goalDuration,
  setGoalDuration,
  isSelfLocking,
  setIsSelfLocking,
  selfLockCodeInput,
  setSelfLockCodeInput,
  handleSetPersonalGoal,
  handleClearPersonalGoal,
  generatedBackupCode,
  setGeneratedBackupCode,
  goalError,
  isGoalActive,
  isGoalCompleted,
  isHardcoreGoal,
  goalEndDate,
  revealedSelfLockCode,
  isKhLocked, // Receive the KH lock status from the parent
}) => {
  const [remainingTime, setRemainingTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isGoalActive && !isGoalCompleted && goalEndDate) {
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Date.parse(goalEndDate) - Date.now());
        setRemainingTime(remaining);
      }, 1000);
    } else {
      setRemainingTime(null);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGoalActive, isGoalCompleted, goalEndDate]);

  const onSetGoalClick = () => {
    handleSetPersonalGoal(isSelfLocking, selfLockCodeInput);
  };

  // FIX: This is the crucial UI logic. If a KH lock is active,
  // this renders the disabled message instead of the normal controls.
  if (isKhLocked) {
    return (
      <div className="settings-section">
        <h3 className="settings-section-title">Personal Chastity Goal</h3>
        <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-yellow-700">
          <FaExclamationTriangle className="text-5xl text-yellow-400 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-yellow-300">Feature Disabled</h4>
          <p className="text-md text-purple-200 mt-2">
            Personal goals cannot be set or modified while a Keyholder lock is active.
          </p>
        </div>
      </div>
    );
  }

  if (generatedBackupCode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-lg text-gray-50 border-2 border-yellow-500">
          <FaExclamationTriangle className="text-5xl text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl md:text-2xl font-bold mb-4 text-yellow-300">Hardcore Goal Set!</h3>
          <p className="text-md text-purple-200 mb-4">
            Save this one-time **Backup Code**. It is the ONLY way to unlock early.
          </p>
          <div className="bg-gray-900 p-4 rounded-lg my-4">
            <p className="text-3xl font-mono tracking-widest text-white">{generatedBackupCode}</p>
          </div>
          <p className="text-xs text-yellow-400 mb-6">
            Store it somewhere safe. If you lose this code, you cannot end your session until the goal is met.
          </p>
          <button
            type="button"
            onClick={() => setGeneratedBackupCode(null)}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            I have saved my code and understand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Personal Chastity Goal</h3>
      {goalError && (
        <div className="my-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
          <p>{goalError}</p>
        </div>
      )}
      {isGoalActive ? (
        <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-purple-700">
          {isGoalCompleted ? (
            <div>
              <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-green-300">Goal Completed!</h4>
              {revealedSelfLockCode ? (
                <>
                  <p className="text-md text-purple-200 mt-2">Here is the combination you saved:</p>
                  <div className="bg-gray-900 p-4 rounded-lg my-4">
                    <p className="text-3xl font-mono tracking-widest text-white">{revealedSelfLockCode}</p>
                  </div>
                </>
              ) : (
                <p className="text-md text-purple-200 mt-2">You have reached the end of your goal.</p>
              )}
              <button onClick={handleClearPersonalGoal} className="btn-secondary mt-4">
                Clear Completed Goal
              </button>
            </div>
          ) : (
            <div>
              <p className="text-purple-300 font-semibold">Goal is active!</p>
              {isHardcoreGoal && <p className="font-bold text-red-400 text-sm">(Hardcore Mode Enabled)</p>}
              <p className="text-lg font-bold text-white">Ends on: {goalEndDate ? new Date(goalEndDate).toLocaleString() : 'Calculating...'}</p>
              {remainingTime !== null && <p className="text-sm text-gray-400">({formatElapsedTime(Math.round(remainingTime / 1000))} remaining)</p>}
              {!isHardcoreGoal && (
                <button onClick={handleClearPersonalGoal} className="btn-secondary mt-4">
                  Cancel Goal
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-purple-200 mb-4">
            Set a duration for your personal chastity goal.
          </p>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="number"
              value={goalDuration}
              onChange={(e) => setGoalDuration(e.target.value)}
              placeholder="Days"
              className="input-field w-24"
            />
            <button onClick={onSetGoalClick} className="btn-primary flex-grow flex items-center justify-center">
              <FaLock className="mr-2" /> Set & Lock Goal
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelfLocking}
                onChange={(e) => setIsSelfLocking(e.target.checked)}
                className="form-checkbox h-5 w-5 bg-gray-900 border-purple-500 text-purple-600 focus:ring-purple-500 rounded"
              />
              <span className="ml-3 text-sm font-medium text-purple-200">Hardcore Mode? (Locks Cage Off button)</span>
            </label>
            {isSelfLocking && (
              <div className="mt-3">
                <p className="text-xs text-yellow-400 mb-2">Optionally, enter your physical lock's combination. The app will save it and reveal it to you only after the goal is complete.</p>
                <input
                  type="text"
                  value={selfLockCodeInput}
                  onChange={(e) => setSelfLockCodeInput(e.target.value)}
                  placeholder="Enter combination for your lock (optional)"
                  className="input-field w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalGoalSection;
