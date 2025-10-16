import React from "react";
import type { DBSession } from "../../types/database";
import { FaClock, FaPlay, FaPause } from "../../utils/iconImport";

// Helper function for duration formatting
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// No Session Component
const NoSessionDisplay: React.FC = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6">
    <div className="flex items-center gap-2 sm:gap-3 mb-4">
      <FaClock className="text-nightly-aquamarine flex-shrink-0" />
      <h3 className="text-base sm:text-lg font-semibold text-nightly-honeydew">
        Session Control
      </h3>
    </div>
    <p className="text-sm sm:text-base text-nightly-celadon">
      No active session to control.
    </p>
  </div>
);

// Current Session Control (for unlocked keyholder mode)
interface SessionControlsProps {
  session: DBSession | null;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  session,
}) => {
  if (!session) {
    return <NoSessionDisplay />;
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <FaClock className="text-nightly-aquamarine flex-shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-nightly-honeydew">
          Current Session Status
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-nightly-celadon">
            Status:
          </span>
          <div className="flex items-center gap-2">
            {session.isPaused ? (
              <>
                <FaPause className="text-yellow-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-yellow-400">
                  Paused
                </span>
              </>
            ) : (
              <>
                <FaPlay className="text-green-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-green-400">
                  Active
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-nightly-celadon">
            Started:
          </span>
          <span className="text-xs sm:text-sm text-nightly-honeydew break-words text-left sm:text-right">
            {session.startTime.toLocaleDateString()}{" "}
            {session.startTime.toLocaleTimeString()}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-nightly-celadon">
            Pause Time:
          </span>
          <span className="text-xs sm:text-sm text-nightly-honeydew">
            {formatDuration(session.accumulatedPauseTime)}
          </span>
        </div>

        {/* Info Message - No Control Buttons */}
        <div className="bg-blue-500/20 border border-blue-500 rounded p-3 mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-blue-200">
            Session control is managed by the submissive. Use the Release
            Request system to approve early unlock.
          </p>
        </div>
      </div>
    </div>
  );
};
