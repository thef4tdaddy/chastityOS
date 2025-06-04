import React from 'react';
import { formatTime, formatElapsedTime } from '../utils'; // Adjust path if your utils.js is elsewhere

const FullReportPage = ({
    savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff,
    totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, isLoadingEvents,
    isPaused, accumulatedPauseTimeThisSession,
    overallTotalPauseTime 
}) => {
    const formatEventTypesForDisplay = (types, otherDetail, subName) => {
        let displayTypes = types && types.length > 0 
            ? types.map(type => type === "Orgasm (Self)" && subName ? `Orgasm (${subName})` : type).join(', ') 
            : '';
        if (otherDetail) {
            displayTypes += (displayTypes ? ', ' : '') + `Other: ${otherDetail}`;
        }
        return displayTypes || 'N/A';
    };
    const formatOrgasmCounts = (selfAmount, partnerAmount) => {
        let parts = [];
        if (selfAmount) parts.push(`Self: ${selfAmount}`);
        if (partnerAmount) parts.push(`Partner: ${partnerAmount}`);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

    return (
        <div className="text-left text-purple-200 p-4 bg-gray-800 rounded-lg border border-purple-700">
          {/* Page title is now rendered in App.jsx for consistency */}
          <div className="mb-4"><strong>Submissive’s Name:</strong> {savedSubmissivesName || '(Not Set)'}</div>
          {!savedSubmissivesName && userId && ( 
            <div className="mb-4"><strong>User ID:</strong> {userId}</div>
          )}
          <hr className="my-3 border-purple-700"/>
          <h3 className="text-xl font-semibold text-purple-300 mb-2">Current Status</h3>
          <div className="mb-1"><strong>Cage Status:</strong> {isCageOn ? (isPaused ? 'ON (Paused)' : 'ON') : 'OFF'}</div>
          {isCageOn && cageOnTime && <div className="mb-1"><strong>Current Cage On Since:</strong> {formatTime(cageOnTime, true)}</div>}
          <div className={`p-2 my-1 rounded ${isCageOn ? (isPaused ? 'bg-yellow-500/10' : 'bg-green-500/10') : ''}`}>
                <strong>Effective Session In Chastity:</strong> 
                <span className={isCageOn ? (isPaused ? 'text-yellow-400 font-semibold' : 'text-green-400 font-semibold') : 'font-semibold'}>
                    {formatElapsedTime(isCageOn ? timeInChastity - accumulatedPauseTimeThisSession : timeInChastity)}
                </span>
                {isPaused && <span className="text-xs text-yellow-400"> (Paused)</span>}
            </div>
          <div className={`p-2 my-1 rounded ${!isCageOn && timeCageOff > 0 ? 'bg-red-500/10' : ''}`}><strong>Current Session Cage Off:</strong> <span className={!isCageOn && timeCageOff > 0 ? 'text-red-400 font-semibold' : 'font-semibold'}>{formatElapsedTime(timeCageOff)}</span></div>
          <hr className="my-3 border-purple-700"/>
          <h3 className="text-xl font-semibold text-purple-300 mb-2">Totals</h3>
          <div className="mb-1"><strong>Total Time In Chastity:</strong> {formatElapsedTime(totalChastityTime)}</div>
          <div className="mb-1"><strong>Total Time Cage Off:</strong> {formatElapsedTime(totalTimeCageOff)}</div>
          <div className="mb-1"><strong>Overall Total Paused Time:</strong> <span className="text-yellow-300">{formatElapsedTime(overallTotalPauseTime)}</span></div> 
          <hr className="my-3 border-purple-700"/>
          <h3 className="text-xl font-semibold text-purple-300 mb-2 text-center">Chastity History</h3>
          {chastityHistory.length > 0 ? (<div className="overflow-x-auto"><table className="min-w-full divide-y divide-purple-800"><thead className="bg-gray-700"><tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Start Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">End Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Raw Duration</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Pause Duration</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Effective Chastity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Reason</th>
            </tr></thead><tbody className="bg-gray-800 divide-y divide-purple-700">
            {chastityHistory.slice().reverse().map(p => {
                const effectiveDuration = (p.duration || 0) - (p.totalPauseDurationSeconds || 0);
                return (
                <tr key={p.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{p.periodNumber}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatTime(p.startTime, true)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatTime(p.endTime, true)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatElapsedTime(p.duration)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-300">{formatElapsedTime(p.totalPauseDurationSeconds || 0)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-green-400 font-semibold">{formatElapsedTime(effectiveDuration)}</td>
                    <td className="px-3 py-2 whitespace-pre-wrap text-sm text-purple-200 break-words max-w-xs">{p.reasonForRemoval}</td>
                </tr>);
            })}
            </tbody></table></div>) : <p className="text-center text-purple-200">No chastity history.</p>}
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
                                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{formatEventTypesForDisplay(event.types, event.otherTypeDetail, savedSubmissivesName)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{event.durationSeconds ? formatElapsedTime(event.durationSeconds) : 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatOrgasmCounts(event.selfOrgasmAmount, event.partnerOrgasmAmount)}</td>
                                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{event.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className="text-purple-200 text-center">No events logged yet.</p>}
        </div>
    );
};

export default FullReportPage;
