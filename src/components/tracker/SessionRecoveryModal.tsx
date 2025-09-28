import React from "react";
import { FaExclamationTriangle, FaClock, FaCalendarAlt } from "react-icons/fa";
import type { DBSession } from "../../types/database";

interface SessionRecoveryModalProps {
  corruptedSession: DBSession;
  onRecover: (session: DBSession) => void;
  onDiscard: () => void;
  isRecovering?: boolean;
}

export const SessionRecoveryModal: React.FC<SessionRecoveryModalProps> = ({
  corruptedSession,
  onRecover,
  onDiscard,
  isRecovering = false,
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateEstimatedDuration = (session: DBSession): number => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const totalMs = now.getTime() - startTime.getTime();
    const totalSeconds = Math.floor(totalMs / 1000);
    return Math.max(0, totalSeconds - session.accumulatedPauseTime);
  };

  const estimatedDuration = calculateEstimatedDuration(corruptedSession);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full border border-yellow-500">
        <div className="text-center mb-6">
          <FaExclamationTriangle className="text-yellow-400 text-4xl mx-auto mb-3" />
          <h3 className="text-xl font-bold text-yellow-300 mb-2">
            Session Recovery Required
          </h3>
          <p className="text-sm text-gray-300">
            We detected an interrupted session that may have corrupted data.
            Would you like to attempt recovery?
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center text-sm text-gray-300">
            <FaCalendarAlt className="text-blue-400 mr-2" />
            <span className="font-medium">Session Started:</span>
            <span className="ml-2">
              {new Date(corruptedSession.startTime).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-300">
            <FaClock className="text-green-400 mr-2" />
            <span className="font-medium">Estimated Duration:</span>
            <span className="ml-2">{formatDuration(estimatedDuration)}</span>
          </div>

          {corruptedSession.isPaused && (
            <div className="flex items-center text-sm text-yellow-300">
              <FaExclamationTriangle className="text-yellow-400 mr-2" />
              <span className="font-medium">Status:</span>
              <span className="ml-2">Session was paused</span>
            </div>
          )}

          {corruptedSession.accumulatedPauseTime > 0 && (
            <div className="flex items-center text-sm text-gray-300">
              <FaClock className="text-orange-400 mr-2" />
              <span className="font-medium">Total Pause Time:</span>
              <span className="ml-2">
                {formatDuration(corruptedSession.accumulatedPauseTime)}
              </span>
            </div>
          )}
        </div>

        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-6">
          <p className="text-xs text-yellow-200">
            <strong>Recovery Process:</strong> We'll attempt to fix any data
            inconsistencies while preserving your session progress. Your session
            timing and pause history will be validated and corrected if
            necessary.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onRecover(corruptedSession)}
            disabled={isRecovering}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center"
          >
            {isRecovering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Recovering...
              </>
            ) : (
              "Recover Session"
            )}
          </button>

          <button
            onClick={onDiscard}
            disabled={isRecovering}
            className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Discard Session
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          If recovery fails, you can always start a new session. Your session
          history will be preserved.
        </p>
      </div>
    </div>
  );
};
