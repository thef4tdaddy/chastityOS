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
    <div className="space-y-4 mb-6 md:mb-8">
      <div className="bg-white/10 backdrop-blur-xs border-white/20 p-3 md:p-4 rounded-lg shadow-sm text-center">
        <p className="tracker-label text-sm md:text-lg">{topBoxLabel}</p>
        <p className="tracker-value text-2xl md:text-4xl font-semibold">
          {topBoxTime}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${isCageOn ? (isPaused ? "bg-yellow-500/20 border-yellow-600" : "bg-green-500/20 border-green-600") : "bg-white/10 backdrop-blur-xs border-white/20"}`}
        >
          <p className="tracker-label text-sm md:text-lg">
            Current Session In Chastity {isPaused ? "(Paused)" : ""}:
          </p>
          <p
            className={`tracker-value text-2xl md:text-4xl font-bold ${isCageOn ? (isPaused ? "text-yellow-400" : "text-green-400") : ""}`}
          >
            {mainChastityDisplayTime}
          </p>
          {isPaused && (
            <p className="text-xs text-yellow-300 mt-1">
              Currently paused for: {livePauseDuration}
            </p>
          )}
          {isCageOn && accumulatedPauseTimeThisSession > 0 && (
            <p className="text-xs text-yellow-300 mt-1">
              Total time paused this session: {accumulatedPauseTimeThisSession}
            </p>
          )}
        </div>
        <div
          className={`p-3 md:p-4 rounded-lg shadow-sm transition-colors duration-300 border ${!isCageOn && timeCageOff > 0 ? "bg-red-500/20 border-red-600" : "bg-white/10 backdrop-blur-xs border-white/20"}`}
        >
          <p className="tracker-label text-sm md:text-lg">
            Current Session Cage Off:
          </p>
          <p
            className={`tracker-value text-2xl md:text-4xl font-bold ${!isCageOn && timeCageOff > 0 ? "text-red-400" : ""}`}
          >
            {timeCageOff}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-xs border-white/20 p-3 md:p-4 rounded-lg shadow-sm">
          <p className="tracker-label text-sm md:text-lg">
            Total Time In Chastity:
          </p>
          <p className="tracker-value text-2xl md:text-4xl font-bold">
            {totalChastityTime}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-xs border-white/20 p-3 md:p-4 rounded-lg shadow-sm">
          <p className="tracker-label text-sm md:text-lg">
            Total Time Cage Off:
          </p>
          <p className="tracker-value text-2xl md:text-4xl font-bold">
            {totalTimeCageOff}
          </p>
        </div>
      </div>
    </div>
  );
};
