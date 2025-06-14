import React, { useContext } from 'react';
// Import the context directly rather than from the provider component
import { ChastityOSContext } from '../context/ChastityOSContextOnly.js';
import DataManagementSection from '../components/settings/DataManagementSection';

function SettingsDataManagement() {
  // Use the main context to get all necessary state and functions.
  const chastityOS = useContext(ChastityOSContext);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Data Management</h2>
      <DataManagementSection
        // Pass all the props from the context down to the component.
        isAuthReady={chastityOS.isAuthReady}
        handleExportTextReport={chastityOS.handleExportTextReport}
        handleExportTrackerCSV={chastityOS.handleExportTrackerCSV}
        handleExportEventLogCSV={chastityOS.handleExportEventLogCSV}
        handleExportJSON={chastityOS.handleExportJSON}
        handleImportJSON={chastityOS.handleImportJSON}
        handleResetAllData={chastityOS.handleResetAllData}
        confirmReset={chastityOS.confirmReset}
        nameMessage={chastityOS.nameMessage}
        eventLogMessage={chastityOS.eventLogMessage}
        sexualEventsLog={chastityOS.sexualEventsLog}
        chastityHistory={chastityOS.chastityHistory}
        restoreUserIdInput={chastityOS.restoreUserIdInput}
        handleRestoreUserIdInputChange={chastityOS.handleRestoreUserIdInputChange}
        handleInitiateRestoreFromId={chastityOS.handleInitiateRestoreFromId}
        restoreFromIdMessage={chastityOS.restoreFromIdMessage}
        showRestoreFromIdPrompt={chastityOS.showRestoreFromIdPrompt}
        handleConfirmRestoreFromId={chastityOS.handleConfirmRestoreFromId}
        handleCancelRestoreFromId={chastityOS.handleCancelRestoreFromId}
      />
    </div>
  );
}

export default SettingsDataManagement;
