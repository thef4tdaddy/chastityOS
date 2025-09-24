import React from "react";

interface PauseResumeButtonsProps {
  isPaused: boolean;
}

export const PauseResumeButtons: React.FC<PauseResumeButtonsProps> = ({
  isPaused,
}) => {
  return (
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6 md:mb-8 justify-center">
      {!isPaused ? (
        <button
          type="button"
          className="flex-grow bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50"
        >
          Pause Session
        </button>
      ) : (
        <button
          type="button"
          className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50"
        >
          Resume Session
        </button>
      )}
    </div>
  );
};
