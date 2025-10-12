import React from "react";

interface TrackerHeaderProps {
  remainingGoalTime: number;
  keyholderName: string;
  savedSubmissivesName: string;
  requiredKeyholderDurationSeconds: number;
  isCageOn: boolean;
  denialCooldownActive: boolean;
  pauseCooldownMessage: string | null;
}

export const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  remainingGoalTime,
  keyholderName,
  savedSubmissivesName,
  requiredKeyholderDurationSeconds,
  isCageOn,
  denialCooldownActive,
  pauseCooldownMessage,
}) => {
  return (
    <>
      {pauseCooldownMessage && (
        <div
          className="mb-3 md:mb-4 p-2.5 md:p-3 bg-yellow-600/30 border border-yellow-500 rounded-lg text-xs sm:text-sm text-yellow-200 tracker-state-transition"
          role="status"
          aria-live="polite"
          aria-label="Pause cooldown status"
        >
          {pauseCooldownMessage}
        </div>
      )}

      {isCageOn && remainingGoalTime > 0 && (
        <div
          className={`mb-3 md:mb-4 p-3 md:p-4 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20 tracker-state-transition tracker-card-hover`}
          role="region"
          aria-label={`Goal timer: ${Math.floor(remainingGoalTime / 3600)} hours ${Math.floor((remainingGoalTime % 3600) / 60)} minutes remaining`}
        >
          <p
            className={`text-base sm:text-lg md:text-xl font-semibold text-blue-200`}
            id="goal-timer-label"
          >
            Time Remaining on Goal:
          </p>
          <p
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-100 number-update mt-1"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-labelledby="goal-timer-label"
          >
            {Math.floor(remainingGoalTime / 3600)}h{" "}
            {Math.floor((remainingGoalTime % 3600) / 60)}m
          </p>
        </div>
      )}

      {keyholderName &&
        keyholderName !== "" &&
        requiredKeyholderDurationSeconds > 0 && (
          <div
            className={`mb-3 md:mb-4 p-3 md:p-4 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20 tracker-state-transition tracker-card-hover`}
            role="region"
            aria-label={`Keyholder requirement: ${keyholderName} requires ${savedSubmissivesName || "the submissive"} to be in chastity for ${requiredKeyholderDurationSeconds}`}
          >
            <p
              className={`text-xs sm:text-sm md:text-base font-semibold text-purple-200 leading-relaxed`}
            >
              {keyholderName} requires{" "}
              {savedSubmissivesName || "the submissive"} to be in chastity for{" "}
              {requiredKeyholderDurationSeconds}
            </p>
          </div>
        )}

      {denialCooldownActive && (
        <div
          className="mb-3 md:mb-4 p-2.5 md:p-3 bg-red-600/30 border border-red-500 rounded-lg text-xs sm:text-sm text-red-200 tracker-state-transition"
          role="status"
          aria-live="assertive"
          aria-label="Denial cooldown active"
        >
          Denial cooldown active
        </div>
      )}
    </>
  );
};
