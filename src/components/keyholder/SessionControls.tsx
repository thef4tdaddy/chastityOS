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
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
    <div className="flex items-center gap-3 mb-4">
      <FaClock className="text-nightly-aquamarine" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Session Control
      </h3>
    </div>
    <p className="text-nightly-celadon">No active session to control.</p>
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
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaClock className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Current Session Status
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Status:</span>
          <div className="flex items-center gap-2">
            {session.isPaused ? (
              <>
                <FaPause className="text-yellow-400" />
                <span className="text-yellow-400">Paused</span>
              </>
            ) : (
              <>
                <FaPlay className="text-green-400" />
                <span className="text-green-400">Active</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Started:</span>
          <span className="text-nightly-honeydew">
            {session.startTime.toLocaleDateString()}{" "}
            {session.startTime.toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Pause Time:</span>
          <span className="text-nightly-honeydew">
            {formatDuration(session.accumulatedPauseTime)}
          </span>
        </div>

        {/* Info Message - No Control Buttons */}
        <div className="bg-blue-500/20 border border-blue-500 rounded p-3 mt-6">
          <p className="text-sm text-blue-200">
            Session control is managed by the submissive. Use the Release
            Request system to approve early unlock.
          </p>
        </div>
      </div>
    </div>
  );
};
