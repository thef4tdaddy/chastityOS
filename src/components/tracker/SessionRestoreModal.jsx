import React from 'react';
import { formatTime, formatElapsedTime } from '../../utils';

const SessionRestoreModal = ({
    isOpen,
    loadedSessionData,
    onConfirmRestore,
    onDiscardAndStartNew
}) => {
    if (!isOpen || !loadedSessionData) return null;

    const currentTime = new Date().getTime();
    const sessionStartTime = new Date(loadedSessionData.cageOnTime).getTime();
    const pauseTime = loadedSessionData.accumulatedPauseTimeThisSession || 0;
    const additionalPauseTime = loadedSessionData.pauseStartTime 
        ? Math.floor((currentTime - new Date(loadedSessionData.pauseStartTime).getTime()) / 1000) 
        : 0;
    const totalPauseTime = pauseTime + additionalPauseTime;
    const activeTime = Math.floor((currentTime - sessionStartTime) / 1000) - pauseTime;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-700 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-blue-500">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-blue-300">
                    Restore Previous Session?
                </h3>
                <p className="text-sm text-gray-300 mb-2">An active chastity session was found:</p>
                <ul className="text-xs text-left text-gray-400 mb-6 list-disc list-inside pl-4">
                    <li>Started: {formatTime(loadedSessionData.cageOnTime, true)}</li>
                    <li>
                        Currently: {loadedSessionData.isPaused
                            ? `Paused (for ${formatElapsedTime(totalPauseTime)})`
                            : `Active (for ${formatElapsedTime(activeTime)})`
                        }
                    </li>
                </ul>
                <p className="text-sm text-gray-300 mb-4">
                    Would you like to resume this session or start a new one?
                </p>
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                    <button 
                        type="button" 
                        onClick={onConfirmRestore} 
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Resume Previous Session
                    </button>
                    <button 
                        type="button" 
                        onClick={onDiscardAndStartNew} 
                        className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Start New Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionRestoreModal;