// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { formatElapsedTime } from '../utils';

const SettingsPage = (props) => {
    const {
        isAuthReady, // Now will be used
        // eventLogMessage,
        handleExportTrackerCSV,
        // chastityHistory,
        handleExportEventLogCSV,
        // sexualEventsLog,
        handleResetAllData,
        confirmReset,
        nameMessage,
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
        // setCurrentPage,

        currentGoalDurationSeconds,
        handleSetGoalDuration,

        keyholderName,
        handleSetKeyholder,
        handleClearKeyholder,
        handleUnlockKeyholderControls,
        isKeyholderModeUnlocked,
        handleLockKeyholderControls,
        requiredKeyholderDurationSeconds,
        handleSetRequiredDuration,
        keyholderMessage,
        setKeyholderMessage
    } = props;

    const [goalDays, setGoalDays] = useState('');
    const [goalHours, setGoalHours] = useState('');
    const [goalMinutes, setGoalMinutes] = useState('');
    const [personalGoalMessage, setPersonalGoalMessage] = useState('');

    const [khNameInput, setKhNameInput] = useState('');
    const [showKhPasswordPreview, setShowKhPasswordPreview] = useState(false);
    const [khPasswordPreview, setKhPasswordPreview] = useState('');
    const [khPasswordInput, setKhPasswordInput] = useState('');

    const [khRequiredDays, setKhRequiredDays] = useState('');
    const [khRequiredHours, setKhRequiredHours] = useState('');
    const [khRequiredMinutes, setKhRequiredMinutes] = useState('');

    useEffect(() => {
        if (currentGoalDurationSeconds !== null && currentGoalDurationSeconds >= 0) {
            const totalMinutes = Math.floor(currentGoalDurationSeconds / 60);
            const totalHours = Math.floor(totalMinutes / 60);
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;
            const minutes = totalMinutes % 60;
            setGoalDays(days.toString());
            setGoalHours(hours.toString());
            setGoalMinutes(minutes.toString());
        } else {
            setGoalDays('');
            setGoalHours('');
            setGoalMinutes('');
        }
    }, [currentGoalDurationSeconds]);

     useEffect(() => {
        if (requiredKeyholderDurationSeconds !== null && requiredKeyholderDurationSeconds >= 0) {
            const totalMinutes = Math.floor(requiredKeyholderDurationSeconds / 60);
            const totalHours = Math.floor(totalMinutes / 60);
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;
            const minutes = totalMinutes % 60;
            setKhRequiredDays(days.toString());
            setKhRequiredHours(hours.toString());
            setKhRequiredMinutes(minutes.toString());
        } else {
            setKhRequiredDays('');
            setKhRequiredHours('');
            setKhRequiredMinutes('');
        }
    }, [requiredKeyholderDurationSeconds]);


    const onSetPersonalGoal = async () => {
        if (!handleSetGoalDuration || !isAuthReady) return;
        const d = parseInt(goalDays, 10) || 0;
        const h = parseInt(goalHours, 10) || 0;
        const m = parseInt(goalMinutes, 10) || 0;

        if (d < 0 || h < 0 || h >= 24 || m < 0 || m >= 60) {
            setPersonalGoalMessage("Invalid input. Days >= 0, Hours 0-23, Minutes 0-59.");
            setTimeout(() => setPersonalGoalMessage(''), 3000);
            return;
        }
        const totalSeconds = (d * 24 * 60 * 60) + (h * 60 * 60) + (m * 60);
        if (totalSeconds <= 0 && (d > 0 || h > 0 || m > 0) ) {
             setPersonalGoalMessage("Goal duration must be positive or all zeros to clear.");
             setTimeout(() => setPersonalGoalMessage(''), 3000);
             return;
        }
        const success = await handleSetGoalDuration(totalSeconds > 0 ? totalSeconds : null);
        if (success) {
            setPersonalGoalMessage(totalSeconds > 0 ? "Personal goal updated!" : "Personal goal cleared!");
        } else {
            setPersonalGoalMessage("Failed to update personal goal.");
        }
        setTimeout(() => setPersonalGoalMessage(''), 4000);
    };

    const onClearPersonalGoal = async () => {
        if (!handleSetGoalDuration || !isAuthReady) return;
        const success = await handleSetGoalDuration(null);
        if (success) {
            setPersonalGoalMessage("Personal goal cleared!");
            setGoalDays(''); setGoalHours(''); setGoalMinutes('');
        } else {
            setPersonalGoalMessage("Failed to clear personal goal.");
        }
        setTimeout(() => setPersonalGoalMessage(''), 4000);
    };
    
    const onSetKeyholderHandler = async () => {
        if (!handleSetKeyholder || !setKeyholderMessage || !isAuthReady) return;
        setKeyholderMessage('');
        const preview = await handleSetKeyholder(khNameInput);
        if (preview) {
            setKhPasswordPreview(preview);
            setShowKhPasswordPreview(true);
        }
    };

    const onClearKeyholderHandler = async () => {
        if (!handleClearKeyholder || !setKeyholderMessage || !isAuthReady) return;
        setKeyholderMessage('');
        await handleClearKeyholder();
        setKhNameInput('');
        setKhPasswordPreview('');
        setShowKhPasswordPreview(false);
        setKhPasswordInput('');
    };
    
    const onUnlockKhControlsHandler = async () => {
        if (!handleUnlockKeyholderControls || !setKeyholderMessage || !isAuthReady) return;
        setKeyholderMessage('');
        const success = await handleUnlockKeyholderControls(khPasswordInput);
        if (success) {
            setKhPasswordInput(''); 
        }
    };

    const onSetKhRequiredDurationHandler = async () => {
        if (!handleSetRequiredDuration || !setKeyholderMessage || !isAuthReady) return;
        setKeyholderMessage('');
        const d = parseInt(khRequiredDays, 10) || 0;
        const h = parseInt(khRequiredHours, 10) || 0;
        const m = parseInt(khRequiredMinutes, 10) || 0;

        if (d < 0 || h < 0 || h >= 24 || m < 0 || m >= 60) {
            setKeyholderMessage("Invalid duration. Days >=0, Hours 0-23, Minutes 0-59.");
            setTimeout(() => setKeyholderMessage(''), 3000);
            return;
        }
        const totalSeconds = (d * 24 * 60 * 60) + (h * 60 * 60) + (m * 60);
         if (totalSeconds <= 0 && (d > 0 || h > 0 || m > 0)) {
             setKeyholderMessage("Required duration must be positive or all zeros to clear.");
             setTimeout(() => setKeyholderMessage(''), 3000);
             return;
        }
        await handleSetRequiredDuration(totalSeconds > 0 ? totalSeconds : null);
    };


    const inputClass = "w-20 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors text-center";
    const buttonClass = "px-4 py-2 rounded font-semibold transition-colors text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"; // Added disabled styles
    const primaryButtonClass = `${buttonClass} bg-purple-600 hover:bg-purple-700 text-white`;
    const secondaryButtonClass = `${buttonClass} bg-gray-600 hover:bg-gray-500 text-white`;
    const dangerButtonClass = `${buttonClass} bg-red-600 hover:bg-red-700 text-white`;
    const successButtonClass = `${buttonClass} bg-green-600 hover:bg-green-700 text-white`;
    const warningButtonClass = `${buttonClass} bg-yellow-600 hover:bg-yellow-700 text-black`;


    return (
        <div className="space-y-8 text-purple-200">
            {/* Submissive's Name Section */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Submissive's Name</h3>
                {savedSubmissivesName ? (
                    <p className="text-gray-300">Current Name: <span className="font-bold text-purple-400">{savedSubmissivesName}</span></p>
                ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input type="text" value={submissivesNameInput} onChange={handleSubmissivesNameInputChange} placeholder="Enter Name"
                               className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                        <button type="button" onClick={handleSetSubmissivesName} className={primaryButtonClass} disabled={!isAuthReady}>Set Name</button>
                    </div>
                )}
                {nameMessage && <p className="text-xs mt-2 text-yellow-400">{nameMessage}</p>}
            </div>

            {/* Personal Chastity Goal Section */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Personal Chastity Goal</h3>
                {currentGoalDurationSeconds !== null && currentGoalDurationSeconds > 0 && (
                    <p className="text-sm text-gray-400 mb-2">
                        Current Personal Goal: <span className="font-semibold">{formatElapsedTime(currentGoalDurationSeconds)}</span>
                    </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                    <input type="number" value={goalDays} onChange={(e) => setGoalDays(e.target.value)} placeholder="Days" className={inputClass} min="0" />
                    <input type="number" value={goalHours} onChange={(e) => setGoalHours(e.target.value)} placeholder="Hours" className={inputClass} min="0" max="23" />
                    <input type="number" value={goalMinutes} onChange={(e) => setGoalMinutes(e.target.value)} placeholder="Mins" className={inputClass} min="0" max="59" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={onSetPersonalGoal} className={primaryButtonClass} disabled={!isAuthReady}>Set Personal Goal</button>
                    {(currentGoalDurationSeconds !== null && currentGoalDurationSeconds > 0) && (
                        <button type="button" onClick={onClearPersonalGoal} className={secondaryButtonClass} disabled={!isAuthReady}>Clear Personal Goal</button>
                    )}
                </div>
                {personalGoalMessage && <p className="text-xs mt-2 text-yellow-400">{personalGoalMessage}</p>}
            </div>

            {/* Keyholder Customization Section */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Keyholder Customization</h3>
                {!keyholderName ? (
                    <>
                        <p className="text-sm text-gray-400 mb-2">Set a Keyholder name to enable Keyholder controls and a required chastity duration.</p>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                                type="text"
                                value={khNameInput}
                                onChange={(e) => setKhNameInput(e.target.value)}
                                placeholder="Keyholder's Name"
                                className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            />
                            <button type="button" onClick={onSetKeyholderHandler} className={primaryButtonClass} disabled={!isAuthReady}>Set Keyholder & Gen Password</button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-gray-300 mb-2">Keyholder: <span className="font-bold text-purple-400">{keyholderName}</span></p>
                        {showKhPasswordPreview && khPasswordPreview && (
                            <div className="my-3 p-3 bg-gray-700 rounded-md">
                                <p className="text-sm text-yellow-300">Keyholder Password (note this down securely):</p>
                                <p className="text-lg font-mono text-yellow-400 tracking-wider">{khPasswordPreview}</p>
                                <button onClick={() => setShowKhPasswordPreview(false)} className={`${secondaryButtonClass} mt-2`}>Done (Hide Password)</button>
                            </div>
                        )}
                        {!isKeyholderModeUnlocked ? (
                            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                                <input
                                    type="password"
                                    value={khPasswordInput}
                                    onChange={(e) => setKhPasswordInput(e.target.value)}
                                    placeholder="Enter Keyholder Password"
                                    className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                />
                                <button type="button" onClick={onUnlockKhControlsHandler} className={successButtonClass} disabled={!isAuthReady}>Unlock Controls</button>
                            </div>
                        ) : (
                            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-green-600">
                                <h4 className="text-md font-semibold text-green-300 mb-3">Keyholder Controls Unlocked</h4>
                                <p className="text-sm text-gray-400 mb-2">Set a required chastity duration for the submissive. This will override any personal goal.</p>
                                {requiredKeyholderDurationSeconds !== null && requiredKeyholderDurationSeconds > 0 && (
                                    <p className="text-sm text-gray-400 mb-2">
                                        Current Required Duration: <span className="font-semibold">{formatElapsedTime(requiredKeyholderDurationSeconds)}</span>
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                                    <input type="number" value={khRequiredDays} onChange={(e) => setKhRequiredDays(e.target.value)} placeholder="Days" className={inputClass} min="0" />
                                    <input type="number" value={khRequiredHours} onChange={(e) => setKhRequiredHours(e.target.value)} placeholder="Hours" className={inputClass} min="0" max="23" />
                                    <input type="number" value={khRequiredMinutes} onChange={(e) => setKhRequiredMinutes(e.target.value)} placeholder="Mins" className={inputClass} min="0" max="59" />
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 mb-3">
                                     <button type="button" onClick={onSetKhRequiredDurationHandler} className={warningButtonClass} disabled={!isAuthReady}>Set Required Duration</button>
                                     {(requiredKeyholderDurationSeconds !== null && requiredKeyholderDurationSeconds > 0) && (
                                        <button type="button" onClick={() => handleSetRequiredDuration(null)} className={secondaryButtonClass} disabled={!isAuthReady}>Clear Required Duration</button>
                                     )}
                                </div>
                                <button type="button" onClick={handleLockKeyholderControls} className={`${secondaryButtonClass} w-full sm:w-auto`}>Lock Keyholder Controls</button>
                            </div>
                        )}
                         <button type="button" onClick={onClearKeyholderHandler} className={`${dangerButtonClass} mt-4 w-full sm:w-auto`} disabled={!isAuthReady}>Clear All Keyholder Data</button>
                    </>
                )}
                {keyholderMessage && <p className="text-xs mt-2 text-yellow-400">{keyholderMessage}</p>}
            </div>


            {/* Data Management Section */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Data Management</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" onClick={handleExportTrackerCSV} className={secondaryButtonClass} disabled={!isAuthReady}>Export Tracker CSV</button>
                    <button type="button" onClick={handleExportEventLogCSV} className={secondaryButtonClass} disabled={!isAuthReady}>Export Events CSV</button>
                    <button type="button" onClick={handleExportTextReport} className={`${secondaryButtonClass} sm:col-span-2`} disabled={!isAuthReady}>Export Full Text Report</button>
                </div>
            </div>

            {/* Restore Data Section */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Restore Data from User ID</h3>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input type="text" value={restoreUserIdInput} onChange={handleRestoreUserIdInputChange} placeholder="Enter User ID to Restore From"
                           className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                    <button type="button" onClick={handleInitiateRestoreFromId} className={primaryButtonClass} disabled={!isAuthReady}>Load Data</button>
                </div>
                {restoreFromIdMessage && <p className="text-xs mt-2 text-yellow-400">{restoreFromIdMessage}</p>}
            </div>

            {/* User ID Display Section */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Your User ID</h3>
                {showUserIdInSettings && userId ? (
                    <p className="text-gray-300 font-mono break-all">{userId}</p>
                ) : (
                    <p className="text-gray-400 italic">Click to reveal</p>
                )}
                <button type="button" onClick={handleToggleUserIdVisibility} className={`${secondaryButtonClass} mt-2`}>
                    {showUserIdInSettings ? 'Hide' : 'Show'} User ID
                </button>
                <p className="text-xs text-gray-500 mt-2">Share this ID if you want to restore your data on another device or browser, or if requested for support.</p>
            </div>

            {/* Reset All Data Section */}
            <div className="p-4 bg-red-900/30 rounded-lg border border-red-700">
                <h3 className="text-lg font-semibold text-red-300 mb-3">Reset All Data</h3>
                <p className="text-sm text-red-400 mb-3">Warning: This will permanently delete all your chastity history, event logs, and settings from this device/browser's storage.</p>
                <button type="button" onClick={handleResetAllData} className={dangerButtonClass} disabled={!isAuthReady}>
                    {confirmReset ? 'Confirm Reset Now?' : 'Reset All Data'}
                </button>
                {confirmReset && <p className="text-xs mt-2 text-yellow-400">Click again to confirm. This cannot be undone.</p>}
            </div>

            {showRestoreFromIdPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-700 p-6 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-yellow-500">
                        <h3 className="text-xl font-bold mb-4 text-yellow-300">Confirm Data Restore</h3>
                        <p className="text-sm text-gray-300 mb-4">
                            Restoring data from another User ID will <strong className="text-red-400">overwrite all your current data</strong> (history, settings, etc.) with the data from the specified ID. This action cannot be undone.
                        </p>
                        <p className="text-sm text-gray-300 mb-6">Are you sure you want to proceed?</p>
                        <div className="flex justify-around">
                            <button type="button" onClick={handleConfirmRestoreFromId} className={dangerButtonClass}>Confirm & Overwrite My Data</button>
                            <button type="button" onClick={handleCancelRestoreFromId} className={secondaryButtonClass}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
