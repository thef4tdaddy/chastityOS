import React from "react";

interface EmergencyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  backupCode: string;
  setBackupCode: (code: string) => void;
  unlockMessage: string;
}

export const EmergencyUnlockModal: React.FC<EmergencyUnlockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  backupCode,
  setBackupCode,
  unlockMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xs border-white/20 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-red-700">
        <h3 className="text-lg md:text-xl font-bold mb-4 text-red-300">
          Emergency Unlock
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Enter your backup code to unlock the session.
        </p>
        <input
          type="text"
          value={backupCode}
          onChange={(e) => setBackupCode(e.target.value)}
          placeholder="Enter backup code"
          className="w-full p-2 mb-4 rounded-lg border border-red-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {unlockMessage && (
          <p className="text-sm text-red-400 mb-4">{unlockMessage}</p>
        )}
        <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onSubmit}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
