// src/components/settings/PersonalGoalSection.jsx
import React, { useState, useEffect } from 'react';
import { formatElapsedTime } from '../../utils';

const PersonalGoalSection = ({ goalDurationSeconds, handleSetGoalDuration, isAuthReady }) => {
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    if (goalDurationSeconds !== null && goalDurationSeconds > 0) {
      const d = Math.floor(goalDurationSeconds / 86400);
      const h = Math.floor((goalDurationSeconds % 86400) / 3600);
      const m = Math.floor((goalDurationSeconds % 3600) / 60);
      setDays(d.toString());
      setHours(h.toString());
      setMinutes(m.toString());
    } else {
      setDays('');
      setHours('');
      setMinutes('');
    }
  }, [goalDurationSeconds]);

  const onSetGoal = () => {
    const totalSeconds = (parseInt(days) || 0) * 86400 + (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
    handleSetGoalDuration(totalSeconds > 0 ? totalSeconds : null);
  };

  const onClearGoal = () => {
    handleSetGoalDuration(null);
  };

  return (
    <div className="mb-8 px-4 py-5 sm:p-6 bg-gray-800 border border-blue-700 rounded-lg shadow">
      <h3 className="text-lg leading-6 font-medium text-blue-200 mb-3">Personal Chastity Goal</h3>
      <p className="text-sm text-blue-300 mb-4">
        Set a personal time goal for your chastity sessions. This will be shown on the main tracker page.
      </p>
      
      {goalDurationSeconds > 0 && (
        <p className="text-sm text-green-300 mb-4">
          Current Goal: <strong>{formatElapsedTime(goalDurationSeconds)}</strong>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label htmlFor="goalDays" className="block text-xs font-medium text-blue-300 mb-1">Days</label>
          <input
            type="number"
            id="goalDays"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-blue-500 bg-gray-900 text-blue-100 text-sm focus:ring-blue-400 focus:border-blue-400"
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="goalHours" className="block text-xs font-medium text-blue-300 mb-1">Hours</label>
          <input
            type="number"
            id="goalHours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-blue-500 bg-gray-900 text-blue-100 text-sm focus:ring-blue-400 focus:border-blue-400"
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="goalMinutes" className="block text-xs font-medium text-blue-300 mb-1">Minutes</label>
          <input
            type="number"
            id="goalMinutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-blue-500 bg-gray-900 text-blue-100 text-sm focus:ring-blue-400 focus:border-blue-400"
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onSetGoal}
          disabled={!isAuthReady}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
        >
          Set/Update Goal
        </button>
        <button
          type="button"
          onClick={onClearGoal}
          disabled={!isAuthReady || !goalDurationSeconds}
          className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white text-sm py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
        >
          Clear Goal
        </button>
      </div>
    </div>
  );
};

export default PersonalGoalSection;
