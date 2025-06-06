// src/components/settings/DataManagementSection.jsx
import React from 'react';

const DataManagementSection = ({
  isAuthReady,
  handleExportTextReport,
  handleExportTrackerCSV,
  handleExportEventLogCSV,
  handleExportJSON,
  handleImportJSON,
  handleResetAllData,
  confirmReset,
  nameMessage,
  eventLogMessage,
  sexualEventsLog,
  chastityHistory,
  restoreUserIdInput,
  handleRestoreUserIdInputChange,
  handleInitiateRestoreFromId,
  restoreFromIdMessage,
  showRestoreFromIdPrompt,
  handleConfirmRestoreFromId,
  handleCancelRestoreFromId
}) => {
  const handleExportClick = (type) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'export_click', export_type: type });
    if (type === 'text') handleExportTextReport();
    else if (type === 'tracker') handleExportTrackerCSV();
    else if (type === 'eventlog') handleExportEventLogCSV();
    else if (type === 'json') handleExportJSON();
  };

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-purple-300 mb-4">Data Management</h3>

      {/* Restore from User ID */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-sky-300 mb-2">Restore from User ID</h4>
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
            className="w-full sm:flex-grow px-3 py-1.5 rounded-md border border-sky-600 bg-gray-900 text-gray-50 text-sm focus:ring-sky-500 focus:border-sky-500"
          />
          <button
            type="button"
            onClick={handleInitiateRestoreFromId}
            disabled={!isAuthReady || !(restoreUserIdInput || '').trim()}
            className="w-full mt-2 sm:mt-0 sm:w-auto bg-sky-600 hover:bg-sky-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
          >
            Load Data
          </button>
        </div>
        {restoreFromIdMessage && (
          <p className={`text-xs mt-2 ${restoreFromIdMessage.includes('successfully') || restoreFromIdMessage.includes('found') ? 'text-green-400' : 'text-red-500'}`}>
            {restoreFromIdMessage}
          </p>
        )}
      </div>

      {/* Export Options */}
      <h4 className="text-lg font-medium text-purple-200 mb-2">Export Data Options</h4>
      <div className="flex flex-col space-y-3">
        <button type="button" onClick={() => handleExportClick('text')} disabled={!isAuthReady}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
          Export Verbose Text Report (.txt)
        </button>
        <button type="button" onClick={() => handleExportClick('tracker')} disabled={!isAuthReady || (chastityHistory && chastityHistory.length === 0)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
          Export Tracker History CSV
        </button>
        <button type="button" onClick={() => handleExportClick('eventlog')} disabled={!isAuthReady || (sexualEventsLog && sexualEventsLog.length === 0)}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
          Export Event Log CSV
        </button>
        <button type="button" onClick={() => handleExportClick('json')} disabled={!isAuthReady}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50">
          Export Full Backup (.json)
        </button>
      </div>
      {eventLogMessage && !eventLogMessage.includes('restored') && (
        <p className={`text-xs mt-3 ${eventLogMessage.includes('successfully') || eventLogMessage.includes('exported') ? 'text-green-400' : 'text-yellow-400'}`}>
          {eventLogMessage}
        </p>
      )}

      {/* Import Section */}
      <hr className="my-4 border-purple-600" />
      <h4 className="text-lg font-medium text-purple-200 mb-2">Import Data</h4>
      <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg mb-4">
        <p className="text-sm text-yellow-300 font-bold">Warning:</p>
        <p className="text-xs text-yellow-400">Importing a backup will overwrite all existing data.</p>
      </div>
      <input
        type="file"
        accept=".json"
        onChange={handleImportJSON}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100"
      />
      {eventLogMessage && eventLogMessage.includes('restored') && (
        <p className={`text-xs mt-3 ${eventLogMessage.includes('successfully') || eventLogMessage.includes('restored') ? 'text-green-400' : 'text-yellow-400'}`}>
          {eventLogMessage}
        </p>
      )}

      {/* Reset Section */}
      <hr className="my-4 border-purple-600" />
      <h4 className="text-lg font-medium text-red-300 mb-2">Reset Application</h4>
      <p className="text-sm text-purple-200 mb-3">This action is irreversible. It will delete all data including logs and settings.</p>
      <button
        type="button"
        onClick={handleResetAllData}
        disabled={!isAuthReady}
        className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 disabled:opacity-50"
      >
        {confirmReset ? 'Confirm Full Reset?' : 'Reset All Data'}
      </button>
      {confirmReset && <p className="text-yellow-400 text-sm mt-3">Click again to permanently delete all data.</p>}
      {nameMessage && nameMessage.includes('reset') && (
        <p className={`text-xs mt-2 ${nameMessage.includes('reset') ? 'text-green-400' : 'text-yellow-400'}`}>
          {nameMessage}
        </p>
      )}

      {/* Modal for Restore Confirm */}
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
              <button
                type="button"
                onClick={handleConfirmRestoreFromId}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Confirm & Overwrite My Data
              </button>
              <button
                type="button"
                onClick={handleCancelRestoreFromId}
                className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementSection;
