// src/components/settings/AccountSection.jsx
import React from 'react';

const AccountSection = ({
  isAuthReady,
  savedSubmissivesName,
  submissivesNameInput,
  handleSubmissivesNameInputChange,
  handleSetSubmissivesName,
  showUserIdInSettings,
  handleToggleUserIdVisibility,
  userId,
  nameMessage
}) => {
  return (
    <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-purple-300 mb-4">Profile Information</h3>

      {!savedSubmissivesName && isAuthReady && (
        <div className="mb-4">
          <label htmlFor="settingsSubmissivesName" className="block text-sm font-medium text-purple-300 mb-1 text-left">
            Submissive's Name: (Not Set)
          </label>
          <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
            <input
              type="text"
              id="settingsSubmissivesName"
              value={submissivesNameInput || ''}
              onChange={handleSubmissivesNameInputChange}
              placeholder="Enter Submissive's Name"
              className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-purple-600 bg-gray-900 text-gray-50 text-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleSetSubmissivesName}
              disabled={!isAuthReady || !(submissivesNameInput || '').trim()}
              className="w-full mt-2 sm:mt-0 sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
            >
              Set Name
            </button>
          </div>
        </div>
      )}

      {savedSubmissivesName && (
        <div className="mb-4 text-left">
          <p className="text-sm font-medium text-purple-300">Submissive's Name:</p>
          <p className="text-lg text-purple-100">{savedSubmissivesName}</p>
          <p className="text-xs text-purple-400">(To change, use "Reset All Application Data" below.)</p>
        </div>
      )}

      {nameMessage && (
        <p className={`text-xs mt-2 mb-3 text-left ${nameMessage.includes('successfully') || nameMessage.includes('set') ? 'text-green-400' : 'text-yellow-400'}`}>
          {nameMessage}
        </p>
      )}

      <div>
        <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Account ID</h4>
        <button
          type="button"
          onClick={handleToggleUserIdVisibility}
          disabled={!isAuthReady}
          className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 mb-3"
        >
          {showUserIdInSettings ? 'Hide User ID' : 'Show User ID'}
        </button>

        {showUserIdInSettings && userId && (
          <div className="p-3 bg-gray-700 rounded-md text-left">
            <p className="text-sm text-purple-300">
              Your User ID: <span className="font-mono text-purple-100 select-all">{userId}</span>
            </p>
            <p className="text-xs text-purple-400 mt-1">
              (This ID is used for data storage. Keep it safe if you ever need manual assistance with your data.)
            </p>
          </div>
        )}

        {showUserIdInSettings && !userId && isAuthReady && (
          <p className="text-sm text-yellow-400 bg-gray-700 p-2 rounded text-left">
            User ID not available yet. Please wait for authentication to complete.
          </p>
        )}
      </div>
    </div>
  );
};

export default AccountSection;
