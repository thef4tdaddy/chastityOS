// src/pages/SettingsDataManagementPage.jsx
import React, { useState } from 'react';
import { FaSpinner } from 'react-icons/fa'; // Using an icon for the loading state
import DataManagementSection from '../components/settings/DataManagementSection.jsx';
import { useDataManagement } from '../hooks/useDataManagement';

const SettingsDataManagementPage = (props) => {
  const { handleResetAllData, ...otherDataHandlers } = useDataManagement(props);

  const [showResetModal, setShowResetModal] = useState(false);
  // 'idle', 'pending', 'success', 'error'
  const [resetStatus, setResetStatus] = useState('idle');
  const [resetError, setResetError] = useState('');

  const handleOpenResetModal = () => {
    setResetStatus('idle'); // Reset status when modal is opened
    setResetError('');
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    setResetStatus('pending'); // Show loading state
    try {
      await handleResetAllData();
      setResetStatus('success'); // Show success message

      // Wait 2 seconds on the success message before reloading
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      setResetStatus('error');
      setResetError(error.message || 'An unknown error occurred.');
    }
  };

  const renderModalContent = () => {
    switch (resetStatus) {
      case 'pending':
        return (
          <div className="text-center text-gray-50">
            <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-purple-400" />
            <p className="text-lg">Resetting your data...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center text-gray-50">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-green-400">Success!</h3>
            <p className="text-sm text-purple-200">All data has been reset.</p>
            <p className="text-sm text-purple-200 mt-2">The application will now reload.</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center text-gray-50">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400">Reset Failed</h3>
            <p className="text-sm text-yellow-400 font-semibold mb-6 bg-red-900/50 p-3 rounded-md">{resetError}</p>
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Close
            </button>
          </div>
        );
      case 'idle':
      default:
        return (
          <>
            <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400">Confirm Full Data Reset</h3>
            <p className="text-sm text-purple-200 mb-2">Are you absolutely sure you want to proceed?</p>
            <p className="text-sm text-yellow-400 font-semibold mb-6">
              This action will PERMANENTLY DELETE all of your ChastityOS data, including history, events, and settings. This cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
              <button type="button" onClick={handleConfirmReset} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
                Confirm & Delete All Data
              </button>
              <button type="button" onClick={() => setShowResetModal(false)} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">
                Cancel
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="settings-container">
      <DataManagementSection
        {...props}
        {...otherDataHandlers}
        confirmReset={false}
        handleResetAllData={handleOpenResetModal}
      />
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg w-full max-w-md border border-red-700">
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDataManagementPage;
