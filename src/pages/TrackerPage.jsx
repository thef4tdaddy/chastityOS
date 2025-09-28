// src/pages/TrackerPage.jsx
import React from 'react';
import { FaLock, FaSpinner } from 'react-icons/fa';
import { useTrackerPage } from '../hooks/useTrackerPage';
import EmergencyUnlockModal from '../components/tracker/EmergencyUnlockModal';
import SessionRestoreModal from '../components/tracker/SessionRestoreModal';
import ReasonModal from '../components/tracker/ReasonModal';
import GoalProgressDisplay from '../components/tracker/GoalProgressDisplay';
import SessionStatsDisplay from '../components/tracker/SessionStatsDisplay';

const TrackerPage = (props) => {
    const {
        isAuthReady, isCageOn, handleToggleCage, showReasonModal,
        reasonForRemoval, setReasonForRemoval, handleConfirmRemoval, handleCancelRemoval,
        isPaused, handleInitiatePause, handleResumeSession, showPauseReasonModal,
        handleCancelPauseModal, reasonForPauseInput, setReasonForPauseInput, handleConfirmPause,
        pauseCooldownMessage, showRestoreSessionPrompt, handleConfirmRestoreSession,
        handleDiscardAndStartNew, loadedSessionData, keyholderName, savedSubmissivesName,
        requiredKeyholderDurationSeconds, isGoalActive, isHardcoreGoal
    } = props;

    const {
        remainingGoalTime, showEmergencyUnlockModal, backupCodeInput, unlockMessage,
        effectiveTimeInChastityForGoal, mainChastityDisplayTime, topBoxLabel, topBoxTime,
        setBackupCodeInput, handleOpenUnlockModal, handleAttemptEmergencyUnlock,
        setShowEmergencyUnlockModal,
    } = useTrackerPage(props);

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
            <SessionRestoreModal
                isOpen={showRestoreSessionPrompt}
                loadedSessionData={loadedSessionData}
                onConfirmRestore={handleConfirmRestoreSession}
                onDiscardAndStartNew={handleDiscardAndStartNew}
            />

            {pauseCooldownMessage && (
                <div className="mb-4 p-3 bg-yellow-600/30 border border-yellow-500 rounded-lg text-sm text-yellow-200">
                    {pauseCooldownMessage}
                </div>
            )}

            <GoalProgressDisplay
                isCageOn={isCageOn}
                goalDurationSeconds={props.goalDurationSeconds}
                remainingGoalTime={remainingGoalTime}
                keyholderName={keyholderName}
                requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
                savedSubmissivesName={savedSubmissivesName}
                effectiveTimeInChastityForGoal={effectiveTimeInChastityForGoal}
            />

            <SessionStatsDisplay
                topBoxLabel={topBoxLabel}
                topBoxTime={topBoxTime}
                isCageOn={isCageOn}
                isPaused={isPaused}
                mainChastityDisplayTime={mainChastityDisplayTime}
                pauseStartTime={props.pauseStartTime}
                livePauseDuration={props.livePauseDuration}
                accumulatedPauseTimeThisSession={props.accumulatedPauseTimeThisSession}
                timeCageOff={props.timeCageOff}
                totalChastityTime={props.totalChastityTime}
                totalTimeCageOff={props.totalTimeCageOff}
            />

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-3 justify-center">
                {!isCageOn ? (
                    <button 
                        type="button" 
                        onClick={handleToggleCage} 
                        disabled={!isAuthReady || isPaused || showRestoreSessionPrompt}
                        className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-purple-500 hover:bg-purple-600 focus:ring-purple-400"
                    >
                        Cage On / Start Session
                    </button>
                ) : isGoalActive && isHardcoreGoal ? (
                    <button 
                        type="button" 
                        onClick={handleOpenUnlockModal} 
                        disabled={!isAuthReady || showRestoreSessionPrompt}
                        className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-700 hover:bg-red-800 focus:ring-red-500 flex items-center justify-center"
                    >
                       <FaLock className="mr-2"/> Emergency Unlock
                    </button>
                ) : (
                    <button 
                        type="button" 
                        onClick={handleToggleCage} 
                        disabled={!isAuthReady || isPaused || showRestoreSessionPrompt}
                        className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    >
                        Cage Off / End Session
                    </button>
                )}
            </div>

            {/* Pause/Resume Buttons */}
            {isCageOn && (
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6 md:mb-8 justify-center">
                    {!isPaused ? (
                        <button 
                            type="button" 
                            onClick={handleInitiatePause} 
                            disabled={!isAuthReady || showRestoreSessionPrompt} 
                            className="flex-grow bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50"
                        >
                            Pause Session
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            onClick={handleResumeSession} 
                            disabled={!isAuthReady || showRestoreSessionPrompt} 
                            className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50"
                        >
                            Resume Session
                        </button>
                    )}
                </div>
            )}

            <ReasonModal
                isOpen={showReasonModal}
                type="removal"
                title="Reason for Cage Removal:"
                value={reasonForRemoval}
                onChange={(e) => setReasonForRemoval(e.target.value)}
                onConfirm={handleConfirmRemoval}
                onCancel={handleCancelRemoval}
            />

            <ReasonModal
                isOpen={showPauseReasonModal}
                type="pause"
                title="Reason for Pausing Session:"
                value={reasonForPauseInput}
                onChange={(e) => setReasonForPauseInput(e.target.value)}
                onConfirm={handleConfirmPause}
                onCancel={handleCancelPauseModal}
            />

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