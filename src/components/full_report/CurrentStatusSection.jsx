// src/components/full_report/CurrentStatusSection.jsx
import React from 'react';
import { formatTime, formatElapsedTime } from '../../utils';

const CurrentStatusSection = ({
    isCageOn, isPaused, cageOnTime,
    effectiveCurrentSessionTime, accumulatedPauseTimeThisSession,
    livePauseDuration, timeCageOff
}) => (
    <>
        <h3 className="text-xl font-semibold text-purple-300 mb-2">Current Status</h3>
        <div className="mb-1"><strong>Cage Status:</strong> {isCageOn ? (isPaused ? 'ON (Paused)' : 'ON') : 'OFF'}</div>
        {isCageOn && cageOnTime && <div className="mb-1"><strong>Current Cage On Since:</strong> {formatTime(cageOnTime, true)}</div>}
        <div className={`p-2 my-1 rounded ${isCageOn ? (isPaused ? 'bg-yellow-500/10' : 'bg-green-500/10') : ''}`}>
            <strong>Effective Time This Session:</strong>
            <span className={`ml-2 font-semibold ${isCageOn ? (isPaused ? 'text-yellow-400' : 'text-green-400') : 'text-purple-200'}`}>
                {formatElapsedTime(effectiveCurrentSessionTime)}
            </span>
            {isPaused && <span className="text-xs text-yellow-400"> (Paused)</span>}
            {isCageOn && accumulatedPauseTimeThisSession > 0 && (
                <span className="text-xs text-yellow-300 block mt-1">
                    (Total paused this session: {formatElapsedTime(accumulatedPauseTimeThisSession)})
                </span>
             )}
             {isCageOn && isPaused && livePauseDuration > 0 && (
                <span className="text-xs text-yellow-400 block mt-1">
                    (Currently paused for: {formatElapsedTime(livePauseDuration)})
                </span>
             )}
        </div>
        <div className={`p-2 my-1 rounded ${!isCageOn && timeCageOff > 0 ? 'bg-red-500/10' : ''}`}><strong>Current Session Cage Off:</strong> <span className={`ml-2 font-semibold ${!isCageOn && timeCageOff > 0 ? 'text-red-400' : 'text-purple-200'}`}>{formatElapsedTime(timeCageOff)}</span></div>
    </>
);

export default CurrentStatusSection;