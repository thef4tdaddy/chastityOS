import React from 'react';

const NameSection = ({
  isAuthReady,
  savedSubmissivesName,
  submissivesNameInput,
  handleSubmissivesNameInputChange,
  handleSetSubmissivesName,
  nameMessage
}) => (
  <>
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
      </div>
    )}

    {nameMessage && (
      <p className={`text-xs mt-2 mb-3 text-left ${nameMessage.includes('successfully') || nameMessage.includes('set') ? 'text-green-400' : 'text-yellow-400'}`}>
        {nameMessage}
      </p>
    )}
  </>
);

export default NameSection;