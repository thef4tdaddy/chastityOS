// src/components/settings/DisplaySettingsSection.jsx
import React from 'react';

const DisplaySettingsSection = ({ eventDisplayMode, handleSetEventDisplayMode }) => {
  return (
    <div className="mb-8 p-4 bg-gray-800 border border-blue-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-blue-300 mb-4">Display Settings</h3>
      <div className="flex items-center justify-between">
        <label htmlFor="eventDisplayModeToggle" className="text-sm font-medium text-purple-300 mr-3">
          Event Display Mode:
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-purple-200">
            <input
              type="radio"
              name="eventDisplayMode"
              value="kinky"
              checked={eventDisplayMode === 'kinky'}
              onChange={() => handleSetEventDisplayMode('kinky')}
              className="form-radio h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded-full focus:ring-blue-500"
            />
            <span>Kinky (Show all events)</span>
          </label>
          <label className="flex items-center space-x-2 text-purple-200">
            <input
              type="radio"
              name="eventDisplayMode"
              value="vanilla"
              checked={eventDisplayMode === 'vanilla'}
              onChange={() => handleSetEventDisplayMode('vanilla')}
              className="form-radio h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded-full focus:ring-blue-500"
            />
            <span>Vanilla (Hide kinky events)</span>
          </label>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-left">
        Choose 'Kinky' to see all logged sexual events. Choose 'Vanilla' to hide specific "kinky" event types from the log for a more discreet view.
      </p>
    </div>
  );
};

export default DisplaySettingsSection;
