
import React from 'react';
import { FaPlay, FaPause, FaStop, FaLock, FaSpinner } from 'react-icons/fa';
import { EmergencyUnlockModal } from '../components/tracker/EmergencyUnlockModal';

const TrackerPage: React.FC = () => {
  // Mock data
  const isAuthReady = true;
  const isCageOn = true;
  const isPaused = false;
  const remainingGoalTime = 3600;
  const keyholderName = 'Keyholder';
  const savedSubmissivesName = 'Submissive';
  const requiredKeyholderDurationSeconds = 7200;
  const effectiveTimeInChastityForGoal = 1800;
  const mainChastityDisplayTime = 3600;
  const topBoxLabel = 'Total Locked Time';
  const topBoxTime = '1d 2h 3m';
  const livePauseDuration = 0;
  const accumulatedPauseTimeThisSession = 0;
  const timeCageOff = 0;
  const totalChastityTime = 86400;
  const totalTimeCageOff = 0;
  const showRestoreSessionPrompt = false;
  const pauseCooldownMessage = null;
  const denialCooldownActive = false;
  const hasPendingReleaseRequest = false;
  const isGoalActive = true;
  const isHardcoreGoal = false;
  const showReasonModal = false;
  const showPauseReasonModal = false;
  const showEmergencyUnlockModal = false;

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green p-4">
      {showRestoreSessionPrompt && (
        <div>Restore session prompt</div>
      )}

      {pauseCooldownMessage && (
        <div className="mb-4 p-3 bg-yellow-600/30 border border-yellow-500 rounded-lg text-sm text-yellow-200">
          {pauseCooldownMessage}
        </div>
      )}

      {isCageOn && remainingGoalTime > 0 && (
        <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20`}>
          <p className={`text-lg font-semibold text-blue-200`}>
            Time Remaining on Goal:
          </p>
          <p className="text-3xl font-bold text-blue-100">
            {remainingGoalTime}
          </p>
        </div>
      )}

      {keyholderName && requiredKeyholderDurationSeconds > 0 && (
        <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20`}>
          <p className={`text-sm font-semibold text-purple-200`}>
            {keyholderName} requires {savedSubmissivesName || 'the submissive'} to be in chastity for {requiredKeyholderDurationSeconds}
          </p>
        </div>
      )}

      {denialCooldownActive && (
        <div>Denial cooldown active</div>
      )}

      <div className="space-y-4 mb-6 md:mb-8">
        <div className="bg-white/10 backdrop-blur-xs border-white/20 p-3 md:p-4 rounded-lg shadow-sm text-center">
          <p className="tracker-label text-sm md:text-lg">{topBoxLabel}</p>
          <p className="tracker-value text-2xl md:text-4xl font-semibold">
            {topBoxTime}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${isCageOn ? (isPaused ? 'bg-yellow-500/20 border-yellow-600' : 'bg-green-500/20 border-green-600') : 'bg-white/10 backdrop-blur-xs border-white/20'}`}>
            <p className="tracker-label text-sm md:text-lg">
              Current Session In Chastity {isPaused ? '(Paused)' : ''}:
            </p>
            <p className={`tracker-value text-2xl md:text-4xl font-bold ${isCageOn ? (isPaused ? 'text-yellow-400' : 'text-green-400') : ''}`}>
              {mainChastityDisplayTime}
            </p>
            {isPaused && (
              <p className="text-xs text-yellow-300 mt-1">
                Currently paused for: {livePauseDuration}
              </p>
            )}
            {isCageOn && accumulatedPauseTimeThisSession > 0 && (
              <p className="text-xs text-yellow-300 mt-1">
                Total time paused this session: {accumulatedPauseTimeThisSession}
              </p>
            )}
          </div>
          <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${!isCageOn && timeCageOff > 0 ? 'bg-red-500/20 border-red-600' : 'bg-white/10 backdrop-blur-xs border-white/20'}`}>
            <p className="tracker-label text-sm md:text-lg">
              Current Session Cage Off:
            </p>
            <p className={`tracker-value text-2xl md:text-4xl font-bold ${!isCageOn && timeCageOff > 0 ? 'text-red-400' : ''}`}>
              {timeCageOff}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-xs border-white/20 p-3 md:p-4 rounded-lg shadow-sm">
            <p className="tracker-label text-sm md:text-lg">
              Total Time In Chastity:
            </p>
            <p className="tracker-value text-2xl md:text-4xl font-bold">
              {totalChastityTime}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border-white/20 p-3 md:p-4 rounded-lg shadow-sm">
            <p className="tracker-label text-sm md:text-lg">
              Total Time Cage Off:
            </p>
            <p className="tracker-value text-2xl md:text-4xl font-bold">
              {totalTimeCageOff}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-3 justify-center">
        {!isCageOn ? (
          <button type="button" className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-nightly-lavender-floral hover:bg-purple-600 focus:ring-purple-400">
            Cage On / Start Session
          </button>
        ) : isGoalActive && isHardcoreGoal ? (
          <button type="button" className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-700 hover:bg-red-800 focus:ring-red-500 flex items-center justify-center">
            <FaLock className="mr-2" /> Emergency Unlock
          </button>
        ) : requiredKeyholderDurationSeconds > 0 ? (
          <button type="button" className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-500 hover:bg-red-600 focus:ring-red-400">
            {hasPendingReleaseRequest ? 'Request Sent' : 'Beg for Release'}
          </button>
        ) : (
          <button type="button" className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-600 hover:bg-red-700 focus:ring-red-500">
            Cage Off / End Session
          </button>
        )}
      </div>

      {isCageOn && (
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6 md:mb-8 justify-center">
          {!isPaused ? (
            <button type="button" className="flex-grow bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50">
              Pause Session
            </button>
          ) : (
            <button type="button" className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50">
              Resume Session
            </button>
          )}
        </div>
      )}

      {showReasonModal && (
        <div>Reason for removal modal</div>
      )}

      {showPauseReasonModal && (
        <div>Reason for pause modal</div>
      )}

      <EmergencyUnlockModal
        isOpen={showEmergencyUnlockModal}
        onClose={() => {}}
        onSubmit={() => {}}
        backupCode=""
        setBackupCode={() => {}}
        unlockMessage=""
      />
    </div>
  );
};

export default TrackerPage;
