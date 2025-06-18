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
  handleInitiateReset,
  showResetConfirmModal,
  handleCancelReset,
  restoreUserIdInput,
  handleRestoreUserIdInputChange,
  handleInitiateRestoreFromId,
  restoreFromIdMessage,
  showRestoreFromIdPrompt,
  handleConfirmRestoreFromId,
  handleCancelRestoreFromId,
  nameMessage,
  eventLogMessage,
  sexualEventsLog,
  chastityHistory
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
    <div className="space-y-6">
      {/* --- Export Options Box --- */}
      <div className="util-box box-blue">
        <h4>Export Data Options</h4>
        <div className="flex flex-col space-y-3">
          <button type="button" onClick={() => handleExportClick('text')} disabled={!isAuthReady}>
            Export Verbose Text Report (.txt)
          </button>
          <button type="button" onClick={() => handleExportClick('tracker')} disabled={!isAuthReady || !chastityHistory || chastityHistory.length === 0}>
            Export Tracker History CSV
          </button>
          <button type="button" onClick={() => handleExportClick('eventlog')} disabled={!isAuthReady || !sexualEventsLog || sexualEventsLog.length === 0}>
            Export Event Log CSV
          </button>
          <button type="button" onClick={() => handleExportClick('json')} disabled={!isAuthReady}>
            Export Full Backup (.json)
          </button>
        </div>
        {eventLogMessage && !eventLogMessage.includes('restored') && (
          <p className="text-xs mt-3">{eventLogMessage}</p>
        )}
      </div>

      {/* --- Import & Restore Box --- */}
      <div className="util-box box-yellow">
        <h4>Import & Restore Data</h4>
        <p className="text-sm font-bold">Warning:</p>
        <p className="text-xs mb-4">Importing or restoring data will overwrite all existing data.</p>
        
        {/* Import from File */}
        <label htmlFor="import-json-input" className="block w-full text-center py-2 px-4 rounded-lg shadow-md transition duration-300 cursor-pointer mb-4">
          Import Full Backup (.json)
        </label>
        <input id="import-json-input" type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
        {eventLogMessage && eventLogMessage.includes('restored') && (
          <p className="text-xs mt-3">{eventLogMessage}</p>
        )}

        {/* Restore from User ID */}
        <div className="mt-4 pt-4 border-t border-yellow-800">
            <h5 className="font-medium mb-2">Restore from User ID</h5>
            <p className="text-xs mb-3">
              The User ID you are restoring from must have existing data saved in the application's database.
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
              <input
                type="text"
                value={restoreUserIdInput || ''}
                onChange={handleRestoreUserIdInputChange}
                placeholder="Enter User ID to restore from"
                className="w-full sm:flex-grow"
              />
              <button
                type="button"
                onClick={handleInitiateRestoreFromId}
                disabled={!isAuthReady || !(restoreUserIdInput || '').trim()}
                className="w-full mt-2 sm:mt-0 sm:w-auto"
              >
                Load Data
              </button>
            </div>
            {restoreFromIdMessage && (
              <p className="text-xs mt-2">{restoreFromIdMessage}</p>
            )}
        </div>
      </div>

      {/* --- Reset Section - Red Box --- */}
      <div className="util-box box-red">
        <h4>Reset Application</h4>
        <p className="text-sm mb-3">This action is irreversible. It will delete all data including logs and settings.</p>
        <button
          type="button"
          onClick={handleInitiateReset}
          disabled={!isAuthReady}
          className="font-bold py-2 px-4 rounded-lg shadow-md transition ease-in-out transform hover:scale-105"
        >
          Reset All Data
        </button>
        {nameMessage && nameMessage.includes('reset') && <p className="text-xs mt-2">{nameMessage}</p>}
      </div>

      {/* --- Modal for Reset Confirmation --- */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-red-700">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400">Confirm Full Data Reset</h3>
            <p className="text-sm text-yellow-400 font-semibold mb-6">
              Are you sure? This action will PERMANENTLY DELETE all of your ChastityOS data. This cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={handleResetAllData}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Yes, Delete Everything
              </button>
              <button
                type="button"
                onClick={handleCancelReset}
                className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal for Restore from ID Confirmation --- */}
      {showRestoreFromIdPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-red-700">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400">Confirm Data Restore</h3>
            <p className="text-sm text-purple-200 mb-2">
              You are about to restore data from User ID: <strong className="text-sky-300">{restoreUserIdInput}</strong>.
            </p>
            <p className="text-sm text-yellow-400 font-semibold mb-6">
              This action will PERMANENTLY OVERWRITE all of your current ChastityOS data. This cannot be undone.
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
