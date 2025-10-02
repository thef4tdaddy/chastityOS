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

  // Action handlers
  onStartSession?: () => void;
  onEndSession?: () => void;
  onBegForRelease?: () => void;
  onEmergencyUnlock?: () => void;

  // Loading states
  isStarting?: boolean;
  isEnding?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isCageOn,
  isGoalActive,
  isHardcoreGoal,
  requiredKeyholderDurationSeconds,
  hasPendingReleaseRequest,
  sessionId,
  userId,
  onStartSession,
  onEndSession,
  onBegForRelease,
  onEmergencyUnlock,
  isStarting = false,
  isEnding = false,
}) => {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      {/* Main Action Buttons with Glass Morphism */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
        {!isCageOn ? (
          <button
            type="button"
            onClick={onStartSession}
            disabled={isStarting}
            className="glass-button bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-bold py-4 px-8 text-lg shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? "Starting..." : "Cage On / Start Session"}
          </button>
        ) : isGoalActive && isHardcoreGoal ? (
          <button
            type="button"
            className="glass-button bg-gray-600/60 text-white font-bold py-4 px-8 text-lg cursor-not-allowed flex items-center justify-center space-x-2 opacity-60"
            disabled
          >
            <FaLock className="text-lg" />
            <span>Locked by Goal</span>
          </button>
        ) : requiredKeyholderDurationSeconds > 0 ? (
          <button
            type="button"
            onClick={onBegForRelease}
            disabled={hasPendingReleaseRequest}
            className="glass-button bg-gradient-to-r from-red-600/80 to-pink-600/80 hover:from-red-500/90 hover:to-pink-500/90 text-white font-bold py-4 px-8 text-lg shadow-xl hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasPendingReleaseRequest ? "Request Sent" : "Beg for Release"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onEndSession}
            disabled={isEnding}
            className="glass-button bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/90 hover:to-red-600/90 text-white font-bold py-4 px-8 text-lg shadow-xl hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnding ? "Ending..." : "Cage Off / End Session"}
          </button>
        )}
      </div>

      {/* Emergency Unlock Button with Enhanced Glass Styling */}
      {isCageOn && sessionId && userId && (
        <div className="flex justify-center">
          <EmergencyUnlockButton
            sessionId={sessionId}
            userId={userId}
            onEmergencyUnlock={onEmergencyUnlock}
            className="glass-button bg-gradient-to-r from-orange-600/70 to-red-600/70 hover:from-orange-500/80 hover:to-red-500/80 text-white text-sm py-3 px-6 shadow-lg hover:shadow-orange-500/20 transition-all duration-300"
          />
        </div>
      )}
    </div>
  );
};
