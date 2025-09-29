import React from "react";
import type { DBSession } from "../../types/database";
import { FaClock, FaPlay, FaPause, FaStop } from "../../utils/iconImport";

// Current Session Control (for unlocked keyholder mode)
interface SessionControlsProps {
  session: DBSession | null;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  session,
}) => {
  if (!session) {
    return (
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
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaClock className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Session Control
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

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            disabled={session.isPaused}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FaPause />
            Pause Session
          </button>

          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2">
            <FaStop />
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};
