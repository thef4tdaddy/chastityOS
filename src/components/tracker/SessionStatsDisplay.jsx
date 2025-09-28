import React from 'react';
import { formatTime, formatElapsedTime } from '../../utils';

const SessionStatsDisplay = ({
    topBoxLabel,
    topBoxTime,
    isCageOn,
    isPaused,
    mainChastityDisplayTime,
    pauseStartTime,
    livePauseDuration,
    accumulatedPauseTimeThisSession,
    timeCageOff,
    totalChastityTime,
    totalTimeCageOff
}) => {
    return (
        <div className="space-y-4 mb-6 md:mb-8">
            {/* Top Box - Main Display */}
            <div className="tracker-box p-3 md:p-4 rounded-lg shadow-sm text-center">
                <p className="tracker-label text-sm md:text-lg">{topBoxLabel}</p>
                <p className="tracker-value text-2xl md:text-4xl font-semibold">
                    {formatTime(topBoxTime, true)}
                </p>
            </div>

            {/* Current Session Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${
                    isCageOn 
                        ? (isPaused ? 'bg-yellow-500/20 border-yellow-600' : 'bg-green-500/20 border-green-600') 
                        : 'tracker-box'
                }`}>
                    <p className="tracker-label text-sm md:text-lg">
                        Current Session In Chastity {isPaused ? '(Paused)' : ''}:
                    </p>
                    <p className={`tracker-value text-2xl md:text-4xl font-bold ${
                        isCageOn 
                            ? (isPaused ? 'text-yellow-400' : 'text-green-400') 
                            : ''
                    }`}>
                        {formatElapsedTime(mainChastityDisplayTime)}
                    </p>
                    {isPaused && pauseStartTime && (
                        <p className="text-xs text-yellow-300 mt-1">
                            Currently paused for: {formatElapsedTime(livePauseDuration)}
                        </p>
                    )}
                    {isCageOn && accumulatedPauseTimeThisSession > 0 && (
                        <p className="text-xs text-yellow-300 mt-1">
                            Total time paused this session: {formatElapsedTime(
                                isPaused && pauseStartTime 
                                    ? accumulatedPauseTimeThisSession + livePauseDuration 
                                    : accumulatedPauseTimeThisSession
                            )}
                        </p>
                    )}
                </div>
                
                <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${
                    !isCageOn && timeCageOff > 0 ? 'bg-red-500/20 border-red-600' : 'tracker-box'
                }`}>
                    <p className="tracker-label text-sm md:text-lg">Current Session Cage Off:</p>
                    <p className={`tracker-value text-2xl md:text-4xl font-bold ${
                        !isCageOn && timeCageOff > 0 ? 'text-red-400' : ''
                    }`}>
                        {formatElapsedTime(timeCageOff || 0)}
                    </p>
                </div>
            </div>

            {/* Total Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="tracker-box p-3 md:p-4 rounded-lg shadow-sm">
                    <p className="tracker-label text-sm md:text-lg">Total Time In Chastity:</p>
                    <p className="tracker-value text-2xl md:text-4xl font-bold">
                        {formatElapsedTime(totalChastityTime || 0)}
                    </p>
                </div>
                <div className="tracker-box p-3 md:p-4 rounded-lg shadow-sm">
                    <p className="tracker-label text-sm md:text-lg">Total Time Cage Off:</p>
                    <p className="tracker-value text-2xl md:text-4xl font-bold">
                        {formatElapsedTime(totalTimeCageOff || 0)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SessionStatsDisplay;