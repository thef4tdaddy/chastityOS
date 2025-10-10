import React, { useState, useMemo } from "react";
import type { DBSession } from "../../types/database";
import { FaHistory, FaCalendar } from "../../utils/iconImport";
import { Card } from "@/components/ui";

// Helper function to format duration
const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Helper function to calculate session duration
const getSessionDuration = (session: DBSession) => {
  if (!session.endTime) return 0;
  const totalDuration = Math.floor(
    (session.endTime.getTime() - session.startTime.getTime()) / 1000,
  );
  return Math.max(0, totalDuration - session.accumulatedPauseTime);
};

// Session Item Component
const SessionItem: React.FC<{ session: DBSession }> = ({ session }) => (
  <div className="bg-white/5 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-nightly-honeydew">
          {session.startTime.toLocaleDateString()}{" "}
          {session.startTime.toLocaleTimeString()}
        </div>
        <div className="text-sm text-nightly-celadon">
          {session.endTime ? (
            <>
              Ended: {session.endTime.toLocaleDateString()}{" "}
              {session.endTime.toLocaleTimeString()}
              {session.endReason && ` (${session.endReason})`}
            </>
          ) : (
            "Active Session"
          )}
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono text-nightly-honeydew">
          {session.endTime
            ? formatDuration(getSessionDuration(session))
            : "Ongoing"}
        </div>
        {session.accumulatedPauseTime > 0 && (
          <div className="text-xs text-yellow-400">
            Pause: {formatDuration(session.accumulatedPauseTime)}
          </div>
        )}
      </div>
    </div>

    {/* Hardcore Mode Indicators */}
    {session.isHardcoreMode && (
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="inline-block bg-red-500/20 text-red-400 px-2 py-1 text-xs rounded">
          🔒 Hardcore Mode
        </span>
        {session.hasLockCombination && (
          <span className="inline-block bg-purple-500/20 text-purple-400 px-2 py-1 text-xs rounded">
            🔐 Lock Combo Saved
          </span>
        )}
        {session.emergencyPinUsed && (
          <span className="inline-block bg-yellow-500/20 text-yellow-400 px-2 py-1 text-xs rounded">
            ⚠️ Emergency PIN Used
          </span>
        )}
      </div>
    )}

    {/* Emergency Unlock Info */}
    {session.isEmergencyUnlock && (
      <div className="mt-2 bg-yellow-900/20 border border-yellow-600/30 rounded p-2">
        <div className="text-xs text-yellow-400 font-semibold">
          🚨 Emergency Unlock
        </div>
        {session.emergencyReason && (
          <div className="text-xs text-yellow-300 mt-1">
            Reason: {session.emergencyReason}
          </div>
        )}
        {session.emergencyNotes && (
          <div className="text-xs text-yellow-300 mt-1">
            {session.emergencyNotes}
          </div>
        )}
      </div>
    )}

    {session.notes && (
      <div className="mt-2 text-sm text-nightly-celadon">
        Notes: {session.notes}
      </div>
    )}
  </div>
);

// Empty Sessions Display Component
const EmptySessionsDisplay: React.FC = () => (
  <div className="text-center py-8">
    <FaCalendar className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
    <div className="text-nightly-celadon">No sessions found</div>
  </div>
);

// Main Session History Section Component
export const SessionHistorySection: React.FC<{ sessions: DBSession[] }> = ({
  sessions,
}) => {
  const [showAll, setShowAll] = useState(false);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );
  }, [sessions]);

  const displaySessions = showAll
    ? sortedSessions
    : sortedSessions.slice(0, 10);

  return (
    <Card variant="glass" className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaHistory className="text-nightly-spring-green" />
          <h2 className="text-xl font-semibold text-nightly-honeydew">
            Session History
          </h2>
        </div>
        {sessions.length > 10 && (
          <Button
            onClick={() => setShowAll(!showAll)}
            className="text-nightly-aquamarine hover:text-nightly-spring-green transition-colors"
          >
            {showAll ? "Show Less" : `Show All (${sessions.length})`}
          </Button>
        )}
      </div>

      {displaySessions.length === 0 ? (
        <EmptySessionsDisplay />
      ) : (
        <div className="space-y-3">
          {displaySessions.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default SessionHistorySection;
