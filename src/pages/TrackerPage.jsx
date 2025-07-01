// src/pages/TrackerPage.jsx
import React from 'react';
import { FaPlay, FaPause, FaStop, FaLock, FaSpinner } from 'react-icons/fa';
import { formatTime, formatElapsedTime, formatDaysOnly } from '../utils';
import { useTrackerPage } from '../hooks/useTrackerPage'; // Import the new hook
import EmergencyUnlockModal from '../components/tracker/EmergencyUnlockModal'; // Import the new modal component
import { PAUSE_REASON_OPTIONS, REMOVAL_REASON_OPTIONS } from '../event_types.js';

const TrackerPage = (props) => {
    // These props are passed through to the hook or used for other modals
    const {
        isAuthReady,
        isCageOn,
        handleToggleCage,
        showReasonModal,
        reasonForRemoval, setReasonForRemoval, removalCustomReason, setRemovalCustomReason,
        handleConfirmRemoval, handleCancelRemoval,
        isPaused,
        handleInitiatePause,
        handleResumeSession,
        showPauseReasonModal,
        handleCancelPauseModal,
        pauseReason, setPauseReason, pauseCustomReason, setPauseCustomReason, handleConfirmPause,
        livePauseDuration,
        pauseCooldownMessage,
        showRestoreSessionPrompt,
        handleConfirmRestoreSession,
        handleDiscardAndStartNew,
        loadedSessionData,
        keyholderName,
        savedSubmissivesName,
        requiredKeyholderDurationSeconds,
        isGoalActive,
        isHardcoreGoal,
        totalChastityTime,
        totalTimeCageOff,
        timeCageOff,
        pauseStartTime,
        accumulatedPauseTimeThisSession,
        releaseRequests = [],
        addReleaseRequest
    } = props;

    // Call the new hook to get all the logic and state for this page
    const {
        remainingGoalTime,
        showEmergencyUnlockModal,
        backupCodeInput,
        unlockMessage,
        effectiveTimeInChastityForGoal,
        mainChastityDisplayTime,
        topBoxLabel,
        topBoxTime,
        setBackupCodeInput,
        handleOpenUnlockModal,
        handleAttemptEmergencyUnlock,
        setShowEmergencyUnlockModal,
    } = useTrackerPage(props); // Pass all props from parent to the hook

    const hasPendingReleaseRequest = releaseRequests.some(r => r.status === 'pending');
    const lastDeniedRequest = releaseRequests
        .filter(r => r.status === 'denied' && r.deniedAt)
        .sort((a, b) => b.deniedAt - a.deniedAt)[0];
    const denialCooldownActive = lastDeniedRequest && (Date.now() - lastDeniedRequest.deniedAt.getTime() < 4 * 3600 * 1000);

    const handleBegForRelease = async () => {
        if (addReleaseRequest) {
            await addReleaseRequest();
        }
    };

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center p-8">
                <FaSpinner className="animate-spin text-4xl text-purple-400" />
                <p className="ml-4 text-lg">Loading Session...</p>
            </div>
        );
    }

    // The JSX remains the same, but it uses the values from the hook
    return (
        <>
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

          {isCageOn && props.goalDurationSeconds > 0 && remainingGoalTime !== null && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border ${remainingGoalTime <= 0 ? 'bg-green-700 border-green-500' : 'bg-blue-800 border-blue-600'}`}>
                    <p className={`text-lg font-semibold ${remainingGoalTime <=0 ? 'text-green-200' : 'text-blue-200'}`}>
                        {remainingGoalTime <= 0 ? "Goal Reached!" : "Time Remaining on Goal:"}
                    </p>
                    {remainingGoalTime > 0 && (
                        <p className="text-3xl font-bold text-blue-100">{formatElapsedTime(remainingGoalTime)}</p>
                    )}
                </div>
            )}
            {keyholderName && requiredKeyholderDurationSeconds > 0 && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border ${
                    isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds ? 'bg-pink-700 border-pink-500' : 'bg-purple-800 border-purple-600'
                }`}>
                    <p className={`text-sm font-semibold ${
                        isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds ? 'text-pink-200' : 'text-purple-200'
                    }`}>
                        {keyholderName} requires {savedSubmissivesName || 'the submissive'} to be in chastity for {formatDaysOnly(requiredKeyholderDurationSeconds)}
                    </p>
                    {isCageOn && effectiveTimeInChastityForGoal < requiredKeyholderDurationSeconds && (
                        <p className="text-lg font-bold text-purple-100">
                            Time Left in required chastity: {formatElapsedTime(requiredKeyholderDurationSeconds - effectiveTimeInChastityForGoal)}
                        </p>
                    )}
                {isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds && (
                         <p className="text-lg font-bold text-pink-100">KH Duration Met!</p>
                    )}
                </div>
            )}

            {denialCooldownActive && lastDeniedRequest && (
                <div className="mb-4 p-2 rounded-md text-center bg-red-700/30 border border-red-600">
                    <p className="text-sm text-red-300">Beg for Release denied by {lastDeniedRequest.handledBy || keyholderName} at {lastDeniedRequest.deniedAt.toLocaleString()}</p>
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
                    {isCageOn && accumulatedPauseTimeThisSession > 0 && (
                        <p className="text-xs text-yellow-300 mt-1">Total time paused this session: {formatElapsedTime(isPaused && pauseStartTime ? accumulatedPauseTimeThisSession + livePauseDuration : accumulatedPauseTimeThisSession )}</p>
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
              ) : isGoalActive && isHardcoreGoal ? (
                  <button type="button" onClick={handleOpenUnlockModal} disabled={!isAuthReady || showRestoreSessionPrompt}
                      className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-700 hover:bg-red-800 focus:ring-red-500 flex items-center justify-center">
                     <FaLock className="mr-2"/> Emergency Unlock
                  </button>
              ) : requiredKeyholderDurationSeconds > 0 ? (
                  <button type="button" onClick={handleBegForRelease} disabled={!isAuthReady || hasPendingReleaseRequest || denialCooldownActive || showRestoreSessionPrompt}
                      className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-500 hover:bg-red-600 focus:ring-red-400">
                      {hasPendingReleaseRequest ? 'Request Sent' : 'Beg for Release'}
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
                <p className="text-xs text-gray-400 mb-1">(Optional)</p>
                <select value={reasonForRemoval} onChange={(e) => setReasonForRemoval(e.target.value)}
                  className="w-full p-2 mb-2 rounded-lg border border-purple-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select reason</option>
                  {REMOVAL_REASON_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {reasonForRemoval === 'Other' && (
                  <input type="text" value={removalCustomReason} onChange={(e) => setRemovalCustomReason(e.target.value)}
                    placeholder="Enter other reason" className="w-full p-2 mb-4 rounded-lg border border-purple-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                )}
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
                <p className="text-xs text-gray-400 mb-1">(Optional)</p>
                <select value={pauseReason} onChange={(e) => setPauseReason(e.target.value)}
                  className="w-full p-2 mb-2 rounded-lg border border-yellow-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  <option value="">Select reason</option>
                  {PAUSE_REASON_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {pauseReason === 'Other' && (
                  <input type="text" value={pauseCustomReason} onChange={(e) => setPauseCustomReason(e.target.value)}
                    placeholder="Enter other reason" className="w-full p-2 mb-4 rounded-lg border border-yellow-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                )}
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                  <button type="button" onClick={handleConfirmPause} className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirm Pause</button>
                  <button type="button" onClick={handleCancelPauseModal} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                </div>
              </div>
            </div>
          )}

          <EmergencyUnlockModal 
            isOpen={showEmergencyUnlockModal}
            onClose={() => setShowEmergencyUnlockModal(false)}
            onSubmit={handleAttemptEmergencyUnlock}
            backupCode={backupCodeInput}
            setBackupCode={setBackupCodeInput}
            unlockMessage={unlockMessage}
          />
        </>
    );
};

export default TrackerPage;