import React from 'react';
import { FaSync, FaCloudUploadAlt, FaCloudDownloadAlt, FaTrashAlt } from 'react-icons/fa';

const SettingsDataManagement = ({
  onBack,
  onSync,
  onForceOverwrite,
  onResetAll,
  lastSyncTime,
  isSyncing,
  syncError,
  hasPendingWrites
}) => {

  const handleResetAll = () => {
    // Added a confirmation dialog before resetting.
    if (window.confirm('Are you sure you want to reset all your data? This action cannot be undone.')) {
      onResetAll();
    }
  };

  return (
    <div className="settings-data-management">
      <div className="space-y-4">
        <button onClick={onSync} disabled={isSyncing} className="btn-primary w-full flex items-center justify-center">
          <FaSync className="mr-2" /> {isSyncing ? 'Syncing...' : 'Sync with Cloud'}
        </button>
        {syncError && <p className="text-red-500 text-sm">Sync Error: {syncError}</p>}
        {lastSyncTime && <p className="text-xs text-gray-400 text-center">Last sync: {new Date(lastSyncTime).toLocaleString()}</p>}
        {hasPendingWrites && <p className="text-yellow-500 text-sm text-center">You have unsynced changes.</p>}
        <button onClick={onForceOverwrite} disabled={isSyncing} className="btn-secondary w-full flex items-center justify-center">
          <FaCloudUploadAlt className="mr-2" /> Force Overwrite Cloud Data
        </button>
        <button onClick={() => {
          if (window.confirm('Are you sure you want to download from the cloud and overwrite local data?')) {
            // Assuming you have a function to handle this.
            // onForceDownload(); 
          }
        }} disabled={isSyncing} className="btn-secondary w-full flex items-center justify-center">
          <FaCloudDownloadAlt className="mr-2" /> Overwrite Local with Cloud
        </button>
        <button onClick={handleResetAll} className="btn-danger w-full flex items-center justify-center">
          <FaTrashAlt className="mr-2" /> Reset All
        </button>
      </div>
    </div>
  );
};

export default SettingsDataManagement;