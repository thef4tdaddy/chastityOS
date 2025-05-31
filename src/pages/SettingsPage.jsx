import React from 'react';

const SettingsPage = (props) => { 
    // console.log("SettingsPage props:", props); // Debugging log removed/commented

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
        // Props for Restore from User ID
        restoreUserIdInput,
        handleRestoreUserIdInputChange, 
        handleInitiateRestoreFromId,
        showRestoreFromIdPrompt,
        handleConfirmRestoreFromId,
        handleCancelRestoreFromId,
        restoreFromIdMessage
    } = props; 
    
    return (
        <div className="p-0 md:p-4">
           {/* Page title is now rendered in App.jsx for consistency */}
            <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Profile Information</h3>
                {/* Submissive's Name Setting */}
                {!savedSubmissivesName && isAuthReady && (
                    <div className="mb-4">
                        <label htmlFor="settingsSubmissivesName" className="block text-sm font-medium text-purple-300 mb-1 text-left">
                            Submissive’s Name: (Not Set)
                        </label>
                        <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                            <input type="text" id="settingsSubmissivesName" value={submissivesNameInput || ''} onChange={handleSubmissivesNameInputChange} placeholder="Enter Submissive’s Name"
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


                {/* User ID Display */}
                <div>
                    <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Account ID</h4>
                    <button 
                        type="button"
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
                 <p className="text-xs text-purple-500 mt-4 text-left"><em>Future: Keyholder/Partner customization options will appear here.</em></p>
            </div>

            {/* Restore Data from User ID Section */}
            <div className="mb-8 p-4 bg-gray-800 border border-sky-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-sky-300 mb-4">Restore Data from User ID</h3>
                <p className="text-sm text-purple-200 mb-3">
                    Enter a User ID to load their data. <strong className="text-yellow-400">Warning:</strong> This will overwrite your current data.
                </p>
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                    <input 
                        type="text" 
                        id="restoreUserId" 
                        value={restoreUserIdInput || ''} 
                        onChange={handleRestoreUserIdInputChange} 
                        placeholder="Enter User ID to restore from"
                        className="w-full sm:flex-grow px-3 py-1.5 rounded-md border border-sky-600 bg-gray-900 text-gray-50 text-sm focus:ring-sky-500 focus:border-sky-500"/>
                    <button 
                        type="button" 
                        onClick={handleInitiateRestoreFromId} 
                        disabled={!isAuthReady || !(restoreUserIdInput || '').trim()}
                        className="w-full mt-2 sm:mt-0 sm:w-auto bg-sky-600 hover:bg-sky-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50">
                        Load Data
                    </button>
                </div>
                {restoreFromIdMessage && <p className={`text-xs mt-2 ${restoreFromIdMessage.includes('successfully') || restoreFromIdMessage.includes('found') ? 'text-green-400' : 'text-red-500'}`}>{restoreFromIdMessage}</p>}
            </div>

            {/* Restore from ID Confirmation Modal */}
            {showRestoreFromIdPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-red-700">
                    <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400">Confirm Data Restore</h3>
                    <p className="text-sm text-purple-200 mb-2">
                        You are about to restore data from User ID: <strong className="text-sky-300">{restoreUserIdInput}</strong>.
                    </p>
                    <p className="text-sm text-yellow-400 font-semibold mb-6">
                        This action will PERMANENTLY OVERWRITE all of your current ChastityOS data (history, events, settings). This cannot be undone.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                      <button type="button" onClick={handleConfirmRestoreFromId} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Confirm & Overwrite My Data</button>
                      <button type="button" onClick={handleCancelRestoreFromId} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                    </div>
                  </div>
                </div>
            )}


            <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Data Management</h3>
                <p className="text-sm text-purple-400 mb-4">Note: JSON Backup/Restore is a planned feature.</p>
                
                <hr className="my-4 border-purple-600"/>
                
                <h4 className="text-lg font-medium text-purple-200 mb-2">Export Data Options</h4>
                 <div className="flex flex-col space-y-3">
                    <button type="button" onClick={handleExportTextReport} disabled={!isAuthReady} className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
                        Export Verbose Text Report (.txt)
                    </button>
                    <button type="button" onClick={handleExportTrackerCSV} disabled={!isAuthReady || (chastityHistory && chastityHistory.length === 0)} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
                        Export Tracker History CSV
                    </button>
                    <button type="button" onClick={handleExportEventLogCSV} disabled={!isAuthReady || (sexualEventsLog && sexualEventsLog.length === 0)} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
                        Export Event Log CSV
                    </button>
                </div>
                {eventLogMessage && <p className={`text-xs mt-3 ${eventLogMessage.includes('successfully') || eventLogMessage.includes('restored') ? 'text-green-400' : 'text-yellow-400'}`}>{eventLogMessage}</p>}
            </div>
            
            <div className="p-4 bg-gray-800 border border-red-700 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Reset All Application Data</h3>
                <p className="text-sm text-purple-200 mb-3">This action is irreversible. It will delete all chastity history, event logs, and reset the Submissive's Name.</p>
                <button type="button" onClick={handleResetAllData} disabled={!isAuthReady}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 disabled:opacity-50">
                  {confirmReset ? 'Confirm Full Reset?' : 'Reset All Data'}
                </button>
                {confirmReset && (<p className="text-yellow-400 text-sm mt-3">Click again to permanently delete all data.</p>)}
                {nameMessage && <p className={`text-xs mt-2 ${nameMessage.includes('reset') ? 'text-green-400' : 'text-yellow-400'}`}>{nameMessage}</p>}
            </div>
        </div>
    );
};

export default SettingsPage;
