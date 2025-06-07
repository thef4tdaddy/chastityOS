// src/components/settings/SessionEditSection.jsx
import React from 'react';
import { formatTime } from '../../utils';

const SessionEditSection = ({
  isCurrentSessionActive,
  cageOnTime,
  editSessionDateInput,
  setEditSessionDateInput,
  editSessionTimeInput,
  setEditSessionTimeInput,
  handleUpdateCurrentCageOnTime,
  editSessionMessage,
  isAuthReady
}) => {
  if (!isCurrentSessionActive) return null;

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-orange-600 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-orange-300 mb-2">Edit Active Session Start Time</h3>
      {cageOnTime && (
        <p className="text-sm text-purple-300 mb-1">
          Current Start: {formatTime(cageOnTime, true, true)}
        </p>
      )}
      <p className="text-xs text-purple-400 mb-3">
        Adjust the date and time when the current chastity session started. This will be recorded in the event log.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="editSessionDate" className="block text-sm font-medium text-purple-300 mb-1 text-left">New Start Date:</label>
          <input
            type="date"
            id="editSessionDate"
            value={editSessionDateInput}
            onChange={(e) => setEditSessionDateInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-gray-50 text-sm focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
        <div>
          <label htmlFor="editSessionTime" className="block text-sm font-medium text-purple-300 mb-1 text-left">New Start Time:</label>
          <input
            type="time"
            id="editSessionTime"
            value={editSessionTimeInput}
            onChange={(e) => setEditSessionTimeInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-gray-50 text-sm focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleUpdateCurrentCageOnTime}
        disabled={!isAuthReady || !editSessionDateInput || !editSessionTimeInput}
        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
      >
        Update Start Time
      </button>
      {editSessionMessage && (
        <p className={`text-xs mt-2 ${editSessionMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
          {editSessionMessage}
        </p>
      )}
    </div>
  );
};

export default SessionEditSection;
