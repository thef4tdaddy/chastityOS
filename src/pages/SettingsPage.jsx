// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { formatElapsedTime, formatTime } from '../utils';

const SettingsPage = (props) => {
    const {
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
        handleSetSubmissivesName,
        restoreUserIdInput,
        handleRestoreUserIdInputChange,
        handleInitiateRestoreFromId,
        showRestoreFromIdPrompt,
        handleConfirmRestoreFromId,
        handleCancelRestoreFromId,
        restoreFromIdMessage,
        currentGoalDurationSeconds,
        handleSetGoalDuration,
        
        // Keyholder Props (re-added)
        keyholderName,
        handleSetKeyholder,
        handleClearKeyholder,
        handleUnlockKeyholderControls,
        isKeyholderModeUnlocked,
        handleLockKeyholderControls,
        requiredKeyholderDurationSeconds,
        handleSetRequiredDuration,
        keyholderMessage,
        setKeyholderMessage,

        // Props for editing session start
        editSessionDateInput,
        setEditSessionDateInput,
        editSessionTimeInput,
        setEditSessionTimeInput,
        handleUpdateCurrentCageOnTime,
        editSessionMessage,
        isCurrentSessionActive, 
        cageOnTime 

    } = props;

    const [goalDays, setGoalDays] = useState('');
    const [goalHours, setGoalHours] = useState('');
    const [goalMinutes, setGoalMinutes] = useState('');
    const [goalMessage, setGoalMessage] = useState('');

    // Keyholder specific state for inputs
    const [khNameInput, setKhNameInput] = useState('');
    const [khPasswordInput, setKhPasswordInput] = useState('');
    const [khPasswordPreview, setKhPasswordPreview] = useState('');
    const [khRequiredDurationDays, setKhRequiredDurationDays] = useState('');
    const [khRequiredDurationHours, setKhRequiredDurationHours] = useState('');
    const [khRequiredDurationMinutes, setKhRequiredDurationMinutes] = useState('');


    useEffect(() => {
        if (currentGoalDurationSeconds !== null && currentGoalDurationSeconds > 0) {
            const days = Math.floor(currentGoalDurationSeconds / (24 * 3600));
            const remainingSecondsAfterDays = currentGoalDurationSeconds % (24 * 3600);
            const hours = Math.floor(remainingSecondsAfterDays / 3600);
            const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;
            const minutes = Math.floor(remainingSecondsAfterHours / 60);
            setGoalDays(days > 0 ? String(days) : '');
            setGoalHours(hours > 0 ? String(hours) : '');
            setGoalMinutes(minutes > 0 ? String(minutes) : '');
        } else {
            setGoalDays('');
            setGoalHours('');
            setGoalMinutes('');
        }
    }, [currentGoalDurationSeconds]);
    
    useEffect(() => {
        if (requiredKeyholderDurationSeconds !== null && requiredKeyholderDurationSeconds > 0) {
            const days = Math.floor(requiredKeyholderDurationSeconds / (24 * 3600));
            const remainingSecondsAfterDays = requiredKeyholderDurationSeconds % (24 * 3600);
            const hours = Math.floor(remainingSecondsAfterDays / 3600);
            const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;
            const minutes = Math.floor(remainingSecondsAfterHours / 60);
            setKhRequiredDurationDays(days > 0 ? String(days) : '');
            setKhRequiredDurationHours(hours > 0 ? String(hours) : '');
            setKhRequiredDurationMinutes(minutes > 0 ? String(minutes) : '');
        } else {
            setKhRequiredDurationDays('');
            setKhRequiredDurationHours('');
            setKhRequiredDurationMinutes('');
        }
    }, [requiredKeyholderDurationSeconds]);


    const handleSaveGoalDuration = async () => {
        const days = parseInt(goalDays, 10) || 0;
        const hours = parseInt(goalHours, 10) || 0;
        const minutes = parseInt(goalMinutes, 10) || 0;

        if (days < 0 || hours < 0 || minutes < 0) {
            setGoalMessage("Durations cannot be negative.");
            setTimeout(() => setGoalMessage(''), 3000);
            return;
        }
        if (hours >= 24 || minutes >= 60) {
             setGoalMessage("Invalid hours (0-23) or minutes (0-59).");
             setTimeout(() => setGoalMessage(''), 3000);
             return;
        }
        const totalSeconds = (days * 24 * 3600) + (hours * 3600) + (minutes * 60);
        if (totalSeconds <= 0 && (goalDays || goalHours || goalMinutes)) {
            setGoalMessage("Goal duration must be > 0, or leave fields blank to clear.");
            setTimeout(() => setGoalMessage(''), 4000);
            return;
        }
        const success = await handleSetGoalDuration(totalSeconds > 0 ? totalSeconds : null);
        setGoalMessage(success ? (totalSeconds > 0 ? "Goal updated!" : "Goal cleared!") : "Failed to update goal.");
        setTimeout(() => setGoalMessage(''), 3000);
    };
    
    const handleClearGoalDuration = async () => {
        setGoalDays(''); setGoalHours(''); setGoalMinutes('');
        const success = await handleSetGoalDuration(null);
        setGoalMessage(success ? "Goal cleared!" : "Failed to clear goal.");
        setTimeout(() => setGoalMessage(''), 3000);
    };

    const handleExportClick = (type) => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'export_click', export_type: type });
        if (type === 'text') handleExportTextReport();
        else if (type === 'tracker') handleExportTrackerCSV();
        else if (type === 'eventlog') handleExportEventLogCSV();
    };

    const onSetKeyholder = async () => {
        if (!khNameInput.trim()) {
            setKeyholderMessage("Keyholder name is required.");
            setTimeout(() => setKeyholderMessage(''), 3000);
            return;
        }
        const preview = await handleSetKeyholder(khNameInput);
        if (preview) {
            setKhPasswordPreview(preview);
        }
        setKhNameInput(''); // Clear input after setting
    };

    const onUnlockControls = async () => {
        await handleUnlockKeyholderControls(khPasswordInput);
        setKhPasswordInput(''); // Clear password input
    };
    
    const onSetKHRequiredDuration = async () => {
        const days = parseInt(khRequiredDurationDays, 10) || 0;
        const hours = parseInt(khRequiredDurationHours, 10) || 0;
        const minutes = parseInt(khRequiredDurationMinutes, 10) || 0;

        if (days < 0 || hours < 0 || minutes < 0) {
            setKeyholderMessage("Durations cannot be negative.");
            setTimeout(() => setKeyholderMessage(''), 3000);
            return;
        }
         if (hours >= 24 || minutes >= 60) {
             setKeyholderMessage("Invalid hours (0-23) or minutes (0-59).");
             setTimeout(() => setKeyholderMessage(''), 3000);
             return;
        }
        const totalSeconds = (days * 24 * 3600) + (hours * 3600) + (minutes * 60);
        if (totalSeconds <= 0 && (khRequiredDurationDays || khRequiredDurationHours || khRequiredDurationMinutes) ) {
             setKeyholderMessage("Required duration must be > 0, or leave blank to clear.");
             setTimeout(() => setKeyholderMessage(''), 4000);
             return;
        }
        await handleSetRequiredDuration(totalSeconds > 0 ? totalSeconds : null);
         if (totalSeconds === 0) { // Explicitly clearing
            setKhRequiredDurationDays('');
            setKhRequiredDurationHours('');
            setKhRequiredDurationMinutes('');
        }
    };


    return (
        <div className="p-0 md:p-4">
            {/* Profile Information Section */}
            <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
                {/* ... Same as before ... */}
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Profile Information</h3>
                {!savedSubmissivesName && isAuthReady && (
                    <div className="mb-4">
                        <label htmlFor="settingsSubmissivesName" className="block text-sm font-medium text-purple-300 mb-1 text-left">
                            Submissive's Name: (Not Set)
                        </label>
                        <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                            <input type="text" id="settingsSubmissivesName" value={submissivesNameInput || ''} onChange={handleSubmissivesNameInputChange} placeholder="Enter Submissive's Name"
                                className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-purple-600 bg-gray-900 text-gray-50 text-sm focus:ring-purple-500 focus:border-purple-500"/>
                            <button type="button" onClick={handleSetSubmissivesName}
                                    disabled={!isAuthReady || !(submissivesNameInput || '').trim()}
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
                <div>
                    <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Account ID</h4>
                    <button type="button" onClick={handleToggleUserIdVisibility} disabled={!isAuthReady}
                        className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 mb-3">
                        {showUserIdInSettings ? 'Hide User ID' : 'Show User ID'}
                    </button>
                    {showUserIdInSettings && userId && ( <div className="p-3 bg-gray-700 rounded-md text-left"> <p className="text-sm text-purple-300"> Your User ID: <span className="font-mono text-purple-100 select-all">{userId}</span> </p> <p className="text-xs text-purple-400 mt-1"> (This ID is used for data storage. Keep it safe if you ever need manual assistance with your data.) </p> </div> )}
                    {showUserIdInSettings && !userId && isAuthReady && ( <p className="text-sm text-yellow-400 bg-gray-700 p-2 rounded text-left">User ID not available yet. Please wait for authentication to complete.</p> )}
                </div>
            </div>

            {/* Keyholder Setup & Controls Section - NEW/RE-ADDED */}
            <div className="mb-8 p-4 bg-gray-800 border border-pink-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-pink-300 mb-4">Keyholder Mode</h3>
                {!keyholderName ? (
                    <>
                        <p className="text-sm text-purple-200 mb-2 text-left">Set up a Keyholder to manage session durations.</p>
                        <div className="mb-3">
                            <label htmlFor="khNameInput" className="block text-sm font-medium text-purple-300 mb-1 text-left">Keyholder's Name:</label>
                            <input type="text" id="khNameInput" value={khNameInput} onChange={(e) => setKhNameInput(e.target.value)} placeholder="Enter Keyholder's Name"
                                   className="w-full px-3 py-1.5 rounded-md border border-pink-600 bg-gray-900 text-gray-50 text-sm focus:ring-pink-500 focus:border-pink-500"/>
                        </div>
                        <button type="button" onClick={onSetKeyholder} disabled={!isAuthReady || !khNameInput.trim()}
                                className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50">
                            Set Keyholder & Generate Password Preview
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-purple-300 mb-1 text-left">Keyholder: <span className="font-semibold text-pink-200">{keyholderName}</span></p>
                        {khPasswordPreview && !isKeyholderModeUnlocked && (
                            <p className="text-sm text-yellow-300 bg-yellow-900/50 p-2 rounded-md my-2 text-left">
                                Password Preview (share with Keyholder): <strong className="font-mono select-all">{khPasswordPreview}</strong>
                            </p>
                        )}
                        
                        {!isKeyholderModeUnlocked ? (
                            <div className="mt-3">
                                <label htmlFor="khPasswordInput" className="block text-sm font-medium text-purple-300 mb-1 text-left">Enter Keyholder Password Preview:</label>
                                <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                                    <input type="text" id="khPasswordInput" value={khPasswordInput} onChange={(e) => setKhPasswordInput(e.target.value)} placeholder="Enter 8-char preview" maxLength="8"
                                           className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-pink-600 bg-gray-900 text-gray-50 text-sm focus:ring-pink-500 focus:border-pink-500"/>
                                    <button type="button" onClick={onUnlockControls} disabled={!isAuthReady || khPasswordInput.length !== 8}
                                            className="w-full mt-2 sm:mt-0 sm:w-auto bg-pink-500 hover:bg-pink-600 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50">
                                        Unlock Controls
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 pt-3 border-t border-pink-700">
                                <h4 className="text-lg font-medium text-pink-200 mb-2 text-left">Keyholder Controls (Unlocked)</h4>
                                 <p className="text-sm text-purple-200 mb-1 text-left">
                                    Current Required Duration: {requiredKeyholderDurationSeconds && requiredKeyholderDurationSeconds > 0 ? formatElapsedTime(requiredKeyholderDurationSeconds) : "Not Set"}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                    <div>
                                        <label htmlFor="khDays" className="block text-xs font-medium text-purple-300 mb-1 text-left">Days:</label>
                                        <input type="number" id="khDays" value={khRequiredDurationDays} onChange={(e) => setKhRequiredDurationDays(e.target.value)} placeholder="DD" min="0"
                                               className="w-full px-3 py-1.5 rounded-md border border-pink-600 bg-gray-900 text-gray-50 text-sm focus:ring-pink-500 focus:border-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="khHours" className="block text-xs font-medium text-purple-300 mb-1 text-left">Hours:</label>
                                        <input type="number" id="khHours" value={khRequiredDurationHours} onChange={(e) => setKhRequiredDurationHours(e.target.value)} placeholder="HH" min="0" max="23"
                                               className="w-full px-3 py-1.5 rounded-md border border-pink-600 bg-gray-900 text-gray-50 text-sm focus:ring-pink-500 focus:border-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="khMinutes" className="block text-xs font-medium text-purple-300 mb-1 text-left">Minutes:</label>
                                        <input type="number" id="khMinutes" value={khRequiredDurationMinutes} onChange={(e) => setKhRequiredDurationMinutes(e.target.value)} placeholder="MM" min="0" max="59"
                                               className="w-full px-3 py-1.5 rounded-md border border-pink-600 bg-gray-900 text-gray-50 text-sm focus:ring-pink-500 focus:border-pink-500"/>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 mt-2">
                                    <button type="button" onClick={onSetKHRequiredDuration} disabled={!isAuthReady}
                                            className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300">
                                        Set/Update Required Duration
                                    </button>
                                     <button type="button" onClick={handleLockKeyholderControls} disabled={!isAuthReady}
                                        className="w-full mt-2 sm:mt-0 sm:w-auto bg-gray-600 hover:bg-gray-500 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300">
                                        Lock Controls
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 pt-3 border-t border-pink-800">
                             <button type="button" onClick={async () => { await handleClearKeyholder(); setKhPasswordPreview(''); }} disabled={!isAuthReady}
                                className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white text-xs py-1 px-2 rounded-md shadow-sm transition duration-300">
                                Clear Keyholder Data
                            </button>
                        </div>
                    </>
                )}
                {keyholderMessage && <p className={`text-xs mt-2 ${keyholderMessage.includes('success') || keyholderMessage.includes('set') || keyholderMessage.includes('cleared') || keyholderMessage.includes('unlocked') || keyholderMessage.includes('updated') ? 'text-green-400' : 'text-yellow-400'}`}>{keyholderMessage}</p>}
            </div>
            
            {/* Goal Duration Section */}
            {/* ... Same as before ... */}
            <div className="mb-8 p-4 bg-gray-800 border border-green-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Personal Chastity Goal</h3>
                <p className="text-sm text-purple-200 mb-1"> Current Goal: {currentGoalDurationSeconds && currentGoalDurationSeconds > 0 ? formatElapsedTime(currentGoalDurationSeconds) : "Not Set"} </p>
                <p className="text-xs text-purple-400 mb-3"> This is your personal goal and is separate from any Keyholder required duration. </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div> <label htmlFor="goalDays" className="block text-sm font-medium text-purple-300 mb-1 text-left">Days:</label> <input type="number" id="goalDays" value={goalDays} onChange={(e) => setGoalDays(e.target.value)} placeholder="DD" min="0" className="w-full px-3 py-1.5 rounded-md border border-green-600 bg-gray-900 text-gray-50 text-sm focus:ring-green-500 focus:border-green-500"/> </div>
                    <div> <label htmlFor="goalHours" className="block text-sm font-medium text-purple-300 mb-1 text-left">Hours:</label> <input type="number" id="goalHours" value={goalHours} onChange={(e) => setGoalHours(e.target.value)} placeholder="HH" min="0" max="23" className="w-full px-3 py-1.5 rounded-md border border-green-600 bg-gray-900 text-gray-50 text-sm focus:ring-green-500 focus:border-green-500"/> </div>
                    <div> <label htmlFor="goalMinutes" className="block text-sm font-medium text-purple-300 mb-1 text-left">Minutes:</label> <input type="number" id="goalMinutes" value={goalMinutes} onChange={(e) => setGoalMinutes(e.target.value)} placeholder="MM" min="0" max="59" className="w-full px-3 py-1.5 rounded-md border border-green-600 bg-gray-900 text-gray-50 text-sm focus:ring-green-500 focus:border-green-500"/> </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                    <button type="button" onClick={handleSaveGoalDuration} disabled={!isAuthReady} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50"> Set/Update Goal </button>
                    <button type="button" onClick={handleClearGoalDuration} disabled={!isAuthReady || (currentGoalDurationSeconds === null || currentGoalDurationSeconds === 0)} className="w-full mt-2 sm:mt-0 sm:w-auto bg-gray-600 hover:bg-gray-500 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50"> Clear Goal </button>
                </div>
                {goalMessage && <p className={`text-xs mt-2 ${goalMessage.includes('updated') || goalMessage.includes('cleared') ? 'text-green-400' : 'text-yellow-400'}`}>{goalMessage}</p>}
            </div>


            {/* Edit Active Session Start Time Section */}
            {isCurrentSessionActive && (
                 <div className="mb-8 p-4 bg-gray-800 border border-orange-600 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-orange-300 mb-2">Edit Active Session Start Time</h3>
                    {cageOnTime &&  <p className="text-sm text-purple-300 mb-1"> Current Start: {formatTime(cageOnTime, true, true)} </p> }
                    <p className="text-xs text-purple-400 mb-3"> Adjust the date and time when the current chastity session started. This will be recorded in the event log. </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div> <label htmlFor="editSessionDate" className="block text-sm font-medium text-purple-300 mb-1 text-left">New Start Date:</label> <input type="date" id="editSessionDate" value={editSessionDateInput} onChange={(e) => setEditSessionDateInput(e.target.value)} className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-gray-50 text-sm focus:ring-orange-400 focus:border-orange-400" /> </div>
                        <div> <label htmlFor="editSessionTime" className="block text-sm font-medium text-purple-300 mb-1 text-left">New Start Time:</label> <input type="time" id="editSessionTime" value={editSessionTimeInput} onChange={(e) => setEditSessionTimeInput(e.target.value)} className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-gray-50 text-sm focus:ring-orange-400 focus:border-orange-400" /> </div>
                    </div>
                    <button type="button" onClick={handleUpdateCurrentCageOnTime} disabled={!isAuthReady || !editSessionDateInput || !editSessionTimeInput} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50" > Update Start Time </button>
                    {editSessionMessage && ( <p className={`text-xs mt-2 ${editSessionMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}> {editSessionMessage} </p> )}
                </div>
            )}

            {/* Restore Data Section */}
            {/* ... Same as before ... */}
             <div className="mb-8 p-4 bg-gray-800 border border-sky-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-sky-300 mb-4">Restore Data from User ID</h3>
                 <p className="text-sm text-purple-200 mb-3"> Enter a User ID to load their data. <strong className="text-yellow-400">Warning:</strong> This will overwrite your current data. </p>
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                    <input type="text" id="restoreUserId" value={restoreUserIdInput || ''} onChange={handleRestoreUserIdInputChange} placeholder="Enter User ID to restore from" className="w-full sm:flex-grow px-3 py-1.5 rounded-md border border-sky-600 bg-gray-900 text-gray-50 text-sm focus:ring-sky-500 focus:border-sky-500"/>
                    <button type="button" onClick={handleInitiateRestoreFromId} disabled={!isAuthReady || !(restoreUserIdInput || '').trim()} className="w-full mt-2 sm:mt-0 sm:w-auto bg-sky-600 hover:bg-sky-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50"> Load Data </button>
                </div>
                {restoreFromIdMessage && <p className={`text-xs mt-2 ${restoreFromIdMessage.includes('successfully') || restoreFromIdMessage.includes('found') ? 'text-green-400' : 'text-red-500'}`}>{restoreFromIdMessage}</p>}
            </div>


            {/* Restore from ID Confirmation Modal */}
            {/* ... Same as before ... */}
            {showRestoreFromIdPrompt && ( <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"> <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-red-700"> <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400">Confirm Data Restore</h3> <p className="text-sm text-purple-200 mb-2"> You are about to restore data from User ID: <strong className="text-sky-300">{restoreUserIdInput}</strong>. </p> <p className="text-sm text-yellow-400 font-semibold mb-6"> This action will PERMANENTLY OVERWRITE all of your current ChastityOS data (history, events, settings). This cannot be undone. </p> <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4"> <button type="button" onClick={handleConfirmRestoreFromId} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirm & Overwrite My Data</button> <button type="button" onClick={handleCancelRestoreFromId} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button> </div> </div> </div> )}


            {/* Data Management Section */}
            {/* ... Same as before ... */}
            <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Data Management</h3>
                <p className="text-sm text-purple-400 mb-4">Note: JSON Backup/Restore is a planned feature.</p>
                <hr className="my-4 border-purple-600"/>
                <h4 className="text-lg font-medium text-purple-200 mb-2">Export Data Options</h4>
                <div className="flex flex-col space-y-3">
                    <button type="button" onClick={() => handleExportClick('text')} disabled={!isAuthReady} className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"> Export Verbose Text Report (.txt) </button>
                    <button type="button" onClick={() => handleExportClick('tracker')} disabled={!isAuthReady || (chastityHistory && chastityHistory.length === 0)} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"> Export Tracker History CSV </button>
                    <button type="button" onClick={() => handleExportClick('eventlog')} disabled={!isAuthReady || (sexualEventsLog && sexualEventsLog.length === 0)} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"> Export Event Log CSV </button>
                </div>
                {eventLogMessage && <p className={`text-xs mt-3 ${eventLogMessage.includes('successfully') || eventLogMessage.includes('restored') ? 'text-green-400' : 'text-yellow-400'}`}>{eventLogMessage}</p>}
            </div>


            {/* Reset Data Section */}
            {/* ... Same as before ... */}
            <div className="p-4 bg-gray-800 border border-red-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Reset All Application Data</h3>
                <p className="text-sm text-purple-200 mb-3">This action is irreversible. It will delete all chastity history, event logs, and reset the Submissive's Name.</p>
                <button type="button" onClick={handleResetAllData} disabled={!isAuthReady} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 disabled:opacity-50"> {confirmReset ? 'Confirm Full Reset?' : 'Reset All Data'} </button>
                {confirmReset && (<p className="text-yellow-400 text-sm mt-3">Click again to permanently delete all data.</p>)}
                {nameMessage && nameMessage.includes('reset') && <p className={`text-xs mt-2 ${nameMessage.includes('reset') ? 'text-green-400' : 'text-yellow-400'}`}>{nameMessage}</p>}
            </div>
        </div>
    );
};

export default SettingsPage;
