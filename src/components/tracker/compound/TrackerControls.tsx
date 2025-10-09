/**
 * TrackerControls - Sub-component for session control buttons
 */

import React from "react";
import { useTrackerContext } from "./TrackerContext";
import { ActionButtons } from "../ActionButtons";
import { PauseResumeButtons } from "../PauseResumeButtons";

export const TrackerControls: React.FC = () => {
  const {
    isActive,
    isPaused,
    controls,
    canPause,
    cooldownRemaining,
    isStarting,
    isEnding,
    handleEmergencyUnlock,
    sessionId,
    userId,
    personalGoal,
    isHardcoreMode,
    keyholderGoal,
  } = useTrackerContext();

  // Determine if there's a keyholder requirement
  const requiredKeyholderDurationSeconds = keyholderGoal?.targetValue || 0;

  return (
    <div className="space-y-4">
      {/* Main Action Buttons (Start/Stop) */}
      <ActionButtons
        isCageOn={isActive}
        isGoalActive={!!personalGoal}
        isHardcoreGoal={isHardcoreMode || false}
        requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
        sessionId={sessionId}
        userId={userId}
        onStartSession={controls.start}
        onEndSession={() => controls.end("User ended session")}
        onEmergencyUnlock={handleEmergencyUnlock}
        isStarting={isStarting}
        isEnding={isEnding}
      />

      {/* Pause/Resume Buttons */}
      {isActive && sessionId && userId && (
        <PauseResumeButtons
          sessionId={sessionId}
          userId={userId}
          isPaused={isPaused}
          pauseState={{
            canPause,
            cooldownRemaining,
          }}
          onPause={() => controls.pause("User paused session")}
          onResume={controls.resume}
        />
      )}
    </div>
  );
};
