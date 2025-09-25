import React from "react";
import { FaLock } from "../../utils/iconImport";
import { EmergencyUnlockButton } from "./EmergencyUnlockButton";

interface ActionButtonsProps {
  isCageOn: boolean;
  isGoalActive: boolean;
  isHardcoreGoal: boolean;
  requiredKeyholderDurationSeconds: number;
  hasPendingReleaseRequest: boolean;
  sessionId?: string;
  userId?: string;
  onEmergencyUnlock?: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isCageOn,
  isGoalActive,
  isHardcoreGoal,
  requiredKeyholderDurationSeconds,
  hasPendingReleaseRequest,
  sessionId,
  userId,
  onEmergencyUnlock,
}) => {
  return (
    <div className="flex flex-col space-y-3 mb-3">
      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
        {!isCageOn ? (
          <button
            type="button"
            className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-nightly-lavender-floral hover:bg-purple-600 focus:ring-purple-400"
          >
            Cage On / Start Session
          </button>
        ) : isGoalActive && isHardcoreGoal ? (
          <button
            type="button"
            className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 flex items-center justify-center cursor-not-allowed"
            disabled
          >
            <FaLock className="mr-2" /> Locked by Goal
          </button>
        ) : requiredKeyholderDurationSeconds > 0 ? (
          <button
            type="button"
            className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-500 hover:bg-red-600 focus:ring-red-400"
          >
            {hasPendingReleaseRequest ? "Request Sent" : "Beg for Release"}
          </button>
        ) : (
          <button
            type="button"
            className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            Cage Off / End Session
          </button>
        )}
      </div>

      {/* Emergency Unlock Button - Always Available when session is active */}
      {isCageOn && sessionId && userId && (
        <div className="flex justify-center">
          <EmergencyUnlockButton
            sessionId={sessionId}
            userId={userId}
            onEmergencyUnlock={onEmergencyUnlock}
            className="text-sm py-2 px-4"
          />
        </div>
      )}
    </div>
  );
};
