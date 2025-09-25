import React from "react";
import { FaLock } from "../../utils/iconImport";

interface ActionButtonsProps {
  isCageOn: boolean;
  isGoalActive: boolean;
  isHardcoreGoal: boolean;
  requiredKeyholderDurationSeconds: number;
  hasPendingReleaseRequest: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isCageOn,
  isGoalActive,
  isHardcoreGoal,
  requiredKeyholderDurationSeconds,
  hasPendingReleaseRequest,
}) => {
  return (
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-3 justify-center">
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
          className="flex-grow font-bold py-3 px-5 md:py-4 md:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 text-white disabled:opacity-50 bg-red-700 hover:bg-red-800 focus:ring-red-500 flex items-center justify-center"
        >
          <FaLock className="mr-2" /> Emergency Unlock
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
  );
};
