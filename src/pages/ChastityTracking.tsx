import React from "react";
import { RestoreSessionPrompt } from "../components/tracker/RestoreSessionPrompt";
import { TrackerStats } from "../components/tracker/TrackerStats";
import { ActionButtons } from "../components/tracker/ActionButtons";
import { PauseResumeButtons } from "../components/tracker/PauseResumeButtons";
import { ReasonModals } from "../components/tracker/ReasonModals";

import { TrackerHeader } from "../components/tracker/TrackerHeader";

const TrackerPage: React.FC = () => {
  // Mock data
  const isCageOn = true;
  const isPaused = false;
  const remainingGoalTime = 3600;
  const keyholderName = "Keyholder";
  const savedSubmissivesName = "Submissive";
  const requiredKeyholderDurationSeconds = 7200;
  const mainChastityDisplayTime = 3600;
  const topBoxLabel = "Total Locked Time";
  const topBoxTime = "1d 2h 3m";
  const livePauseDuration = 0;
  const accumulatedPauseTimeThisSession = 0;
  const timeCageOff = 0;
  const totalChastityTime = 86400;
  const totalTimeCageOff = 0;
  const showRestoreSessionPrompt = false;
  const pauseCooldownMessage = null;
  const denialCooldownActive = false;
  const hasPendingReleaseRequest = false;
  const isGoalActive = true;
  const isHardcoreGoal = false;
  const showReasonModal = false;
  const showPauseReasonModal = false;

  // Mock session and user data for emergency unlock
  const sessionId = "mock-session-123";
  const userId = "mock-user-456";

  const handleEmergencyUnlock = () => {
    // This would typically refresh the session state or redirect
    console.log("Emergency unlock completed - refreshing session state");
  };

  return (
    <div className="text-nightly-spring-green">
      {showRestoreSessionPrompt && (
        <RestoreSessionPrompt onConfirm={() => {}} onDiscard={() => {}} />
      )}

      <TrackerHeader
        remainingGoalTime={remainingGoalTime}
        keyholderName={keyholderName}
        savedSubmissivesName={savedSubmissivesName}
        requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
        isCageOn={isCageOn}
        denialCooldownActive={denialCooldownActive}
        pauseCooldownMessage={pauseCooldownMessage}
      />

      <TrackerStats
        topBoxLabel={topBoxLabel}
        topBoxTime={topBoxTime}
        mainChastityDisplayTime={mainChastityDisplayTime}
        isPaused={isPaused}
        livePauseDuration={livePauseDuration}
        accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
        isCageOn={isCageOn}
        timeCageOff={timeCageOff}
        totalChastityTime={totalChastityTime}
        totalTimeCageOff={totalTimeCageOff}
      />

      <ActionButtons
        isCageOn={isCageOn}
        isGoalActive={isGoalActive}
        isHardcoreGoal={isHardcoreGoal}
        requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
        hasPendingReleaseRequest={hasPendingReleaseRequest}
        sessionId={sessionId}
        userId={userId}
        onEmergencyUnlock={handleEmergencyUnlock}
      />

      {isCageOn && <PauseResumeButtons isPaused={isPaused} />}

      <ReasonModals
        showReasonModal={showReasonModal}
        showPauseReasonModal={showPauseReasonModal}
      />
    </div>
  );
};

export default TrackerPage;
