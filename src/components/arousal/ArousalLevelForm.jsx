import React from 'react';

const ArousalLevelForm = ({
  newArousalLevel,
  setNewArousalLevel,
  newArousalNotes,
  setNewArousalNotes,
  logArousalLevel,
  arousalMessage,
  isNightly
}) => {
  return (
    <form
      onSubmit={e => { e.preventDefault(); logArousalLevel(); }}
      className={`mb-8 p-4 rounded-lg border space-y-4 ${isNightly ? 'bg-nightly-bg border-nightly-border' : 'bg-prod-bg border-prod-border'}`}
    >
      <div>
        <label htmlFor="arousalLevel" className={`block text-sm font-medium text-left ${isNightly ? 'text-nightly-accent' : 'text-prod-accent'}`}>Arousal Level (1-10):</label>
        <input
          type="number"
          id="arousalLevel"
          value={newArousalLevel}
          onChange={e => setNewArousalLevel(e.target.value)}
          min="1"
          max="10"
          className="mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent"
          required
        />
      </div>
      <div>
        <label htmlFor="arousalNotes" className={`block text-sm font-medium text-left ${isNightly ? 'text-nightly-accent' : 'text-prod-accent'}`}>Notes:</label>
        <textarea
          id="arousalNotes"
          value={newArousalNotes}
          onChange={e => setNewArousalNotes(e.target.value)}
          rows="3"
          className="mt-1 block w-full px-3 py-2 rounded-md border bg-app-input text-app-text focus:ring-accent focus:border-accent"
          placeholder="Optional details..."
        />
      </div>
      <button type="submit" className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300">
        Log Arousal Level
      </button>
      {arousalMessage && <p className="text-sm mt-2 text-green-400">{arousalMessage}</p>}
    </form>
  );
};

export default ArousalLevelForm;
