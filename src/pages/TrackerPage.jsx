import React, { useEffect, useState, useRef } from 'react';
import { FaPlay, FaPause, FaStop, FaLock, FaSpinner } from 'react-icons/fa';
import { formatTime, formatElapsedTime } from '../utils';

const TrackerPage = (props) => {
    const {
        isAuthReady,
        isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory,
        handleToggleCage,
        showReasonModal,
        reasonForRemoval, setReasonForRemoval, handleConfirmRemoval, handleCancelRemoval,
        isPaused: isPausedProp,
        handleInitiatePause,
        handleResumeSession,
        showPauseReasonModal,
        handleCancelPauseModal,
        reasonForPauseInput,
        setReasonForPauseInput,
        handleConfirmPause,
        accumulatedPauseTimeThisSession,
        pauseStartTime,
        livePauseDuration,
        pauseCooldownMessage,
        showRestoreSessionPrompt,
        handleConfirmRestoreSession,
        handleDiscardAndStartNew,
        loadedSessionData,
        goalDurationSeconds,
        keyholderName,
        requiredKeyholderDurationSeconds,
        isGoalActive,
        handleEmergencyUnlock,
    } = props;

    // --- FIX: Guard against undefined/null props to prevent crashes on initial render ---
    const isPaused = typeof isPausedProp === 'boolean' ? isPausedProp : false;
    const safeChastityHistory = chastityHistory || [];
    const safeTimeInChastity = timeInChastity || 0;
    const safeAccumulatedPauseTime = accumulatedPauseTimeThisSession || 0;

    const [remainingGoalTime, setRemainingGoalTime] = useState(null);
    const goalTimerRef = useRef(null);
    
    const [showEmergencyUnlockModal, setShowEmergencyUnlockModal] = useState(false);
    const [backupCodeInput, setBackupCodeInput] = useState('');
    const [unlockMessage, setUnlockMessage] = useState('');

    const effectiveTimeInChastityForGoal = Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime);

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

    const mainChastityDisplayTime = Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime);

    let topBoxLabel = "Cage Status Time";
    let topBoxTime = null;
    if (isCageOn) {
        topBoxLabel = "Cage On Since:";
        topBoxTime = cageOnTime;
    } else {
        topBoxLabel = "Cage Off Since:";
        if (safeChastityHistory.length > 0) {
            topBoxTime = safeChastityHistory[safeChastityHistory.length - 1].endTime;
        } else {
            topBoxTime = null;
        }
    }

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

    // --- FIX: Add a loading state to prevent rendering before data is ready ---
    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center p-8">
                <FaSpinner className="animate-spin text-4xl text-purple-400" />
                <p className="ml-4 text-lg">Loading Session...</p>
            </div>
        );
    }

    return (
        <>
          {/* FIX: Restored ALL original UI, modals, and stat displays */}
          {showRestoreSessionPrompt && loadedSessionData && (
             <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-700 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-blue-500">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-blue-300">Restore Previous Session?</h3>
                <p className="text-sm text-gray-300 mb-2">An active chastity session was found:</p>
                <ul className="text-xs text-left text-gray-400 mb-6 list-disc list-inside pl-4">
                    <li>Started: {formatTime(loadedSessionData.cageOnTime, true)}</li>
                    <li>
                        Currently: {loadedSessionData.isPaused
                            ? `Paused (for ${formatElapsedTime( (loadedSessionData.accumulatedPauseTimeThisSession || 0) + (loadedSessionData.pauseStartTime ? Math.floor((new Date().getTime() - new Date(loadedSessionData.pauseStartTime).getTime()) / 1000) : 0) )})`
                            : `Active (for ${formatElapsedTime(Math.floor((new Date().getTime() - new Date(loadedSessionData.cageOnTime).getTime()) / 1000) - (loadedSessionData.accumulatedPauseTimeThisSession || 0))})`
                        }
                    </li>
                </ul>
                <p className="text-sm text-gray-300 mb-4">Would you like to resume this session or start a new one?</p>
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                  <button type="button" onClick={handleConfirmRestoreSession} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">Resume Previous Session</button>
                  <button type="button" onClick={handleDiscardAndStartNew} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Start New Session</button>
                </div>
              </div>
            </div>
          )}

          {pauseCooldownMessage && (
            <div className="mb-4 p-3 bg-yellow-600/30 border border-yellow-500 rounded-lg text-sm text-yellow-200">
                {pauseCooldownMessage}
            </div>
          )}

          {isCageOn && goalDurationSeconds && goalDurationSeconds > 0 && remainingGoalTime !== null && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border ${remainingGoalTime <= 0 ? 'bg-green-700 border-green-500' : 'bg-blue-800 border-blue-600'}`}>
                    <p className={`text-lg font-semibold ${remainingGoalTime <=0 ? 'text-green-200' : 'text-blue-200'}`}>
                        {remainingGoalTime <= 0 ? "Goal Reached!" : "Time Remaining on Goal:"}
                    </p>
                    {remainingGoalTime > 0 && (
                        <p className="text-3xl font-bold text-blue-100">{formatElapsedTime(remainingGoalTime)}</p>
                    )}
                </div>
            )}
            {keyholderName && requiredKeyholderDurationSeconds !== null && requiredKeyholderDurationSeconds > 0 && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border ${
                    isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds ? 'bg-pink-700 border-pink-500' : 'bg-purple-800 border-purple-600'
                }`}>
                    <p className={`text-sm font-semibold ${
                        isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds ? 'text-pink-200' : 'text-purple-200'
                    }`}>
                        {keyholderName}'s Required Duration: {formatElapsedTime(requiredKeyholderDurationSeconds)}
                    </p>
                    {isCageOn && effectiveTimeInChastityForGoal < requiredKeyholderDurationSeconds && (
                        <p className="text-lg font-bold text-purple-100">
                            Time left for KH: {formatElapsedTime(requiredKeyholderDurationSeconds - effectiveTimeInChastityForGoal)}
                        </p>
                    )}
                    {isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds && (
                         <p className="text-lg font-bold text-pink-100">KH Duration Met!</p>
                    )}
                </div>
            )}

          <div className="space-y-4 mb-6 md:mb-8">
            <div className="tracker-box p-3 md:p-4 rounded-lg shadow-sm text-center">
                <p className="tracker-label text-sm md:text-lg">{topBoxLabel}</p>
                <p className="tracker-value text-2xl md:text-4xl font-semibold">
                    {formatTime(topBoxTime, true)}
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${isCageOn ? (isPaused ? 'bg-yellow-500/20 border-yellow-600' : 'bg-green-500/20 border-green-600') : 'tracker-box'}`}>
                    <p className="tracker-label text-sm md:text-lg">
                        Current Session In Chastity {isPaused ? '(Paused)' : ''}:
                    </p>
                    <p className={`tracker-value text-2xl md:text-4xl font-bold ${isCageOn ? (isPaused ? 'text-yellow-400' : 'text-green-400') : ''}`}>
                        {formatElapsedTime(mainChastityDisplayTime)}
                    </p>
                    {isPaused && pauseStartTime && (
                        <p className="text-xs text-yellow-300 mt-1">Currently paused for: {formatElapsedTime(livePauseDuration)}</p>
                    )}
                    {isCageOn && safeAccumulatedPauseTime > 0 && (
                        <p className="text-xs text-yellow-300 mt-1">Total time paused this session: {formatElapsedTime(isPaused && pauseStartTime ? safeAccumulatedPauseTime + livePauseDuration : safeAccumulatedPauseTime )}</p>
                    )}
                </div>
                <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${!isCageOn && timeCageOff > 0 ? 'bg-red-500/20 border-red-600' : 'tracker-box'}`}>
                    <p className="tracker-label text-sm md:text-lg">Current Session Cage Off:</p>
                    <p className={`tracker-value text-2xl md:text-4xl font-bold ${!isCageOn && timeCageOff > 0 ? 'text-red-400' : ''}`}>{formatElapsedTime(timeCageOff || 0)}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="tracker-box p-3 md:p-4 rounded-lg shadow-sm">
                    <p className="tracker-label text-sm md:text-lg">Total Time In Chastity:</p>
                    <p className="tracker-value text-2xl md:text-4xl font-bold">{formatElapsedTime(totalChastityTime || 0)}</p>
                </div>
                <div className="tracker-box p-3 md:p-4 rounded-lg shadow-sm">
                    <p className="tracker-label text-sm md:text-lg">Total Time Cage Off:</p>
                    <p className="tracker-value text-2xl md:text-4xl font-bold">{formatElapsedTime(totalTimeCageOff || 0)}</p>
                </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-3 justify-center">
              {!isCageOn ? (
                  <button type="button" onClick={handleToggleCage} disabled={!isAuthReady || isPaused || showRestoreSessionPrompt}
                      className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-purple-500 hover:bg-purple-600 focus:ring-purple-400">
                      Cage On / Start Session
                  </button>
              ) : isGoalActive ? (
                  <button type="button" onClick={handleOpenUnlockModal} disabled={!isAuthReady || showRestoreSessionPrompt}
                      className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-700 hover:bg-red-800 focus:ring-red-500 flex items-center justify-center">
                     <FaLock className="mr-2"/> Emergency Unlock
                  </button>
              ) : (
                  <button type="button" onClick={handleToggleCage} disabled={!isAuthReady || isPaused || showRestoreSessionPrompt}
                      className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-600 hover:bg-red-700 focus:ring-red-500">
                      Cage Off / End Session
                  </button>
              )}
        </div>

        {isCageOn && (
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6 md:mb-8 justify-center">
                {!isPaused ? (
                    <button type="button" onClick={handleInitiatePause} disabled={!isAuthReady || showRestoreSessionPrompt} className="flex-grow bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50">
                        Pause Session
                    </button>
                ) : (
                    <button type="button" onClick={handleResumeSession} disabled={!isAuthReady || showRestoreSessionPrompt} className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50">
                        Resume Session
                    </button>
                )}
            </div>
          )}

           {showReasonModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-purple-700">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-purple-300">Reason for Cage Removal:</h3>
                <textarea value={reasonForRemoval} onChange={(e) => setReasonForRemoval(e.target.value)} placeholder="Enter reason here (optional)" rows="4"
                  className="w-full p-2 mb-6 rounded-lg border border-purple-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                  <button type="button" onClick={handleConfirmRemoval} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirm Removal</button>
                  <button type="button" onClick={handleCancelRemoval} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showPauseReasonModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-yellow-700">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-300">Reason for Pausing Session:</h3>
                <textarea value={reasonForPauseInput} onChange={(e) => setReasonForPauseInput(e.target.value)} placeholder="Enter reason here (optional)" rows="4"
                  className="w-full p-2 mb-6 rounded-lg border border-yellow-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"></textarea>
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                  <button type="button" onClick={handleConfirmPause} className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirm Pause</button>
                  <button type="button" onClick={handleCancelPauseModal} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showEmergencyUnlockModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg w-full max-w-md border border-red-700">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400 text-center">Emergency Unlock</h3>
                <p className="text-sm text-purple-200 mb-4 text-center">
                  A Personal Goal is active. To unlock early, please provide your 6-character backup code.
                </p>
                <input
                  type="text"
                  value={backupCodeInput}
                  onChange={(e) => setBackupCodeInput(e.target.value.toUpperCase())}
                  maxLength="6"
                  placeholder="BACKUP CODE"
                  className="w-full p-3 rounded-md border border-red-600 bg-gray-900 text-white text-2xl text-center font-mono tracking-widest focus:ring-red-500 focus:border-red-500 mb-4"
                />
                <button
                  onClick={handleAttemptEmergencyUnlock}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  disabled={!backupCodeInput || unlockMessage === 'Verifying code...'}
                >
                  {unlockMessage === 'Verifying code...' ? 'Verifying...' : 'Verify & Unlock'}
                </button>
                {unlockMessage && (
                  <p className={`text-sm mt-4 text-center ${unlockMessage.includes('successful') ? 'text-green-400' : 'text-yellow-400'}`}>
                    {unlockMessage}
                  </p>
                )}
                 <button
                    type="button"
                    onClick={() => setShowEmergencyUnlockModal(false)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition mt-4"
                  >
                    Cancel
                  </button>
              </div>
            </div>
          )}
        </>
    );
};

export default TrackerPage;
