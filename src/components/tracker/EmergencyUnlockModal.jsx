// src/components/tracker/EmergencyUnlockModal.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

const EmergencyUnlockModal = ({
  isOpen,
  onClose,
  onSubmit,
  backupCode,
  setBackupCode,
  unlockMessage,
}) => {
  if (!isOpen) {
    return null; // Don't render anything if the modal is not open
  }

  const isVerifying = unlockMessage === 'Verifying code...';
  const isSuccessful = unlockMessage.includes('successful');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg w-full max-w-md border border-red-700">
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <FaTimes size={20} />
        </button>

        <h3 className="text-lg md:text-xl font-bold mb-4 text-red-400 text-center">Emergency Unlock</h3>
        
        {isSuccessful ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-green-400">Unlock Successful!</p>
            <p className="text-sm text-purple-200 mt-2">{unlockMessage}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-purple-200 mb-4 text-center">
              A Hardcore Goal is active. To unlock early, please provide your 6-character backup code.
            </p>
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              maxLength="6"
              placeholder="BACKUP CODE"
              className="w-full p-3 rounded-md border border-red-600 bg-gray-900 text-white text-2xl text-center font-mono tracking-widest focus:ring-red-500 focus:border-red-500 mb-4"
            />
            <button
              onClick={onSubmit}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
              disabled={!backupCode || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Unlock'}
            </button>
            {unlockMessage && !isSuccessful && (
              <p className="text-sm mt-4 text-center text-yellow-400">
                {unlockMessage}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmergencyUnlockModal;
