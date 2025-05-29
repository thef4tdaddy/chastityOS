import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, doc, getDoc, setDoc, Timestamp, setLogLevel,
    collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc
} from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYCYGOEU2Ki79sJHGF5LLOVzQeuF7Rz3E",
  authDomain: "chastityandflr.firebaseapp.com",
  projectId: "chastityandflr",
  storageBucket: "chastityandflr.firebasestorage.app",
  messagingSenderId: "662922033586",
  appId: "1:662922033586:web:70c6a7e537d1b30c444cab",
  measurementId: "G-QKERPT0S65"
  appId: "1:662922033586:web:70c6a7e537d1b30c444cab",
  measurementId: "G-QKERPT0S65"
};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-chastity-app';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
setLogLevel('debug'); 

// --- Utility Functions ---
const formatTime = (date, includeDate = false, forTextReport = false) => {
  if (!date) return 'N/A';
  const dateObj = date instanceof Date ? date : (date.toDate ? date.toDate() : null);
  if (!dateObj || isNaN(dateObj.getTime())) return 'Invalid Date';
  
  if (forTextReport) {
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
  if (includeDate) {
      return dateObj.toLocaleString('en-US', { ...timeOptions, year: 'numeric', month: '2-digit', day: '2-digit'});
  }
  return dateObj.toLocaleTimeString('en-US', timeOptions);
};

const formatElapsedTime = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const pad = (num) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
};

const EVENT_TYPES = ["Orgasm (Self)", "Orgasm (Partner)", "Ruined Orgasm", "Edging", "Tease & Denial", "Play Session", "Hygiene", "Medication", "Mood Entry"]; // "Other" handled separately

// --- ASCII Report Helper ---
const padString = (str, length, alignRight = false) => {
    const s = String(str === null || str === undefined ? '' : str);
    if (s.length >= length) return s.substring(0, length);
    const padding = ' '.repeat(length - s.length);
    return alignRight ? padding + s : s + padding;
};


// --- Sub-Components ---

// Tracker Page Component
const TrackerPage = (props) => { 
    const {
        isAuthReady, 
        isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory,
        handleToggleCage, showReasonModal, setShowReasonModal, reasonForRemoval, setReasonForRemoval, handleConfirmRemoval, handleCancelRemoval,
        // Pause feature props
        isPaused,
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
        pauseCooldownMessage 
    } = props;

    const isPausedBool = typeof isPaused === 'boolean' ? isPaused : false; 
    
    const mainChastityDisplayTime = Math.max(0, timeInChastity - accumulatedPauseTimeThisSession);

    return (
        <>
          {pauseCooldownMessage && ( 
            <div className="mb-4 p-3 bg-yellow-600/30 border border-yellow-500 rounded-lg text-sm text-yellow-200">
                {pauseCooldownMessage}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 md:mb-8">
             <div className="p-3 md:p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm"><p className="text-sm md:text-lg text-purple-300">Cage Last On :</p><p className="text-2xl md:text-4xl font-semibold text-purple-400">{formatTime(isCageOn ? cageOnTime : (chastityHistory.length > 0 ? chastityHistory[chastityHistory.length - 1].endTime : null))}</p></div>
            <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${isCageOn ? (isPausedBool ? 'bg-yellow-500/20 border-yellow-600' : 'bg-green-500/20 border-green-600') : 'bg-gray-800 border-purple-700'}`}> 
                <p className="text-sm md:text-lg text-purple-300">
                    Current Session In Chastity {isPausedBool ? '(Paused)' : ''}:
                </p>
                <p className={`text-2xl md:text-4xl font-bold ${isCageOn ? (isPausedBool ? 'text-yellow-400' : 'text-green-400') : 'text-purple-400'}`}>
                    {formatElapsedTime(mainChastityDisplayTime)} 
                </p>
                {isPausedBool && pauseStartTime && ( 
                     <p className="text-xs text-yellow-300 mt-1">Currently paused for: {formatElapsedTime(livePauseDuration)}</p>
                 )}
                {accumulatedPauseTimeThisSession > 0 && ( 
                    <p className="text-xs text-yellow-300 mt-1">Total time paused this session: {formatElapsedTime(isPausedBool && pauseStartTime ? accumulatedPauseTimeThisSession + livePauseDuration : accumulatedPauseTimeThisSession )}</p>
                )}
            </div>
            <div className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${!isCageOn && timeCageOff > 0 ? 'bg-red-500/20 border-red-600' : 'bg-gray-800 border-purple-700'}`}> 
                <p className="text-sm md:text-lg text-purple-300">Current Session Cage Off:</p>
                <p className={`text-2xl md:text-4xl font-bold ${!isCageOn && timeCageOff > 0 ? 'text-red-400' : 'text-purple-400'}`}>{formatElapsedTime(timeCageOff)}</p>
            </div>
            <div className="p-3 md:p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm"><p className="text-sm md:text-lg text-purple-300">Total Time In Chastity:</p><p className="text-2xl md:text-4xl font-bold text-purple-400">{formatElapsedTime(totalChastityTime)}</p></div>
            <div className="p-3 md:p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm sm:col-span-2"><p className="text-sm md:text-lg text-purple-300">Total Time Cage Off:</p><p className="text-2xl md:text-4xl font-bold text-purple-400">{formatElapsedTime(totalTimeCageOff)}</p></div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-3 justify-center">
            <button onClick={handleToggleCage} disabled={!isAuthReady || isPausedBool} className={`flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 ${isCageOn ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400'} text-white disabled:opacity-50`}>{isCageOn ? 'Cage Off / End Session' : 'Cage On / Start Session'}</button>
          </div>
          {isCageOn && (
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6 md:mb-8 justify-center">
                {!isPausedBool ? (
                    <button onClick={handleInitiatePause} disabled={!isAuthReady} className="flex-grow bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50">
                        Pause Session
                    </button>
                ) : (
                    <button onClick={handleResumeSession} disabled={!isAuthReady} className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50">
                        Resume Session
                    </button>
                )}
            </div>
          )}

           {/* Reason for Removal Modal */}
          {showReasonModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-purple-700">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-purple-300">Reason for Cage Removal:</h3>
                <textarea value={reasonForRemoval} onChange={(e) => setReasonForRemoval(e.target.value)} placeholder="Enter reason here (optional)" rows="4"
                  className="w-full p-2 mb-6 rounded-lg border border-purple-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                  <button onClick={handleConfirmRemoval} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirm Removal</button>
                  <button onClick={handleCancelRemoval} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {/* Pause Reason Modal */}
          {showPauseReasonModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-yellow-700">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-300">Reason for Pausing Session:</h3>
                <textarea value={reasonForPauseInput} onChange={(e) => setReasonForPauseInput(e.target.value)} placeholder="Enter reason here (optional)" rows="4"
                  className="w-full p-2 mb-6 rounded-lg border border-yellow-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"></textarea>
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                  <button onClick={handleConfirmPause} className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirm Pause</button>
                  <button onClick={handleCancelPauseModal} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
    );
};

// Full Report Page Component
const FullReportPage = ({
    savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff,
    totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, isLoadingEvents,
    isPaused, accumulatedPauseTimeThisSession,
    overallTotalPauseTime // New prop
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
          <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">Full Report</h2>
          <div className="mb-4"><strong>Submissive’s Name:</strong> {savedSubmissivesName || '(Not Set)'}</div>
          <div className="mb-4"><strong>User ID:</strong> {userId || 'N/A'}</div><hr className="my-3 border-purple-700"/>
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
          <div className="mb-1"><strong>Overall Total Paused Time:</strong> <span className="text-yellow-300">{formatElapsedTime(overallTotalPauseTime)}</span></div> {/* ADDED THIS LINE */}
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
                const effectiveDuration = p.duration - (p.totalPauseDurationSeconds || 0);
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

// Log Event Page Component
const LogEventPage = ({
    isAuthReady, newEventDate, setNewEventDate, newEventTime, setNewEventTime, 
    selectedEventTypes, handleEventTypeChange, otherEventTypeChecked, handleOtherEventTypeCheckChange,
    otherEventTypeDetail, setOtherEventTypeDetail,
    newEventNotes, setNewEventNotes, 
    newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, setNewEventDurationMinutes,
    newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount,
    handleLogNewEvent, eventLogMessage, isLoadingEvents, sexualEventsLog, savedSubmissivesName 
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

    const showSelfOrgasmAmountInput = selectedEventTypes.includes("Orgasm (Self)");
    const showPartnerOrgasmAmountInput = selectedEventTypes.includes("Orgasm (Partner)");

    return (
        <div className="p-0 md:p-4">
            <h2 className="text-2xl font-bold text-purple-300 mb-4">Sexual Event Log</h2>
            <form onSubmit={handleLogNewEvent} className="mb-8 p-4 bg-gray-800 rounded-lg border border-purple-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label htmlFor="eventDate" className="block text-sm font-medium text-purple-300 text-left">Event Date:</label><input type="date" id="eventDate" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/></div>
                    <div><label htmlFor="eventTime" className="block text-sm font-medium text-purple-300 text-left">Event Time:</label><input type="time" id="eventTime" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/></div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="eventDurationHours" className="block text-sm font-medium text-purple-300 text-left">Duration (Hours):</label>
                        <input type="number" id="eventDurationHours" value={newEventDurationHours} onChange={e => setNewEventDurationHours(e.target.value)} min="0" placeholder="H"
                               className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <div>
                        <label htmlFor="eventDurationMinutes" className="block text-sm font-medium text-purple-300 text-left">Duration (Minutes):</label>
                        <input type="number" id="eventDurationMinutes" value={newEventDurationMinutes} onChange={e => setNewEventDurationMinutes(e.target.value)} min="0" max="59" placeholder="M"
                               className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-purple-300 text-left mb-1">Event Type(s):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {EVENT_TYPES.map(type => {
                            const displayLabel = type === "Orgasm (Self)" && savedSubmissivesName 
                                               ? `Orgasm (${savedSubmissivesName})` 
                                               : type;
                            return (
                                <label key={type} className="flex items-center space-x-2 text-sm text-purple-200">
                                    <input type="checkbox" checked={selectedEventTypes.includes(type)} onChange={() => handleEventTypeChange(type)}
                                        className="form-checkbox h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
                                    <span>{displayLabel}</span>
                                </label>
                            );
                        })}
                        <label key="other" className="flex items-center space-x-2 text-sm text-purple-200">
                            <input type="checkbox" checked={otherEventTypeChecked} onChange={handleOtherEventTypeCheckChange}
                                   className="form-checkbox h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
                            <span>Other</span>
                        </label>
                    </div>
                    {otherEventTypeChecked && (
                        <input type="text" value={otherEventTypeDetail} onChange={e => setOtherEventTypeDetail(e.target.value)} placeholder="Specify other type"
                               className="mt-2 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500 text-sm"/>
                    )}
                </div>
                {showSelfOrgasmAmountInput && (
                     <div>
                        <label htmlFor="selfOrgasmAmount" className="block text-sm font-medium text-purple-300 text-left">
                            {savedSubmissivesName ? `Orgasm (${savedSubmissivesName}) Count:` : "Orgasm (Self) Count:"}
                        </label>
                        <input type="number" id="selfOrgasmAmount" value={newEventSelfOrgasmAmount} onChange={e => setNewEventSelfOrgasmAmount(e.target.value)} min="1" placeholder="Count"
                               className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                )}
                {showPartnerOrgasmAmountInput && (
                     <div>
                        <label htmlFor="partnerOrgasmAmount" className="block text-sm font-medium text-purple-300 text-left">Partner Orgasm Count:</label>
                        <input type="number" id="partnerOrgasmAmount" value={newEventPartnerOrgasmAmount} onChange={e => setNewEventPartnerOrgasmAmount(e.target.value)} min="1" placeholder="Count"
                               className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                )}
                <div><label htmlFor="eventNotes" className="block text-sm font-medium text-purple-300 text-left">Notes:</label><textarea id="eventNotes" value={newEventNotes} onChange={e => setNewEventNotes(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500" placeholder="Optional details..."></textarea></div>
                <button type="submit" disabled={!isAuthReady || isLoadingEvents} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50">Log Event</button>
                {eventLogMessage && <p className={`text-sm mt-2 ${eventLogMessage.includes('success') ? 'text-green-400' : 'text-red-500'}`}>{eventLogMessage}</p>}
            </form>
            <h3 className="text-xl font-semibold text-purple-300 mb-3">Logged Events</h3>
            {isLoadingEvents ? <p className="text-purple-200">Loading events...</p> : sexualEventsLog.length > 0 ? (
                <div className="overflow-x-auto bg-gray-800 rounded-lg border border-purple-700"><table className="min-w-full divide-y divide-purple-700"><thead className="bg-gray-700"><tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Date & Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Type(s)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Duration</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Orgasm Count(s)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Notes</th>
                </tr></thead><tbody className="divide-y divide-purple-700">
                {sexualEventsLog.map(event => (<tr key={event.id} className="hover:bg-purple-900/20">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatTime(event.eventTimestamp, true)}</td>
                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{formatEventTypesForDisplay(event.types, event.otherTypeDetail, savedSubmissivesName)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{event.durationSeconds ? formatElapsedTime(event.durationSeconds) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatOrgasmCounts(event.selfOrgasmAmount, event.partnerOrgasmAmount)}</td>
                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{event.notes}</td>
                </tr>))}</tbody></table></div>) : <p className="text-purple-200">No events logged yet.</p>}
        </div>
    );
};

// Settings Page Component
const SettingsPage = ({
    isAuthReady, 
    eventLogMessage, 
    handleExportTrackerCSV, chastityHistory,
    handleExportEventLogCSV, sexualEventsLog, handleResetAllData, confirmReset, nameMessage,
    handleExportTextReport,
    userId, 
    showUserIdInSettings, 
    handleToggleUserIdVisibility,
    savedSubmissivesName, 
    submissivesNameInput, 
    handleSubmissivesNameInputChange, 
    handleSetSubmissivesName
}) => { 
    return (
        <div className="p-0 md:p-4">
            <h2 className="text-2xl font-bold text-purple-300 mb-6">Settings</h2>

            {/* Profile Information Section */}
            <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Profile Information</h3>
                {/* Submissive's Name Setting */}
                {!savedSubmissivesName && isAuthReady && (
                    <div className="mb-4">
                        <label htmlFor="settingsSubmissivesName" className="block text-sm font-medium text-purple-300 mb-1 text-left">
                            Submissive’s Name: (Not Set)
                        </label>
                        <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                            <input type="text" id="settingsSubmissivesName" value={submissivesNameInput} onChange={handleSubmissivesNameInputChange} placeholder="Enter Submissive’s Name"
                                className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-purple-600 bg-gray-900 text-gray-50 text-sm focus:ring-purple-500 focus:border-purple-500"/>
                            <button onClick={handleSetSubmissivesName} disabled={!isAuthReady || !submissivesNameInput.trim()}
                                className="w-full mt-2 sm:mt-0 sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50">
                                Set Name
                            </button>
                        </div>
                    </div>
                )}
                 {savedSubmissivesName && (
                     <div className="mb-4 text-left">
                        <p className="text-sm font-medium text-purple-300">Submissive's Name:</p>
                        <p className="text-lg text-purple-100">{savedSubmissivesName}</p>
                        <p className="text-xs text-purple-400">(To change, use "Reset All Application Data" below.)</p>
                    </div>
                )}
                 {nameMessage && <p className={`text-xs mt-2 mb-3 text-left ${nameMessage.includes('successfully') || nameMessage.includes('set') ? 'text-green-400' : 'text-yellow-400'}`}>{nameMessage}</p>}


                {/* User ID Display */}
                <div>
                    <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Account ID</h4>
                    <button 
                        onClick={handleToggleUserIdVisibility} 
                        disabled={!isAuthReady}
                        className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 mb-3"
                    >
                        {showUserIdInSettings ? 'Hide User ID' : 'Show User ID'}
                    </button>
                    {showUserIdInSettings && userId && (
                        <div className="p-3 bg-gray-700 rounded-md text-left">
                            <p className="text-sm text-purple-300">
                                Your User ID: <span className="font-mono text-purple-100 select-all">{userId}</span>
                            </p>
                            <p className="text-xs text-purple-400 mt-1">
                                (This ID is used for data storage. Keep it safe if you ever need manual assistance with your data.)
                            </p>
                        </div>
                    )}
                    {showUserIdInSettings && !userId && isAuthReady && ( 
                        <p className="text-sm text-yellow-400 bg-gray-700 p-2 rounded text-left">User ID not available yet. Please wait for authentication to complete.</p>
                    )}
                </div>
                 {/* TO-DO: Add customization options for Keyholder/Partner (e.g., name, separate event logging) */}
                 <p className="text-xs text-purple-500 mt-4 text-left"><em>Future: Keyholder/Partner customization options will appear here.</em></p>
            </div>


            <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Data Management</h3>
                {/* TO-DO: Implement JSON Backup & Restore functionality */}
                <p className="text-sm text-purple-400 mb-4">Note: JSON Backup/Restore is a planned feature.</p>
                
                <hr className="my-4 border-purple-600"/>
                
                <h4 className="text-lg font-medium text-purple-200 mb-2">Export Data Options</h4>
                 <div className="flex flex-col space-y-3">
                    <button onClick={handleExportTextReport} disabled={!isAuthReady} className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
                        Export Verbose Text Report (.txt)
                    </button>
                    <button onClick={handleExportTrackerCSV} disabled={!isAuthReady || chastityHistory.length === 0} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
                        Export Tracker History CSV
                    </button>
                    <button onClick={handleExportEventLogCSV} disabled={!isAuthReady || sexualEventsLog.length === 0} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
                        Export Event Log CSV
                    </button>
                </div>
                {eventLogMessage && <p className={`text-xs mt-3 ${eventLogMessage.includes('successfully') || eventLogMessage.includes('restored') ? 'text-green-400' : 'text-yellow-400'}`}>{eventLogMessage}</p>}
            </div>
            
            <div className="p-4 bg-gray-800 border border-red-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Reset All Application Data</h3>
                <p className="text-sm text-purple-200 mb-3">This action is irreversible. It will delete all chastity history, event logs, and reset the Submissive's Name.</p>
                <button onClick={handleResetAllData} disabled={!isAuthReady}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 disabled:opacity-50">
                  {confirmReset ? 'Confirm Full Reset?' : 'Reset All Data'}
                </button>
                {confirmReset && (<p className="text-yellow-400 text-sm mt-3">Click again to permanently delete all data.</p>)}
                {nameMessage && <p className={`text-xs mt-2 ${nameMessage.includes('reset') ? 'text-green-400' : 'text-yellow-400'}`}>{nameMessage}</p>}
            </div>
        </div>
    );
};


// --- Main App Component (formerly ChastityTracker) ---
const App = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('tracker'); 
  const [showUserIdInSettings, setShowUserIdInSettings] = useState(false); 

  // Tracker Page State
  const [cageOnTime, setCageOnTime] = useState(null);
  const [isCageOn, setIsCageOn] = useState(false);
  const [timeInChastity, setTimeInChastity] = useState(0);
  const [timeCageOff, setTimeCageOff] = useState(0);
  const [chastityHistory, setChastityHistory] = useState([]);
  const [totalChastityTime, setTotalChastityTime] = useState(0);
  const [totalTimeCageOff, setTotalTimeCageOff] = useState(0);
  const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0); // New state for total paused time
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonForRemoval, setReasonForRemoval] = useState('');
  const [tempEndTime, setTempEndTime] = useState(null);
  const [tempStartTime, setTempStartTime] = useState(null);

  // Settings Page State
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTimeoutRef = useRef(null);

  // Submissive's Name states
  const [submissivesNameInput, setSubmissivesNameInput] = useState('');
  const [savedSubmissivesName, setSavedSubmissivesName] = useState('');
  const [nameMessage, setNameMessage] = useState('');

  // Event Log State
  const [sexualEventsLog, setSexualEventsLog] = useState([]);
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10)); 
  const [newEventTime, setNewEventTime] = useState(new Date().toTimeString().slice(0,5)); 
  const [selectedEventTypes, setSelectedEventTypes] = useState([]); 
  const [otherEventTypeChecked, setOtherEventTypeChecked] = useState(false);
  const [otherEventTypeDetail, setOtherEventTypeDetail] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventDurationHours, setNewEventDurationHours] = useState('');
  const [newEventDurationMinutes, setNewEventDurationMinutes] = useState('');
  const [newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount] = useState(''); 
  const [newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount] = useState(''); 
  const [eventLogMessage, setEventLogMessage] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Pause Feature State
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
  const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
  const [reasonForPauseInput, setReasonForPauseInput] = useState('');
  const [currentSessionPauseEvents, setCurrentSessionPauseEvents] = useState([]);
  const [livePauseDuration, setLivePauseDuration] = useState(0); 
  const pauseDisplayTimerRef = useRef(null);
  const [lastPauseEndTime, setLastPauseEndTime] = useState(null); 
  const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');


  const timerInChastityRef = useRef(null);
  const timerCageOffRef = useRef(null);

  const getDocRef = useCallback(() => { 
    if (!userId) return null;
    return doc(db, "artifacts", appId, "users", userId);
  }, [userId]); 

  const getEventsCollectionRef = useCallback(() => { 
    if (!userId || !db || !appId || userId.trim() === '' || appId.trim() === '') { 
        console.error("App.js: getEventsCollectionRef - Returning null due to missing/invalid userId, db, or appId.", { userId, dbExists: !!db, appId });
        return null;
    }
    try {
        const ref = collection(db, "artifacts", appId, "users", userId, "sexualEventsLog");
        return ref;
    } catch (error) {
        console.error("App.js: getEventsCollectionRef - Error creating collection reference:", error);
        return null;
    }
  }, [userId]); 
  
  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true); 
      } else {
        if (!userId && !isAuthReady) { 
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("App.js: Initial sign-in error:", error);
                setIsAuthReady(false); 
                setUserId(null);
                setIsLoading(false); 
            }
        } else {
            if (userId) console.log("App.js: User signed out or auth state changed to no user.");
            setUserId(null);
            setIsAuthReady(false);
        }
      }
    });
    return () => unsubscribe();
  }, []); 

  // Effect to calculate overall totals when chastityHistory changes
  useEffect(() => {
    let totalEffectiveChastity = 0;
    let totalRawCageOff = 0;
    let totalOverallPaused = 0;

    chastityHistory.forEach(period => {
        const effectiveDuration = period.duration - (period.totalPauseDurationSeconds || 0);
        totalEffectiveChastity += Math.max(0, effectiveDuration);
        if (period.endTime) { // Assuming cage off periods are derived from gaps or last entry
             // This logic for totalTimeCageOff might need refinement based on how it's truly calculated
        }
        totalOverallPaused += (period.totalPauseDurationSeconds || 0);
    });
    setTotalChastityTime(totalEffectiveChastity); // This now represents effective time
    setOverallTotalPauseTime(totalOverallPaused); // Set the new state

    // Recalculate totalTimeCageOff based on history if needed (more complex logic)
    // For now, totalTimeCageOff is updated when a session starts.
  }, [chastityHistory]);


  useEffect(() => { 
    if (!isAuthReady || !userId) {
      if(isLoading && !isAuthReady && !auth.currentUser) setIsLoading(false); 
      return;
    }
    const loadTrackerData = async () => {
      setIsLoading(true); 
      const docRef = getDocRef();
      if (!docRef) { setIsLoading(false); return; }
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          const loadedCageOnTime = data.cageOnTime?.toDate();
          setCageOnTime(loadedCageOnTime && !isNaN(loadedCageOnTime.getTime()) ? loadedCageOnTime : null);
          
          setIsCageOn(data.isCageOn || false);
          setTimeInChastity(data.timeInChastity || 0); 
          
          const loadedHistory = (data.chastityHistory || []).map(item => {
            const startTime = item.startTime?.toDate();
            const endTime = item.endTime?.toDate();
            return {
              ...item,
              startTime: startTime && !isNaN(startTime.getTime()) ? startTime : null,
              endTime: endTime && !isNaN(endTime.getTime()) ? endTime : null,
              pauses: (item.pauses || []).map(p => { 
                  const pStartTime = p.startTime?.toDate();
                  const pEndTime = p.endTime?.toDate();
                  return {
                      ...p, 
                      startTime: pStartTime && !isNaN(pStartTime.getTime()) ? pStartTime : null, 
                      endTime: pEndTime && !isNaN(pEndTime.getTime()) ? pEndTime : null
                  };
              })
            };
          });
          setChastityHistory(loadedHistory);
          
          // totalChastityTime and totalTimeCageOff will be recalculated by the other useEffect
          // setTotalChastityTime(data.totalChastityTime || 0); 
          setTotalTimeCageOff(data.totalTimeCageOff || 0); // Load this to be added to when a session starts

          const currentName = data.submissivesName || data.userAlias || '';
          setSavedSubmissivesName(currentName); 
          setSubmissivesNameInput(currentName); 

          setIsPaused(data.isPaused || false);
          const loadedPauseStartTime = data.pauseStartTime?.toDate();
          setPauseStartTime(loadedPauseStartTime && !isNaN(loadedPauseStartTime.getTime()) ? loadedPauseStartTime : null);
          setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
          setCurrentSessionPauseEvents((data.currentSessionPauseEvents || []).map(p => ({
              ...p,
              startTime: p.startTime?.toDate() && !isNaN(p.startTime.toDate().getTime()) ? p.startTime.toDate() : null,
              endTime: p.endTime?.toDate() && !isNaN(p.endTime.toDate().getTime()) ? p.endTime.toDate() : null,
          })));
          const loadedLastPauseEndTime = data.lastPauseEndTime?.toDate();
          setLastPauseEndTime(loadedLastPauseEndTime && !isNaN(loadedLastPauseEndTime.getTime()) ? loadedLastPauseEndTime : null);
          
          if (!data.isCageOn && data.isAuthReady) { // Check isAuthReady here too
            const currentHist = data.chastityHistory || []; 
            if (currentHist.length > 0) {
                const lastPeriod = currentHist[currentHist.length - 1];
                const lastEndTime = lastPeriod.endTime?.toDate(); 
                if (lastEndTime && !isNaN(lastEndTime.getTime())) {
                    const now = new Date();
                    const elapsedSeconds = Math.floor((now.getTime() - lastEndTime.getTime()) / 1000);
                    setTimeCageOff(elapsedSeconds > 0 ? elapsedSeconds : 0);
                } else { setTimeCageOff(0); }
            } else { setTimeCageOff(data.timeCageOff || 0); } 
          } else {
            setTimeCageOff(0); 
          }

        } else { 
           setTimeInChastity(0); setTimeCageOff(0); setIsCageOn(false);
           setChastityHistory([]); setTotalChastityTime(0); setTotalTimeCageOff(0);
           setSavedSubmissivesName(''); setSubmissivesNameInput('');
           setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
           setLastPauseEndTime(null); setOverallTotalPauseTime(0);
        }
      } catch (error) { console.error("Error loading tracker data:", error); } 
      finally { setIsLoading(false); }
    };
    loadTrackerData();
  }, [isAuthReady, userId, getDocRef]); 

  const fetchEvents = useCallback(async () => { 
    if (!isAuthReady || !userId) return;
    setIsLoadingEvents(true);
    const eventsColRef = getEventsCollectionRef();
    if (!eventsColRef) { 
        setEventLogMessage("Error: Could not get event log reference.");
        setTimeout(() => setEventLogMessage(''), 3000);
        setIsLoadingEvents(false); 
        return; 
    }
    try {
        const q = query(eventsColRef, orderBy("eventTimestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => {
            const eventData = doc.data();
            const eventTS = eventData.eventTimestamp?.toDate();
            return { 
                id: doc.id, 
                ...eventData, 
                eventTimestamp: eventTS && !isNaN(eventTS.getTime()) ? eventTS : new Date() 
            };
        });
        setSexualEventsLog(events);
    } catch (error) { 
        console.error("App.js: fetchEvents - Error fetching events:", error);
        setEventLogMessage("Failed to load events.");
        setTimeout(() => setEventLogMessage(''), 3000);
    } 
    finally { 
        setIsLoadingEvents(false); 
    }
  }, [isAuthReady, userId, getEventsCollectionRef]); 

  useEffect(() => { 
    if ((currentPage === 'logEvent' || currentPage === 'fullReport') && isAuthReady) { 
        fetchEvents(); 
    } 
  }, [currentPage, fetchEvents, isAuthReady]);

  const saveDataToFirestore = useCallback(async (dataToSave) => { 
    if (!isAuthReady || !userId) {
        console.warn("saveDataToFirestore: Auth not ready or no userId. Aborting save.");
        return;
    }
    const docRef = getDocRef();
    if (!docRef) {
        console.error("saveDataToFirestore: Could not get document reference. Aborting save.");
        return;
    }
    try {
      const firestoreReadyData = { ...dataToSave };
      const toTimestampIfDate = (date) => {
          if (date instanceof Date && !isNaN(date.getTime())) return Timestamp.fromDate(date);
          if (typeof date === 'string') { 
              const parsedDate = new Date(date);
              if (!isNaN(parsedDate.getTime())) return Timestamp.fromDate(parsedDate);
          }
          return null; 
      };

      firestoreReadyData.cageOnTime = toTimestampIfDate(firestoreReadyData.cageOnTime);
      if (firestoreReadyData.chastityHistory) {
        firestoreReadyData.chastityHistory = firestoreReadyData.chastityHistory.map(item => ({
          ...item,
          startTime: toTimestampIfDate(item.startTime),
          endTime: toTimestampIfDate(item.endTime),
          pauses: (item.pauses || []).map(p => ({
              ...p,
              startTime: toTimestampIfDate(p.startTime),
              endTime: toTimestampIfDate(p.endTime),
          }))
        }));
      }
      firestoreReadyData.pauseStartTime = toTimestampIfDate(firestoreReadyData.pauseStartTime);
      firestoreReadyData.lastPauseEndTime = toTimestampIfDate(firestoreReadyData.lastPauseEndTime); 
      if (firestoreReadyData.currentSessionPauseEvents) {
          firestoreReadyData.currentSessionPauseEvents = firestoreReadyData.currentSessionPauseEvents.map(p => ({
              ...p,
              startTime: toTimestampIfDate(p.startTime),
              endTime: toTimestampIfDate(p.endTime)
          }));
      }
      
      if (typeof firestoreReadyData.submissivesName === 'undefined') firestoreReadyData.submissivesName = savedSubmissivesName; 
      if (firestoreReadyData.hasOwnProperty('userAlias')) delete firestoreReadyData.userAlias;
      
      await setDoc(docRef, firestoreReadyData, { merge: true });
    } catch (error) { console.error("Error saving main data to Firestore:", error); }
  }, [userId, getDocRef, isAuthReady, savedSubmissivesName]); 
  
  useEffect(() => { 
    if (isCageOn && isPaused === false && isAuthReady) { 
      if (cageOnTime && cageOnTime instanceof Date && !isNaN(cageOnTime.getTime())) {
          const now = new Date();
          const initialElapsed = Math.max(0, Math.floor((now.getTime() - cageOnTime.getTime()) / 1000));
          if (timeInChastity === 0 || (cageOnTime && cageOnTime.getTime() !== (tempStartTime?.getTime() || 0))) { 
            setTimeInChastity(initialElapsed);
          }
      }
      timerInChastityRef.current = setInterval(() => {
        setTimeInChastity(prevTime => {
            console.log("Timer Tick (timeInChastity): prevTime =", prevTime, "newTime =", prevTime + 1, "isPaused in App scope:", isPaused); 
            return prevTime + 1;
        });
      }, 1000);
    } else {
      if (timerInChastityRef.current) {
        clearInterval(timerInChastityRef.current);
      }
    }
    return () => { 
      if (timerInChastityRef.current) {
        clearInterval(timerInChastityRef.current);
      }
    };
  }, [isCageOn, isPaused, cageOnTime, isAuthReady, timeInChastity, tempStartTime]); 

  useEffect(() => { 
    if (!isCageOn && isAuthReady) { 
      timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
    } else { 
      if (timerCageOffRef.current) {
        clearInterval(timerCageOffRef.current);
      }
    }
    return () => { 
      if (timerCageOffRef.current) {
        clearInterval(timerCageOffRef.current);
      }
    };
  }, [isCageOn, isAuthReady, timeCageOff]); 

  // Effect for live pause duration display
  useEffect(() => {
    if (isPaused && pauseStartTime) {
        console.log("App.js: Starting livePauseDuration interval. Pause Start Time:", pauseStartTime);
        setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000)); 
        pauseDisplayTimerRef.current = setInterval(() => {
            setLivePauseDuration(prev => prev + 1);
        }, 1000);
    } else {
        if (pauseDisplayTimerRef.current) {
            console.log("App.js: Clearing livePauseDuration interval.");
            clearInterval(pauseDisplayTimerRef.current);
        }
        setLivePauseDuration(0); 
    }
    return () => {
        if (pauseDisplayTimerRef.current) {
            console.log("App.js: Cleanup - Clearing livePauseDuration interval.");
            clearInterval(pauseDisplayTimerRef.current);
        }
    };
  }, [isPaused, pauseStartTime]);

  // --- Pause Feature Handlers ---
  const handleInitiatePause = useCallback(() => {
    console.log("App.js: handleInitiatePause called. LastPauseEndTime:", lastPauseEndTime);
    setPauseCooldownMessage(''); 
    if (lastPauseEndTime) {
        const twelveHoursInMillis = 12 * 60 * 60 * 1000;
        const timeSinceLastPauseEnd = new Date().getTime() - lastPauseEndTime.getTime();
        if (timeSinceLastPauseEnd < twelveHoursInMillis) {
            const remainingTime = twelveHoursInMillis - timeSinceLastPauseEnd;
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const cooldownMsg = `You can pause again in approximately ${hours}h ${minutes}m.`;
            console.warn("App.js: handleInitiatePause - Pause cooldown active.", cooldownMsg);
            setPauseCooldownMessage(cooldownMsg); 
            setTimeout(() => setPauseCooldownMessage(''), 5000);
            return;
        }
    }
    setShowPauseReasonModal(true);
  }, [lastPauseEndTime]);

  const handleConfirmPause = useCallback(async () => {
    console.log("App.js: handleConfirmPause called. Reason:", reasonForPauseInput);
    if (!isCageOn) {
        console.warn("App.js: handleConfirmPause - Cannot pause, cage is not on.");
        setShowPauseReasonModal(false);
        setReasonForPauseInput('');
        return;
    }
    const now = new Date();
    const newPauseEvent = {
        id: crypto.randomUUID(),
        startTime: now,
        reason: reasonForPauseInput.trim() || "No reason provided",
        endTime: null, 
        duration: null 
    };

    setIsPaused(true);
    setPauseStartTime(now);
    setCurrentSessionPauseEvents(prev => [...prev, newPauseEvent]);
    
    setShowPauseReasonModal(false);
    setReasonForPauseInput('');

    await saveDataToFirestore({ 
        isPaused: true, 
        pauseStartTime: now, 
        accumulatedPauseTimeThisSession, 
        currentSessionPauseEvents: [...currentSessionPauseEvents, newPauseEvent],
        lastPauseEndTime 
    });
    console.log("App.js: handleConfirmPause - Session paused. Firestore updated.");
  }, [isCageOn, reasonForPauseInput, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore, lastPauseEndTime]);

  const handleCancelPauseModal = useCallback(() => {
    console.log("App.js: handleCancelPauseModal called");
    setShowPauseReasonModal(false);
    setReasonForPauseInput('');
  }, []);

  const handleResumeSession = useCallback(async () => {
    console.log("App.js: handleResumeSession called. Pause start time:", pauseStartTime);
    if (!isPaused || !pauseStartTime) {
        console.warn("App.js: handleResumeSession - Not paused or no pause start time. Aborting resume.");
        setIsPaused(false); 
        setPauseStartTime(null);
        setLivePauseDuration(0); 
        return;
    }
    const endTime = new Date();
    const currentPauseDuration = Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000);
    const newAccumulatedPauseTime = accumulatedPauseTimeThisSession + currentPauseDuration;

    const updatedSessionPauses = currentSessionPauseEvents.map((event, index) => {
        if (index === currentSessionPauseEvents.length - 1 && !event.endTime) { 
            return { ...event, endTime, duration: currentPauseDuration };
        }
        return event;
    });

    setAccumulatedPauseTimeThisSession(newAccumulatedPauseTime);
    setIsPaused(false);
    setPauseStartTime(null);
    setCurrentSessionPauseEvents(updatedSessionPauses);
    setLivePauseDuration(0); 
    setLastPauseEndTime(endTime); 

    await saveDataToFirestore({ 
        isPaused: false, 
        pauseStartTime: null, 
        accumulatedPauseTimeThisSession: newAccumulatedPauseTime,
        currentSessionPauseEvents: updatedSessionPauses,
        lastPauseEndTime: endTime 
    });
    console.log("App.js: handleResumeSession - Session resumed. Accumulated pause:", newAccumulatedPauseTime, "Firestore updated.");
  }, [isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore]);


  // --- Original Handlers ---
  const handleToggleCage = useCallback(() => { 
    console.log("App.js: handleToggleCage called. Current isCageOn:", isCageOn, "isAuthReady:", isAuthReady, "isPaused:", isPaused);
    if (!isAuthReady) {
        console.warn("App.js: handleToggleCage - Auth not ready, returning.");
        return;
    }
    if (isPaused) {
        setNameMessage("Please resume the session before turning the cage off.");
        setTimeout(() => setNameMessage(''), 3000);
        console.warn("App.js: handleToggleCage - Attempted to toggle cage while paused.");
        return;
    }

    const currentTime = new Date();
    if (confirmReset) { setConfirmReset(false); if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current); }
    
    if (!isCageOn) { 
      console.log("App.js: handleToggleCage - Cage is OFF, attempting to turn ON.");
      const newTotalOff = totalTimeCageOff + timeCageOff; 
      setTotalTimeCageOff(newTotalOff); 
      setCageOnTime(currentTime); 
      setIsCageOn(true);
      setTimeInChastity(0); 
      setTimeCageOff(0);
      setAccumulatedPauseTimeThisSession(0);
      setCurrentSessionPauseEvents([]);
      setPauseStartTime(null);
      setIsPaused(false); 
      setLastPauseEndTime(null); 
      console.log("App.js: handleToggleCage - States set for Cage ON. Calling saveDataToFirestore.");
      saveDataToFirestore({ 
          isCageOn: true, cageOnTime: currentTime, totalTimeCageOff: newTotalOff, 
          timeInChastity: 0, 
          chastityHistory, totalChastityTime, submissivesName: savedSubmissivesName,
          isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
          lastPauseEndTime: null 
      }).then(() => {
          console.log("App.js: handleToggleCage - saveDataToFirestore for Cage ON successful.");
      }).catch(err => {
          console.error("App.js: handleToggleCage - saveDataToFirestore for Cage ON failed:", err);
      });
    } else { 
      console.log("App.js: handleToggleCage - Cage is ON, attempting to turn OFF. Showing modal.");
      setTempEndTime(currentTime); 
      setTempStartTime(cageOnTime); 
      setShowReasonModal(true); 
      console.log("App.js: handleToggleCage - ShowReasonModal set to true for removal.");
    }
  }, [isAuthReady, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, confirmReset, saveDataToFirestore, chastityHistory, totalChastityTime, savedSubmissivesName, resetTimeoutRef, isPaused, setNameMessage]);

  const handleConfirmRemoval = useCallback(() => { 
    console.log("App.js: handleConfirmRemoval called. isAuthReady:", isAuthReady); 
    if (!isAuthReady) {
        console.warn("App.js: handleConfirmRemoval - Auth not ready.");
        return;
    }
    console.log("App.js: handleConfirmRemoval - tempStartTime:", tempStartTime, "tempEndTime:", tempEndTime); 
    if (tempStartTime && tempEndTime) {
      const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));
      const effectiveDurationSeconds = rawDurationSeconds - accumulatedPauseTimeThisSession;
      console.log("App.js: handleConfirmRemoval - Raw duration:", rawDurationSeconds, "Accumulated pause:", accumulatedPauseTimeThisSession, "Effective duration:", effectiveDurationSeconds); 
      
      const newHistoryEntry = { 
        id: crypto.randomUUID(), periodNumber: chastityHistory.length + 1, 
        startTime: tempStartTime, endTime: tempEndTime, 
        duration: rawDurationSeconds, 
        reasonForRemoval: reasonForRemoval.trim() || 'No reason provided',
        totalPauseDurationSeconds: accumulatedPauseTimeThisSession, 
        pauseEvents: currentSessionPauseEvents 
      };
      const updatedHistoryState = [...chastityHistory, newHistoryEntry];
      setChastityHistory(updatedHistoryState); 
      const newTotalChastityState = totalChastityTime + Math.max(0, effectiveDurationSeconds); 
      
      console.log("App.js: handleConfirmRemoval - Adding to totalChastityTime:", Math.max(0, effectiveDurationSeconds));
      setTotalChastityTime(newTotalChastityState); 
      
      setIsCageOn(false); 
      setCageOnTime(null);
      setTimeInChastity(0); 
      setTimeCageOff(0); 
      setIsPaused(false);
      setPauseStartTime(null);
      setAccumulatedPauseTimeThisSession(0);
      setCurrentSessionPauseEvents([]);
      // lastPauseEndTime is not reset here, as it pertains to the last pause completed, not the session end.

      console.log("App.js: handleConfirmRemoval - States updated. Calling saveDataToFirestore."); 
      saveDataToFirestore({ 
          isCageOn: false, cageOnTime: null, timeInChastity: 0,
          chastityHistory: updatedHistoryState, totalChastityTime: newTotalChastityState, 
          totalTimeCageOff, submissivesName: savedSubmissivesName,
          isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
          lastPauseEndTime // Persist the lastPauseEndTime from the session
      });
    } else {
        console.warn("App.js: handleConfirmRemoval - tempStartTime or tempEndTime is missing."); 
    }
    setReasonForRemoval(''); 
    setTempEndTime(null); 
    setTempStartTime(null); 
    setShowReasonModal(false);
    console.log("App.js: handleConfirmRemoval - Modal should be closed now."); 
  }, [isAuthReady, tempStartTime, tempEndTime, chastityHistory, reasonForRemoval, totalChastityTime, saveDataToFirestore, totalTimeCageOff, savedSubmissivesName, accumulatedPauseTimeThisSession, currentSessionPauseEvents, lastPauseEndTime]);

  const handleCancelRemoval = useCallback(() => { 
    console.log("App.js: handleCancelRemoval called."); 
    setReasonForRemoval(''); 
    setTempEndTime(null); 
    setTempStartTime(null); 
    setShowReasonModal(false);
    console.log("App.js: handleCancelRemoval - Modal should be closed now."); 
  }, []);
  
  const clearAllEvents = useCallback(async () => { 
    console.log("App.js: clearAllEvents called. isAuthReady:", isAuthReady, "userId:", userId);
    if (!isAuthReady || !userId) {
        console.warn("App.js: clearAllEvents - Skipping, auth not ready or no userId.");
        return;
    }
    const eventsColRef = getEventsCollectionRef();
    if (!eventsColRef) {
        console.error("App.js: clearAllEvents - eventsColRef is null, cannot clear events.");
        return;
    }
    console.log("App.js: clearAllEvents - Attempting to clear events from path:", eventsColRef.path);
    try {
        const q = query(eventsColRef); 
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, eventsColRef.path, docSnapshot.id)));
        await Promise.all(deletePromises);
        setSexualEventsLog([]); 
        console.log("App.js: clearAllEvents - All sexual events cleared from Firestore and local state.");
    } catch (error) { 
        console.error("App.js: clearAllEvents - Error clearing sexual events:", error); 
    }
  }, [isAuthReady, userId, getEventsCollectionRef]); 

  const handleResetAllData = useCallback(() => { 
      console.log("App.js: handleResetAllData called. isAuthReady:", isAuthReady, "confirmReset:", confirmReset);
      if (!isAuthReady) {
        console.warn("App.js: handleResetAllData - Auth not ready, returning.");
        return;
      }
      // Removed confirmRestore check
      if (confirmReset) {
        console.log("App.js: handleResetAllData - Proceeding with reset.");
        try {
            if (timerInChastityRef.current) clearInterval(timerInChastityRef.current); 
            if (timerCageOffRef.current) clearInterval(timerCageOffRef.current); 
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            
            setCageOnTime(null); setIsCageOn(false); setTimeInChastity(0); setTimeCageOff(0); setChastityHistory([]);
            setTotalChastityTime(0); setTotalTimeCageOff(0); setSavedSubmissivesName(''); setSubmissivesNameInput('');
            setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]); 
            setLastPauseEndTime(null); 
            
            setConfirmReset(false); setShowReasonModal(false); 
            console.log("App.js: handleResetAllData - Local state cleared. Calling saveDataToFirestore and clearAllEvents.");
            saveDataToFirestore({ 
                cageOnTime: null, isCageOn: false, timeInChastity: 0, chastityHistory: [], 
                totalChastityTime: 0, totalTimeCageOff: 0, submissivesName: '',
                isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
                lastPauseEndTime: null 
            });
            clearAllEvents(); 
            setNameMessage("All data reset. Submissive's Name cleared."); 
            setTimeout(() => setNameMessage(''), 4000);
            setCurrentPage('tracker'); 
            console.log("App.js: handleResetAllData - Reset complete.");
        } catch (error) {
            console.error("App.js: handleResetAllData - Error during reset process:", error);
            setNameMessage("Error during reset. Check console.");
            setTimeout(() => setNameMessage(''), 4000);
        }
      } else { 
        console.log("App.js: handleResetAllData - First click, setting confirmReset to true.");
        setConfirmReset(true); 
        resetTimeoutRef.current = setTimeout(() => {
            console.log("App.js: handleResetAllData - Reset confirmation timed out.");
            setConfirmReset(false);
        }, 3000); 
      }
  }, [isAuthReady, confirmReset, saveDataToFirestore, clearAllEvents, setCurrentPage, setNameMessage, setConfirmReset, resetTimeoutRef]);
  
  const handleSubmissivesNameInputChange = useCallback((event) => { 
    console.log("Submissive Name Input Changed:", event.target.value);
    setSubmissivesNameInput(event.target.value); 
  }, []);

  const handleSetSubmissivesName = useCallback(async () => {
      console.log("App.js: handleSetSubmissivesName called. isAuthReady:", isAuthReady);
      if (!isAuthReady || !userId) { setNameMessage("Cannot set name: User not authenticated."); setTimeout(() => setNameMessage(''), 3000); return; }
      if (savedSubmissivesName) { setNameMessage("Name is already set. Perform a 'Reset All Data' in Settings to change it."); setTimeout(() => setNameMessage(''), 4000); return; }
      const trimmedName = submissivesNameInput.trim();
      if (!trimmedName) { setNameMessage("Name cannot be empty."); setTimeout(() => setNameMessage(''), 3000); return; }
      setSavedSubmissivesName(trimmedName);
      await saveDataToFirestore({ submissivesName: trimmedName, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime });
      setNameMessage("Submissive's Name set successfully!"); setTimeout(() => setNameMessage(''), 3000);
  }, [isAuthReady, userId, savedSubmissivesName, submissivesNameInput, saveDataToFirestore, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime]);
  
  const handleToggleUserIdVisibility = useCallback(() => { 
    setShowUserIdInSettings(prev => !prev);
  }, []);

  // Event Log Handlers
  const handleEventTypeChange = useCallback((type) => {
    setSelectedEventTypes(prev => 
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const handleOtherEventTypeCheckChange = useCallback((e) => {
    setOtherEventTypeChecked(e.target.checked);
    if (!e.target.checked) {
        setOtherEventTypeDetail(''); 
    }
  }, []);

  const handleLogNewEvent = useCallback(async (e) => { 
    console.log("App.js: handleLogNewEvent called. isAuthReady:", isAuthReady, "Current component's userId:", userId);
    e.preventDefault();
    console.log("App.js: handleLogNewEvent - After preventDefault."); 

    if (!isAuthReady || !userId) { 
        setEventLogMessage("Authentication required or User ID missing.");
        console.error("App.js: handleLogNewEvent - Auth/User ID check failed. isAuthReady:", isAuthReady, "userId:", userId);
        setTimeout(() => setEventLogMessage(''), 3000); 
        return; 
    }
    console.log("App.js: handleLogNewEvent - Auth/User ID check passed.");
    
    const finalEventTypes = [...selectedEventTypes];
    let finalOtherDetail = null;
    if (otherEventTypeChecked && otherEventTypeDetail.trim()) {
        finalOtherDetail = otherEventTypeDetail.trim();
    }
    console.log("App.js: handleLogNewEvent - finalEventTypes:", finalEventTypes, "finalOtherDetail:", finalOtherDetail);

    if (finalEventTypes.length === 0 && !finalOtherDetail) {
        setEventLogMessage("Please select at least one event type or specify 'Other'.");
        console.log("App.js: handleLogNewEvent - No event type selected validation triggered.");
        setTimeout(() => setEventLogMessage(''), 3000);
        return;
    }
    console.log("App.js: handleLogNewEvent - Event type validation passed.");
    console.log("App.js: handleLogNewEvent - About to call getEventsCollectionRef. Current appId:", appId, "Current db exists:", !!db);


    const eventsColRef = getEventsCollectionRef(); 
    console.log("App.js: handleLogNewEvent - eventsColRef from getEventsCollectionRef():", eventsColRef ? eventsColRef.path : "null");

    if (!eventsColRef) {
        setEventLogMessage("Error: Event log reference could not be created. Check console.");
        console.error("App.js: handleLogNewEvent - eventsColRef is null. This means getEventsCollectionRef() returned null. Check logs from getEventsCollectionRef.");
        setTimeout(() => setEventLogMessage(''), 3000);
        return;
    }
    console.log("App.js: handleLogNewEvent - eventsColRef is valid:", eventsColRef.path);
    
    const dateTimeString = `${newEventDate}T${newEventTime}`;
    const eventTimestamp = new Date(dateTimeString);
    if (isNaN(eventTimestamp.getTime())) { 
        setEventLogMessage("Invalid date/time.");
        console.log("App.js: handleLogNewEvent - Invalid date/time constructed:", dateTimeString);
        setTimeout(() => setEventLogMessage(''), 3000); 
        return; 
    }
    console.log("App.js: handleLogNewEvent - Event timestamp constructed:", eventTimestamp);
    
    const durationHours = parseInt(newEventDurationHours, 10) || 0;
    const durationMinutes = parseInt(newEventDurationMinutes, 10) || 0;
    const durationSeconds = (durationHours * 3600) + (durationMinutes * 60);
    
    const selfOrgasmAmount = selectedEventTypes.includes("Orgasm (Self)") && newEventSelfOrgasmAmount 
                             ? parseInt(newEventSelfOrgasmAmount, 10) || null : null;
    const partnerOrgasmAmount = selectedEventTypes.includes("Orgasm (Partner)") && newEventPartnerOrgasmAmount
                                ? parseInt(newEventPartnerOrgasmAmount, 10) || null : null;

    const newEventData = { 
        eventTimestamp: Timestamp.fromDate(eventTimestamp), 
        loggedAt: serverTimestamp(), 
        types: finalEventTypes, 
        otherTypeDetail: finalOtherDetail, 
        notes: newEventNotes.trim(),
        durationSeconds: durationSeconds > 0 ? durationSeconds : null,
        selfOrgasmAmount: selfOrgasmAmount,
        partnerOrgasmAmount: partnerOrgasmAmount
    };
    console.log("App.js: handleLogNewEvent - Attempting to add event to Firestore with data:", newEventData);
    try {
        const docRef = await addDoc(eventsColRef, newEventData); 
        console.log("App.js: handleLogNewEvent - Event logged successfully with ID:", docRef.id);
        setEventLogMessage("Event logged successfully!");
        setNewEventDate(new Date().toISOString().slice(0, 10)); 
        setNewEventTime(new Date().toTimeString().slice(0,5));
        setSelectedEventTypes([]); 
        setOtherEventTypeChecked(false);
        setOtherEventTypeDetail('');
        setNewEventNotes('');
        setNewEventDurationHours('');
        setNewEventDurationMinutes('');
        setNewEventSelfOrgasmAmount(''); 
        setNewEventPartnerOrgasmAmount(''); 
        fetchEvents(); 
    } catch (error) { 
        console.error("App.js: handleLogNewEvent - Error logging event to Firestore:", error); 
        setEventLogMessage("Failed to log event. Check console for details."); 
    }
    setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, userId, selectedEventTypes, otherEventTypeChecked, otherEventTypeDetail, newEventDate, newEventTime, newEventDurationHours, newEventDurationMinutes, newEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, newEventNotes, getEventsCollectionRef, fetchEvents, setEventLogMessage, setNewEventDate, setNewEventTime, setSelectedEventTypes, setOtherEventTypeChecked, setOtherEventTypeDetail, setNewEventNotes, setNewEventDurationHours, setNewEventDurationMinutes, setNewEventSelfOrgasmAmount, setNewEventPartnerOrgasmAmount ]);
  
  const handleExportTrackerCSV = useCallback(() => { /* ... */ }, [isAuthReady, chastityHistory, totalChastityTime, totalTimeCageOff]);
  const handleExportEventLogCSV = useCallback(() => { /* ... */ }, [isAuthReady, sexualEventsLog, savedSubmissivesName]);
  const handleExportTextReport = useCallback(() => { /* ... */ }, [isAuthReady, savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, overallTotalPauseTime]);


  // Main Render
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-300 mb-2">Chastity Time Tracking</h1>
        {savedSubmissivesName && <p className="text-lg text-purple-200 mb-4">For: <span className="font-semibold">{savedSubmissivesName}</span></p>}

        <nav className="mb-6 flex justify-center space-x-1 sm:space-x-2">
            {[{id: 'tracker', name: 'Tracker'}, {id: 'fullReport', name: 'Full Report'}, {id: 'logEvent', name: 'Log Event'}, {id: 'settings', name: 'Settings'}].map((page) => (
            <button key={page.id} onClick={() => setCurrentPage(page.id)}
                className={`py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${currentPage === page.id ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-700 text-purple-300 hover:bg-purple-500 hover:text-white'}`}>
                {page.name}
            </button>
            ))}
        </nav>

        {currentPage === 'tracker' && (
            <TrackerPage
                isAuthReady={isAuthReady}
                isCageOn={isCageOn}
                cageOnTime={cageOnTime}
                timeInChastity={timeInChastity}
                timeCageOff={timeCageOff}
                totalChastityTime={totalChastityTime}
                totalTimeCageOff={totalTimeCageOff}
                chastityHistory={chastityHistory}
                handleToggleCage={handleToggleCage}
                showReasonModal={showReasonModal}
                setShowReasonModal={setShowReasonModal}
                reasonForRemoval={reasonForRemoval}
                setReasonForRemoval={setReasonForRemoval}
                handleConfirmRemoval={handleConfirmRemoval}
                handleCancelRemoval={handleCancelRemoval}
                // Pause feature props
                isPaused={isPaused}
                handleInitiatePause={handleInitiatePause}
                handleResumeSession={handleResumeSession}
                showPauseReasonModal={showPauseReasonModal}
                handleCancelPauseModal={handleCancelPauseModal}
                reasonForPauseInput={reasonForPauseInput}
                setReasonForPauseInput={setReasonForPauseInput}
                handleConfirmPause={handleConfirmPause}
                accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
                pauseStartTime={pauseStartTime}
                livePauseDuration={livePauseDuration} 
                pauseCooldownMessage={pauseCooldownMessage}
            />
        )}

        {currentPage === 'fullReport' && (
            <FullReportPage
                savedSubmissivesName={savedSubmissivesName}
                userId={userId}
                isCageOn={isCageOn}
                cageOnTime={cageOnTime}
                timeInChastity={timeInChastity}
                timeCageOff={timeCageOff}
                totalChastityTime={totalChastityTime}
                totalTimeCageOff={totalTimeCageOff}
                chastityHistory={chastityHistory}
                sexualEventsLog={sexualEventsLog}
                isLoadingEvents={isLoadingEvents}
                isPaused={isPaused} 
                accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession} 
                overallTotalPauseTime={overallTotalPauseTime}
            />
        )}

        {currentPage === 'logEvent' && (
            <LogEventPage
                isAuthReady={isAuthReady}
                newEventDate={newEventDate} setNewEventDate={setNewEventDate}
                newEventTime={newEventTime} setNewEventTime={setNewEventTime}
                
                selectedEventTypes={selectedEventTypes} handleEventTypeChange={handleEventTypeChange}
                otherEventTypeChecked={otherEventTypeChecked} handleOtherEventTypeCheckChange={handleOtherEventTypeCheckChange}
                otherEventTypeDetail={otherEventTypeDetail} setOtherEventTypeDetail={setOtherEventTypeDetail}

                newEventNotes={newEventNotes} setNewEventNotes={setNewEventNotes}
                newEventDurationHours={newEventDurationHours} setNewEventDurationHours={setNewEventDurationHours}
                newEventDurationMinutes={newEventDurationMinutes} setNewEventDurationMinutes={setNewEventDurationMinutes}
                newEventSelfOrgasmAmount={newEventSelfOrgasmAmount} setNewEventSelfOrgasmAmount={setNewEventSelfOrgasmAmount}
                newEventPartnerOrgasmAmount={newEventPartnerOrgasmAmount} setNewEventPartnerOrgasmAmount={setNewEventPartnerOrgasmAmount}
                handleLogNewEvent={handleLogNewEvent}
                eventLogMessage={eventLogMessage}
                isLoadingEvents={isLoadingEvents}
                sexualEventsLog={sexualEventsLog}
                savedSubmissivesName={savedSubmissivesName} 
            />
        )}

        {currentPage === 'settings' && (
            <SettingsPage
                isAuthReady={isAuthReady}
                eventLogMessage={eventLogMessage} 
                handleExportTrackerCSV={handleExportTrackerCSV}
                chastityHistory={chastityHistory}
                handleExportEventLogCSV={handleExportEventLogCSV}
                sexualEventsLog={sexualEventsLog}
                handleResetAllData={handleResetAllData}
                confirmReset={confirmReset}
                nameMessage={nameMessage}
                handleExportTextReport={handleExportTextReport}
                userId={userId} 
                showUserIdInSettings={showUserIdInSettings} 
                handleToggleUserIdVisibility={handleToggleUserIdVisibility} 
                savedSubmissivesName={savedSubmissivesName}
                submissivesNameInput={submissivesNameInput}
                handleSubmissivesNameInputChange={handleSubmissivesNameInputChange}
                handleSetSubmissivesName={handleSetSubmissivesName}
            />
        )}
      </div>
    </div>
  );
};

export default App;
