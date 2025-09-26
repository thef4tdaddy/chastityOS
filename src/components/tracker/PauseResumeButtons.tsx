import React from "react";

interface PauseResumeButtonsProps {
  isPaused: boolean;
}

export const PauseResumeButtons: React.FC<PauseResumeButtonsProps> = ({
  isPaused,
}) => {
  return (
    <div className="flex justify-center mb-8">
      {!isPaused ? (
        <button
          type="button"
          className="glass-button bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-500/90 hover:to-orange-500/90 text-white font-bold py-3 px-6 shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 transform hover:scale-105"
        >
          Pause Session
        </button>
      ) : (
        <button
          type="button"
          className="glass-button bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/90 hover:to-emerald-500/90 text-white font-bold py-3 px-6 shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105"
        >
          Resume Session
        </button>
      )}
    </div>
  );
};
