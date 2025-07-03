import React from 'react';

const RestoreSessionPrompt = ({ onRestore, onDiscard, startedAt }) => {
  const formattedDate = startedAt
    ? new Date(startedAt.seconds * 1000).toLocaleString()
    : 'Unknown';

  return (
    <div className="bg-gray-800 border border-indigo-500 p-6 rounded-lg shadow-lg max-w-md mx-auto mt-4 text-center">
      <h3 className="text-xl font-semibold text-indigo-300 mb-2">Restore Previous Session</h3>
      <p className="text-sm text-gray-300 mb-4">
        A previous session was in progress.<br />
        <strong>Started at:</strong> {formattedDate}
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={onRestore}
          className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-md"
        >
          Restore Session
        </button>
        <button
          onClick={onDiscard}
          className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-md"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default RestoreSessionPrompt;