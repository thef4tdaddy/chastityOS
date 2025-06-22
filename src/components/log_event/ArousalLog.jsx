import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * A component for logging the wearer's daily sexual arousal level.
 * @param {object} props - The component props.
 * @param {Function} props.onLogArousal - Function to call when logging arousal.
 * @param {Array} props.events - The list of past events to check for today's log.
 * @returns {React.ReactElement} The rendered component.
 */
export default function ArousalLog({ onLogArousal, events }) {
  const [arousal, setArousal] = useState(5);
  const [arousalLoggedToday, setArousalLoggedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Determine if an arousal level has been logged today.
    const today = new Date().toDateString();
    const hasLoggedToday = events.some(event => {
      const eventDate = new Date(event.timestamp).toDateString();
      return event.type === 'arousal' && eventDate === today;
    });
    setArousalLoggedToday(hasLoggedToday);
    setIsLoading(false);
  }, [events]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (arousalLoggedToday) return;

    onLogArousal(arousal);
    setArousalLoggedToday(true); // Immediately update UI to reflect submission
  };

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading arousal log...</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Daily Arousal Log</h3>
      {arousalLoggedToday ? (
        <p className="text-center text-green-600 dark:text-green-400">You have already logged your arousal level for today. See you tomorrow!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="arousal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Arousal Level: <span className="font-bold text-indigo-600 dark:text-indigo-400">{arousal}</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Rate your general level of sexual arousal for today from 1 (Not Aroused) to 10 (Extremely Aroused).</p>
            <input
              id="arousal"
              type="range"
              min="1"
              max="10"
              value={arousal}
              onChange={(e) => setArousal(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              disabled={arousalLoggedToday}
            />
          </div>
          <button
            type="submit"
            disabled={arousalLoggedToday}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
          >
            Log Arousal Level
          </button>
        </form>
      )}
    </div>
  );
}

ArousalLog.propTypes = {
  onLogArousal: PropTypes.func.isRequired,
  events: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
  })).isRequired,
};
