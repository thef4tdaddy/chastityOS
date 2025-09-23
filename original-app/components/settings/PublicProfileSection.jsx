import React from "react";
import { makeProfileToken } from "../../utils/publicProfile";

const sectionLabels = {
  currentStatus: "Current Status",
  totals: "Totals",
  arousalChart: "Arousal Chart",
  chastityHistory: "Chastity History",
  sexualEvents: "Sexual Events",
};

const PublicProfileSection = ({
  userId,
  savedSubmissivesName,
  publicProfileEnabled,
  publicStatsVisibility,
  togglePublicProfileEnabled,
  togglePublicStatVisibility,
}) => {
  const token = makeProfileToken(userId, savedSubmissivesName);
  const shareLink = `${window.location.origin}?profile=${token}`;

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-green-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-green-300 mb-4">
        Public Profile
      </h3>
      <label className="flex items-center space-x-2 mb-3 text-purple-200">
        <input
          type="checkbox"
          checked={publicProfileEnabled}
          onChange={togglePublicProfileEnabled}
          className="form-checkbox h-5 w-5 text-green-500 bg-gray-700 border-gray-600 rounded"
        />
        <span>Enable Public Profile</span>
      </label>
      {publicProfileEnabled && (
        <>
          <p className="text-sm text-purple-200 mb-2">Share this link:</p>
          <div className="bg-gray-900 p-2 rounded-md text-purple-100 text-sm mb-4 break-all">
            {shareLink}
          </div>
          <p className="text-sm text-purple-200 mb-2">Visible Sections:</p>
          <div className="space-y-2">
            {Object.keys(sectionLabels).map((key) => (
              <label
                key={key}
                className="flex items-center space-x-2 text-purple-200"
              >
                <input
                  type="checkbox"
                  checked={publicStatsVisibility?.[key] || false}
                  onChange={() => togglePublicStatVisibility(key)}
                  className="form-checkbox h-4 w-4 text-green-500 bg-gray-700 border-gray-600 rounded"
                />
                <span>{sectionLabels[key]}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PublicProfileSection;
