import React from "react";

interface TrackerStatsProps {
  topBoxLabel: string;
  topBoxTime: string;
  mainChastityDisplayTime: number;
  isPaused: boolean;
  livePauseDuration: number;
  accumulatedPauseTimeThisSession: number;
  isCageOn: boolean;
  timeCageOff: number;
  totalChastityTime: number;
  totalTimeCageOff: number;
}

export const TrackerStats: React.FC<TrackerStatsProps> = ({
  topBoxLabel,
  topBoxTime,
  mainChastityDisplayTime,
  isPaused,
  livePauseDuration,
  accumulatedPauseTimeThisSession,
  isCageOn,
  timeCageOff,
  totalChastityTime,
  totalTimeCageOff,
}) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Top stat card with enhanced glass effect */}
      <div className="glass-card-primary text-center glass-float">
        <p className="text-blue-200 text-sm md:text-lg font-medium mb-2">
          {topBoxLabel}
        </p>
        <p className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
          {topBoxTime}
        </p>
      </div>

      {/* Stats grid with enhanced glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div
          className={`glass-card transition-all duration-500 ${
            isCageOn
              ? isPaused
                ? "glass-card-accent border-yellow-400/30 shadow-yellow-400/20"
                : "border-green-400/30 shadow-green-400/20"
              : "glass-card-primary"
          }`}
        >
          <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
            Current Session In Chastity {isPaused ? "(Paused)" : ""}:
          </p>
          <p
            className={`text-2xl md:text-4xl font-bold mb-2 ${
              isCageOn
                ? isPaused
                  ? "text-yellow-300"
                  : "text-green-300"
                : "text-white"
            }`}
          >
            {mainChastityDisplayTime}
          </p>
          {isPaused && (
            <p className="text-xs text-yellow-200 bg-yellow-400/10 px-2 py-1 rounded-md">
              Currently paused for: {livePauseDuration}
            </p>
          )}
          {isCageOn && accumulatedPauseTimeThisSession > 0 && (
            <p className="text-xs text-yellow-200 bg-yellow-400/10 px-2 py-1 rounded-md mt-2">
              Total time paused this session: {accumulatedPauseTimeThisSession}
            </p>
          )}
        </div>

        <div
          className={`glass-card transition-all duration-500 ${
            !isCageOn && timeCageOff > 0
              ? "border-red-400/30 shadow-red-400/20"
              : "glass-card-primary"
          }`}
        >
          <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
            Current Session Cage Off:
          </p>
          <p
            className={`text-2xl md:text-4xl font-bold ${
              !isCageOn && timeCageOff > 0 ? "text-red-300" : "text-white"
            }`}
          >
            {timeCageOff}
          </p>
        </div>
      </div>

      {/* Total stats with subtle glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card glass-hover">
          <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
            Total Time In Chastity:
          </p>
          <p className="text-2xl md:text-4xl font-bold text-white">
            {totalChastityTime}
          </p>
        </div>
        <div className="glass-card glass-hover">
          <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
            Total Time Cage Off:
          </p>
          <p className="text-2xl md:text-4xl font-bold text-white">
            {totalTimeCageOff}
          </p>
        </div>
      </div>
    </div>
  );
};
