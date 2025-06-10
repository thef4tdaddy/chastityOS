// src/components/settings/SessionEditSection.jsx
// This component is responsible for editing the active session's start time and must adhere to the pause restriction:
// Pauses can only occur once every 12 hours; updates are blocked if a recent pause event exists.

import React, { useState } from 'react';
import { formatTime } from '../../utils';

const SessionEditSection = ({
  cageOnTime,
  editSessionDateInput,
  setEditSessionDateInput,
  editSessionTimeInput,
  setEditSessionTimeInput,
  editSessionMessage,
  handleUpdateCurrentCageOnTime,
  isAuthReady
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Temporarily disabled for debug
  // if (!isCurrentSessionActive) return null;

  const onUpdate = async () => {
    if (!isAuthReady || !editSessionDateInput || !editSessionTimeInput || isUpdating) return;
    setIsUpdating(true);
    await handleUpdateCurrentCageOnTime();
    setIsUpdating(false);
  };

  return (
    <div className="mb-8 px-4 py-5 sm:p-6 bg-orange-950 border border-orange-700 rounded-lg shadow">
      <h3 className="text-lg leading-6 font-medium text-orange-200 mb-3">Edit Chastity Start Time</h3>
      {cageOnTime && (
        <p className="text-sm text-orange-300 mb-4">
          Current Start: {formatTime(cageOnTime, true, true)}
        </p>
      )}
      <p className="text-sm text-orange-300 mb-4">
        Adjust the date and time when the current chastity session started. This will be recorded in the event log.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="editSessionDate" className="block text-sm font-medium text-orange-300 mb-1">New Start Date:</label>
          <input
            type="date"
            id="editSessionDate"
            value={editSessionDateInput}
            onChange={(e) => setEditSessionDateInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-orange-100 text-sm focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
        <div>
          <label htmlFor="editSessionTime" className="block text-sm font-medium text-orange-300 mb-1">New Start Time:</label>
          <input
            type="time"
            id="editSessionTime"
            value={editSessionTimeInput}
            onChange={(e) => setEditSessionTimeInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-orange-100 text-sm focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onUpdate}
        disabled={!isAuthReady || !editSessionDateInput || !editSessionTimeInput || isUpdating}
        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-sm py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
      >
        {isUpdating ? 'Updating...' : 'Update Start Time'}
      </button>
      {editSessionMessage && (
        <p className={`text-xs mt-2 ${editSessionMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
          {editSessionMessage}
        </p>
      )}
    </div>
  );
};

export default SessionEditSection;
