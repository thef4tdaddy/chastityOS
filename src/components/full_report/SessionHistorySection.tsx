import React, { useState, useMemo } from "react";
import type { DBSession } from "@/types/database";
import { FaHistory, FaCalendar } from "@/utils/iconImport";
import { Card, Button } from "@/components/ui";
import { useStaggerAnimation } from "@/hooks/useStaggerAnimation";
import { logger } from "@/utils/logging";

// Helper function to format duration (shared with StatisticsSection)
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

// Helper function to format time display
const formatTimeDisplay = (date: Date, isMobile: boolean = false) => {
  if (isMobile) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleTimeString();
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
const SessionItem: React.FC<{
  session: DBSession;
  isVisible: boolean | undefined;
  index: number;
}> = ({ session, isVisible, index }) => (
  <div
    className={`bg-white/5 rounded-lg p-3 sm:p-4 stat-card-hover ${
      isVisible
        ? `animate-fade-in-up stagger-${Math.min(index + 1, 8)}`
        : "opacity-0"
    }`}
    role="article"
    aria-label={`Session from ${session.startTime.toLocaleDateString()}`}
  >
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-nightly-honeydew text-sm sm:text-base break-words">
          {session.startTime.toLocaleDateString()}{" "}
          <span className="hidden sm:inline">
            {formatTimeDisplay(session.startTime)}
          </span>
          <span className="sm:hidden">
            {formatTimeDisplay(session.startTime, true)}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-nightly-celadon break-words">
          {session.endTime ? (
            <>
              Ended: {session.endTime.toLocaleDateString()}{" "}
              <span className="hidden sm:inline">
                {formatTimeDisplay(session.endTime)}
              </span>
              <span className="sm:hidden">
                {formatTimeDisplay(session.endTime, true)}
              </span>
              {session.endReason && ` (${session.endReason})`}
            </>
          ) : (
            "Active Session"
          )}
        </div>
      </div>

      <div className="text-left sm:text-right flex-shrink-0">
        <div className="font-mono text-nightly-honeydew text-sm sm:text-base">
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
      <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
        <span className="inline-block bg-red-500/20 text-red-400 px-2 py-1 text-xs rounded whitespace-nowrap">
          🔒 Hardcore Mode
        </span>
        {session.hasLockCombination && (
          <span className="inline-block bg-purple-500/20 text-purple-400 px-2 py-1 text-xs rounded whitespace-nowrap">
            🔐 Lock Combo Saved
          </span>
        )}
        {session.emergencyPinUsed && (
          <span className="inline-block bg-yellow-500/20 text-yellow-400 px-2 py-1 text-xs rounded whitespace-nowrap">
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
          <div className="text-xs text-yellow-300 mt-1 break-words">
            Reason: {session.emergencyReason}
          </div>
        )}
        {session.emergencyNotes && (
          <div className="text-xs text-yellow-300 mt-1 break-words">
            {session.emergencyNotes}
          </div>
        )}
      </div>
    )}

    {session.notes && (
      <div className="mt-2 text-xs sm:text-sm text-nightly-celadon break-words">
        Notes: {session.notes}
      </div>
    )}
  </div>
);

// Empty Sessions Display Component
const EmptySessionsDisplay: React.FC = () => (
  <div className="text-center py-8" role="status" aria-live="polite">
    <FaCalendar
      className="text-4xl text-nightly-celadon/50 mb-4 mx-auto"
      aria-hidden="true"
    />
    <div className="text-nightly-celadon">No sessions found</div>
  </div>
);

// Main Session History Section Component
const SessionHistorySectionComponent: React.FC<{ sessions: DBSession[] }> = ({
  sessions,
}) => {
  const [showAll, setShowAll] = useState(false);

  const sortedSessions = useMemo(() => {
    try {
      // Validate sessions is an array
      if (!Array.isArray(sessions)) {
        logger.error("Sessions is not an array", { sessions });
        return [];
      }

      // Filter out invalid sessions and sort
      return [...sessions]
        .filter((session) => session && session.startTime)
        .sort((a, b) => {
          try {
            return b.startTime.getTime() - a.startTime.getTime();
          } catch {
            return 0;
          }
        });
    } catch (error) {
      logger.error("Error sorting sessions", { error });
      return [];
    }
  }, [sessions]);

  // Optimize large datasets with pagination instead of showing all at once
  const INITIAL_DISPLAY_COUNT = 10;
  const LOAD_MORE_COUNT = 20;

  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  const displaySessions = useMemo(() => {
    if (showAll) {
      return sortedSessions.slice(0, displayCount);
    }
    return sortedSessions.slice(0, INITIAL_DISPLAY_COUNT);
  }, [showAll, sortedSessions, displayCount]);

  const hasMore = displaySessions.length < sortedSessions.length;

  const loadMore = () => {
    setDisplayCount((prev) =>
      Math.min(prev + LOAD_MORE_COUNT, sortedSessions.length),
    );
  };

  // Stagger animation for session items
  const visibleItems = useStaggerAnimation(displaySessions.length, 60);

  return (
    <Card variant="glass" className="mb-4 sm:mb-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <FaHistory
            className="text-nightly-spring-green text-lg sm:text-xl"
            aria-hidden="true"
          />
          <h2
            id="session-history-heading"
            className="text-lg sm:text-xl font-semibold text-nightly-honeydew"
          >
            Session History
          </h2>
        </div>
        {sessions.length > 10 && (
          <Button
            onClick={() => setShowAll(!showAll)}
            className="text-sm sm:text-base text-nightly-aquamarine hover:text-nightly-spring-green transition-colors whitespace-nowrap"
            aria-expanded={showAll}
            aria-controls="session-history-list"
            aria-label={
              showAll
                ? `Collapse session history`
                : `Expand to show all ${sessions.length} sessions`
            }
          >
            {showAll ? "Show Less" : `Show All (${sessions.length})`}
          </Button>
        )}
      </div>

      {displaySessions.length === 0 ? (
        <EmptySessionsDisplay />
      ) : (
        <>
          <div
            id="session-history-list"
            className="space-y-2 sm:space-y-3"
            role="list"
            aria-label="Past chastity sessions"
          >
            {displaySessions.map((session, index) => (
              <SessionItem
                key={session.id}
                session={session}
                isVisible={visibleItems[index]}
                index={index}
              />
            ))}
          </div>
          {showAll && hasMore && (
            <div className="mt-4 text-center">
              <Button
                onClick={loadMore}
                className="text-sm sm:text-base text-nightly-aquamarine hover:text-nightly-spring-green transition-colors"
                aria-label={`Load ${Math.min(LOAD_MORE_COUNT, sortedSessions.length - displaySessions.length)} more sessions`}
              >
                Load More ({sortedSessions.length - displaySessions.length}{" "}
                remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const SessionHistorySection = React.memo(
  SessionHistorySectionComponent,
) as React.FC<{ sessions: DBSession[] }>;
