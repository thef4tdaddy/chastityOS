import React from "react";
import { FaLock } from "../../utils/iconImport";
import { Button, Tooltip } from "@/components/ui";
import { EmergencyUnlockButton } from "./EmergencyUnlockButton";
import { BegForReleaseButton } from "./BegForReleaseButton";

interface ActionButtonsProps {
  isCageOn: boolean;
  isGoalActive: boolean;
  isHardcoreGoal: boolean;
  requiredKeyholderDurationSeconds: number;
  hasPendingReleaseRequest?: boolean; // Deprecated - now handled by BegForReleaseButton
  sessionId?: string;
  userId?: string;
  keyholderUserId?: string;

  // Action handlers
  onStartSession?: () => void;
  onEndSession?: () => void;
  onBegForRelease?: () => void; // Deprecated - now handled by BegForReleaseButton
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
  sessionId,
  userId,
  keyholderUserId,
  onStartSession,
  onEndSession,
  onEmergencyUnlock,
  isStarting = false,
  isEnding = false,
}) => {
  return (
    <div
      className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6"
      role="group"
      aria-label="Chastity session controls"
    >
      {/* Main Action Buttons with Glass Morphism */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
        {!isCageOn ? (
          <Button
            variant="primary"
            onClick={onStartSession}
            disabled={isStarting}
            loading={isStarting}
            className="glass-button bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 min-h-[44px] py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 button-press-active focus-ring-animated"
            aria-label="Start chastity session"
          >
            {isStarting ? "Starting..." : "ON"}
          </Button>
        ) : isGoalActive && isHardcoreGoal ? (
          sessionId && userId ? (
            <Tooltip content="Emergency unlock is available for urgent situations only. PIN required for hardcore mode.">
              <EmergencyUnlockButton
                sessionId={sessionId}
                userId={userId}
                onEmergencyUnlock={onEmergencyUnlock}
                requirePin={true}
                className="glass-button bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-500/90 hover:to-red-500/90 text-white font-bold min-h-[44px] py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg shadow-xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400/50 button-press-active"
                aria-label="Emergency unlock session (requires PIN)"
              />
            </Tooltip>
          ) : (
            <Tooltip content="Session is locked due to active hardcore goal. Complete the goal to unlock.">
              <Button
                variant="secondary"
                disabled
                className="glass-button bg-gray-600/60 min-h-[44px] py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg cursor-not-allowed flex items-center justify-center space-x-2 opacity-60 tracker-state-transition"
                leftIcon={
                  <FaLock className="text-base sm:text-lg" aria-hidden="true" />
                }
                aria-label="Session locked by active hardcore goal"
              >
                Locked by Goal
              </Button>
            </Tooltip>
          )
        ) : requiredKeyholderDurationSeconds > 0 ? (
          sessionId && userId && keyholderUserId ? (
            <Tooltip content="Request early release from your keyholder. They will review and approve or deny your request.">
              <BegForReleaseButton
                sessionId={sessionId}
                userId={userId}
                keyholderUserId={keyholderUserId}
                className="glass-button bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-bold min-h-[44px] py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/50 button-press-active"
              />
            </Tooltip>
          ) : (
            <Tooltip content="Your keyholder has locked your session. Only they can approve release.">
              <Button
                variant="secondary"
                disabled
                className="glass-button bg-gray-600/60 min-h-[44px] py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg cursor-not-allowed flex items-center justify-center space-x-2 opacity-60 tracker-state-transition"
                leftIcon={
                  <FaLock className="text-base sm:text-lg" aria-hidden="true" />
                }
                aria-label="Session locked by keyholder, approval required for release"
              >
                Keyholder Required
              </Button>
            </Tooltip>
          )
        ) : (
          <Button
            variant="danger"
            onClick={onEndSession}
            disabled={isEnding}
            loading={isEnding}
            className="glass-button bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/90 hover:to-red-600/90 min-h-[44px] py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg shadow-xl hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-300 button-press-active focus-ring-animated"
            aria-label="End chastity session"
          >
            {isEnding ? "Ending..." : "OFF"}
          </Button>
        )}
      </div>
    </div>
  );
};
