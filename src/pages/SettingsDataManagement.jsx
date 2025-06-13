// src/pages/SettingsDataManagement.jsx

import { useContext } from 'react';
import { ChastityOSContext } from '../hooks/useChastityState';
import DataManagementSection from '../components/settings/DataManagementSection';

function SettingsDataManagement() {
  const {
    currentUser,
    chastityState,
    setChastityState,
    handleExportData,
    handleImportData,
    handleResetAllData,
    confirmReset, // This was the missing line
  } = useContext(ChastityOSContext);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Data Management</h2>
      <DataManagementSection
        currentUser={currentUser}
        chastityState={chastityState}
        setChastityState={setChastityState}
        onExport={handleExportData}
        onImport={handleImportData}
        handleResetAllData={handleResetAllData}
        confirmReset={confirmReset} // And you need to pass it here
      />
    </div>
  );
}

export default SettingsDataManagement;