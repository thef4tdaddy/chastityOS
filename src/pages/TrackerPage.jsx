
import React from 'react';
import { formatTime } from '../utils';

const TrackerPage = ({
  isCageOn,
  cageOnTime,
  chastityHistory,
  chastityDuration,
  cageDuration
}) => {
  const hasHistory = Array.isArray(chastityHistory) && chastityHistory.length > 0;
  const lastEndTime = hasHistory ? chastityHistory[chastityHistory.length - 1].endTime : null;

  return (
    <div className="p-6 text-purple-200">
      <h2 className="text-2xl font-bold mb-4">Chastity Tracker</h2>
      <p className="mb-2">Cage Status: {isCageOn ? 'Locked' : 'Unlocked'}</p>
      <p className="mb-2">
        Current Duration: {formatTime(isCageOn ? cageOnTime : lastEndTime)}
      </p>
      <p className="mb-2">Total Chastity Time: {formatTime(chastityDuration)}</p>
      <p className="mb-2">Total Cage Time: {formatTime(cageDuration)}</p>
      {hasHistory ? (
        <ul className="mt-4 text-left list-disc list-inside">
          {chastityHistory.map((entry, index) => (
            <li key={index}>
              {entry.startTime} - {entry.endTime || 'Ongoing'}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-purple-400">No history yet.</p>
      )}
    </div>
  );
};

export default TrackerPage;
