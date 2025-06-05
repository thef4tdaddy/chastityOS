// src/pages/FullReportPage.jsx
import React from 'react';
import { formatTime, formatElapsedTime } from '../utils'; // Adjust path if your utils.js is elsewhere

const FullReportPage = ({
    savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff,
    totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, isLoadingEvents,
    isPaused, accumulatedPauseTimeThisSession,
    overallTotalPauseTime,
    keyholderName, // Assuming keyholderName might be used for context later
    livePauseDuration // Added livePauseDuration to props
}) => {
    const formatEventTypesForDisplay = (types, otherDetail, subName, khName) => {
        let displayTypes = types && types.length > 0
            ? types.map(type => {
                if (type === "Orgasm (Self)" && subName) return `Orgasm (${subName})`;
                if (type === "Orgasm (Partner)" && khName) return `Orgasm (${khName})`;
                return type;
              }).join(', ')
            : '';
        if (otherDetail) {
            displayTypes += (displayTypes ? ', ' : '') + `Other: ${otherDetail}`;
        }
        return displayTypes || 'N/A';
    };
    const formatOrgasmCounts = (selfAmount, partnerAmount, subName, khName) => {
        let parts = [];
        if (selfAmount) parts.push(`${subName || 'Self'}: ${selfAmount}`);
        if (partnerAmount) parts.push(`${khName || 'Partner'}: ${partnerAmount}`);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

    // Calculate the effective time for the current session, considering pauses
    const effectiveCurrentSessionTime = isCageOn
        ? Math.max(0, timeInChastity - accumulatedPauseTimeThisSession - (isPaused && livePauseDuration ? livePauseDuration : 0))
        : 0;

    return (
        <div className="text-left text-purple-200 p-4 bg-gray-800 rounded-lg border border-purple-700">
          {/* Page title is now rendered in App.jsx for consistency */}
          <div className="mb-4"><strong>Submissive’s Name:</strong> {savedSubmissivesName || '(Not Set)'}</div>
          {!savedSubmissivesName && userId && (
            <div className="mb-4"><strong>User ID:</strong> {userId}</div>
          )}
           {keyholderName && (
            <div className="mb-4"><strong>Keyholder:</strong> {keyholderName}</div>
          )}
          <hr className="my-3 border-purple-700"/>

          <h3 className="text-xl font-semibold text-purple-300 mb-2">Current Status</h3>
          <div className="mb-1"><strong>Cage Status:</strong> {isCageOn ? (isPaused ? 'ON (Paused)' : 'ON') : 'OFF'}</div>
          {isCageOn && cageOnTime && <div className="mb-1"><strong>Current Cage On Since:</strong> {formatTime(cageOnTime, true)}</div>}
            <div className={`p-2 my-1 rounded ${isCageOn ? (isPaused ? 'bg-yellow-500/10' : 'bg-green-500/10') : ''}`}>
                <strong>Effective Time This Session:</strong>
                <span className={`ml-2 font-semibold ${isCageOn ? (isPaused ? 'text-yellow-400' : 'text-green-400') : 'text-purple-200'}`}>
                    {formatElapsedTime(effectiveCurrentSessionTime)}
                </span>
                {isPaused && <span className="text-xs text-yellow-400"> (Paused)</span>}
                 {/* Display total accumulated pause for this session if it's greater than 0 and cage is on */}
                 {isCageOn && accumulatedPauseTimeThisSession > 0 && (
                    <span className="text-xs text-yellow-300 block mt-1">
                        (Total paused this session: {formatElapsedTime(accumulatedPauseTimeThisSession)})
                    </span>
                 )}
                 {/* Display current live pause duration if session is currently paused */}
                 {isCageOn && isPaused && livePauseDuration > 0 && (
                    <span className="text-xs text-yellow-400 block mt-1">
                        (Currently paused for: {formatElapsedTime(livePauseDuration)})
                    </span>
                 )}
            </div>
          <div className={`p-2 my-1 rounded ${!isCageOn && timeCageOff > 0 ? 'bg-red-500/10' : ''}`}><strong>Current Session Cage Off:</strong> <span className={`ml-2 font-semibold ${!isCageOn && timeCageOff > 0 ? 'text-red-400' : 'text-purple-200'}`}>{formatElapsedTime(timeCageOff)}</span></div>
          <hr className="my-3 border-purple-700"/>

          <h3 className="text-xl font-semibold text-purple-300 mb-2">Totals</h3>
          <div className="mb-1"><strong>Total Effective Time In Chastity:</strong> {formatElapsedTime(totalChastityTime)}</div>
          <div className="mb-1"><strong>Total Time Cage Off:</strong> {formatElapsedTime(totalTimeCageOff)}</div>
          <div className="mb-1"><strong>Overall Total Paused Time (from completed sessions):</strong> <span className="text-yellow-300">{formatElapsedTime(overallTotalPauseTime)}</span></div>
          <hr className="my-3 border-purple-700"/>

          <h3 className="text-xl font-semibold text-purple-300 mb-2 text-center">Chastity History</h3>
          {chastityHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-800">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Start</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">End</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Raw Dur.</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Paused</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Effective</th>
                    {/* --- Goal Columns --- */}
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Goal Set</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Difference</th>
                    {/* --- End Goal Columns --- */}
                    <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-purple-700">
                  {chastityHistory.slice().reverse().map(p => { // .slice().reverse() to show most recent first
                    const effectiveDuration = Math.max(0, (p.duration || 0) - (p.totalPauseDurationSeconds || 0));
                    const goalDurationForSession = p.goalDurationAtSessionStart;
                    const goalStatusDisplay = p.goalStatus || "N/A";
                    let goalDifferenceDisplay = "N/A";

                    if (goalDurationForSession !== null && goalDurationForSession > 0 && p.goalTimeDifference !== null) {
                        if (p.goalStatus === "Met") {
                            goalDifferenceDisplay = `Exceeded by ${formatElapsedTime(Math.abs(p.goalTimeDifference))}`;
                        } else if (p.goalStatus === "Not Met") {
                            goalDifferenceDisplay = `Short by ${formatElapsedTime(p.goalTimeDifference)}`;
                        }
                    }

                    return (
                      <tr key={p.id || (p.startTime ? p.startTime.toString() : Math.random())} className="hover:bg-purple-900/10">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{p.periodNumber}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatTime(p.startTime, true)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatTime(p.endTime, true)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatElapsedTime(p.duration)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-300">{formatElapsedTime(p.totalPauseDurationSeconds || 0)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-green-400 font-semibold">{formatElapsedTime(effectiveDuration)}</td>
                        {/* --- Goal Data Cells --- */}
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-300">{goalDurationForSession ? formatElapsedTime(goalDurationForSession) : 'N/A'}</td>
                        <td className={`px-3 py-2 whitespace-nowrap text-sm font-semibold ${goalStatusDisplay === "Met" ? 'text-green-400' : (goalStatusDisplay === "Not Met" ? 'text-red-400' : 'text-purple-200')}`}>{goalStatusDisplay}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{goalDifferenceDisplay}</td>
                        {/* --- End Goal Data Cells --- */}
                        <td className="px-3 py-2 whitespace-pre-wrap text-sm text-purple-200 break-words max-w-xs">{p.reasonForRemoval}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center text-purple-200">No chastity history records.</p>}
          <hr className="my-3 border-purple-700"/>

          <h3 className="text-xl font-semibold text-purple-300 mt-4 mb-2 text-center">Sexual Events Log</h3>
            {isLoadingEvents ? <p className="text-purple-200 text-center">Loading events...</p> :
             sexualEventsLog.length > 0 ? (
                <div className="overflow-x-auto bg-gray-800 rounded-lg border border-purple-700">
                    <table className="min-w-full divide-y divide-purple-700">
                        <thead className="bg-gray-700"><tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Date & Time</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Type(s)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Duration</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Orgasm Count(s)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Notes</th>
                        </tr></thead>
                        <tbody className="divide-y divide-purple-700">
                            {sexualEventsLog.map(event => ( 
                                <tr key={event.id} className="hover:bg-purple-900/20">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatTime(event.eventTimestamp, true)}</td>
                                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{formatEventTypesForDisplay(event.types, event.otherTypeDetail, savedSubmissivesName, keyholderName)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{event.durationSeconds ? formatElapsedTime(event.durationSeconds) : 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatOrgasmCounts(event.selfOrgasmAmount, event.partnerOrgasmAmount, savedSubmissivesName, keyholderName)}</td>
                                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{event.notes || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className="text-purple-200 text-center">No sexual events logged yet.</p>}
        </div>
    );
};

export default FullReportPage;
