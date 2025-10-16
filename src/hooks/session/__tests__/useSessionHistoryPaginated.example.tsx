/**
 * Example Usage: useSessionHistoryPaginated Hook
 *
 * This file demonstrates how to use the paginated session history hooks
 * for optimal performance with large datasets.
 */

import React from "react";
import {
  useSessionHistoryPaginated,
  useSessionHistoryCursor,
} from "@/hooks/session/useSessionHistoryPaginated";
import type { DBSession } from "@/types/database";

/**
 * Example 1: Infinite Scroll Session History
 * Best for mobile and scrollable lists
 */
export const InfiniteScrollExample: React.FC<{ userId: string }> = ({
  userId,
}) => {
  const {
    sessions,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSessionHistoryPaginated(userId, {
    pageSize: 20, // Load 20 sessions per page
    enabled: true,
  });

  const allSessions = React.useMemo(
    () => (sessions as any)?.pages?.flatMap((page: DBSession[]) => page) ?? [],
    [sessions],
  );

  // Handle scroll to bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return <div>Loading initial sessions...</div>;
  }

  return (
    <div onScroll={handleScroll} style={{ height: "500px", overflow: "auto" }}>
      <h2>Session History ({allSessions.length} loaded)</h2>

      {allSessions.map((session: DBSession) => (
        <SessionCard key={session.id} session={session} />
      ))}

      {isFetchingNextPage && (
        <div className="text-center py-4">Loading more sessions...</div>
      )}

      {!hasNextPage && allSessions.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No more sessions to load
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Load More Button
 * Simple pagination with manual trigger
 */
export const LoadMoreExample: React.FC<{ userId: string }> = ({ userId }) => {
  const {
    sessions,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    totalCount,
  } = useSessionHistoryPaginated(userId, {
    pageSize: 10,
  });

  const allSessions = React.useMemo(
    () => (sessions as any)?.pages?.flatMap((page: DBSession[]) => page) ?? [],
    [sessions],
  );

  if (isLoading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2>Session History</h2>
        <span className="text-sm text-gray-500">
          Showing {allSessions.length} of {totalCount} sessions
        </span>
      </div>

      <div className="space-y-4">
        {allSessions.map((session: DBSession) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 w-full py-2 bg-purple-600 text-white rounded"
        >
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

/**
 * Example 3: Traditional Pagination with Page Numbers
 * Best for desktop interfaces
 */
export const PaginatedExample: React.FC<{ userId: string }> = ({ userId }) => {
  const {
    sessions,
    isLoading,
    nextPage,
    prevPage,
    currentPage,
    hasNextPage,
    hasPrevPage,
  } = useSessionHistoryCursor(userId, {
    pageSize: 20,
  });

  const currentSessions = React.useMemo(
    () => (sessions as any)?.pages?.flatMap((page: DBSession[]) => page) ?? [],
    [sessions],
  );

  if (isLoading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div>
      <h2>Session History - Page {currentPage + 1}</h2>

      <div className="space-y-4 my-4">
        {currentSessions.map((session: DBSession) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={prevPage}
          disabled={!hasPrevPage}
          className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-gray-500">Page {currentPage + 1}</span>

        <button
          onClick={nextPage}
          disabled={!hasNextPage}
          className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

/**
 * Example 4: Combined with Filtering
 * Show how to combine pagination with filters
 */
export const FilteredPaginationExample: React.FC<{ userId: string }> = ({
  userId,
}) => {
  const [filter, setFilter] = React.useState<"all" | "completed" | "active">(
    "all",
  );

  const { sessions, isLoading, hasNextPage, fetchNextPage, refetch } =
    useSessionHistoryPaginated(userId, {
      pageSize: 20,
    });

  const allSessions = React.useMemo(
    () => (sessions as any)?.pages?.flatMap((page: DBSession[]) => page) ?? [],
    [sessions],
  );

  // Filter sessions locally (or implement server-side filtering)
  const filteredSessions = React.useMemo(() => {
    if (filter === "all") return allSessions;
    if (filter === "completed")
      return allSessions.filter((s: DBSession) => s.endTime);
    if (filter === "active")
      return allSessions.filter((s: DBSession) => !s.endTime);
    return allSessions;
  }, [allSessions, filter]);

  // Refetch when filter changes
  React.useEffect(() => {
    refetch();
  }, [filter, refetch]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={
            filter === "all"
              ? "bg-purple-600 text-white px-4 py-2 rounded"
              : "bg-gray-600 text-white px-4 py-2 rounded"
          }
        >
          All
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={
            filter === "completed"
              ? "bg-purple-600 text-white px-4 py-2 rounded"
              : "bg-gray-600 text-white px-4 py-2 rounded"
          }
        >
          Completed
        </button>
        <button
          onClick={() => setFilter("active")}
          className={
            filter === "active"
              ? "bg-purple-600 text-white px-4 py-2 rounded"
              : "bg-gray-600 text-white px-4 py-2 rounded"
          }
        >
          Active
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session: DBSession) => (
            <SessionCard key={session.id} session={session} />
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="w-full py-2 bg-purple-600 text-white rounded"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Example Session Card Component
 * Reusable component to display session information
 */
const SessionCard: React.FC<{ session: DBSession }> = ({ session }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const duration = session.endTime
    ? Math.floor(
        (session.endTime.getTime() - session.startTime.getTime()) / 1000,
      )
    : 0;

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm text-gray-400">Started</div>
          <div className="text-white">{formatDate(session.startTime)}</div>
        </div>
        {session.endTime && (
          <div className="text-right">
            <div className="text-sm text-gray-400">Ended</div>
            <div className="text-white">{formatDate(session.endTime)}</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-2">
        <div>
          <span className="text-sm text-gray-400">Duration: </span>
          <span className="text-white font-semibold">
            {formatDuration(duration)}
          </span>
        </div>

        {session.isPaused && (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
            Paused
          </span>
        )}

        {session.isHardcoreMode && (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
            Hardcore
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Example 5: Performance Monitoring
 * Track render performance with pagination
 */
export const PerformanceMonitoringExample: React.FC<{ userId: string }> = ({
  userId,
}) => {
  const [renderCount, setRenderCount] = React.useState(0);
  const renderTimeRef = React.useRef(Date.now());

  const { sessions, isLoading, hasNextPage, fetchNextPage } =
    useSessionHistoryPaginated(userId, {
      pageSize: 20,
    });

  const allSessions = React.useMemo(
    () => (sessions as any)?.pages?.flatMap((page: DBSession[]) => page) ?? [],
    [sessions],
  );

  // Track renders
  React.useEffect(() => {
    setRenderCount((c) => c + 1);
    const renderTime = Date.now() - renderTimeRef.current;
    console.log(`Render ${renderCount}: ${renderTime}ms`);
    renderTimeRef.current = Date.now();
  });

  return (
    <div>
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h3 className="text-sm font-semibold mb-2">Performance Metrics</h3>
        <div className="text-xs space-y-1">
          <div>Renders: {renderCount}</div>
          <div>Sessions Loaded: {allSessions.length}</div>
          <div>Loading: {isLoading ? "Yes" : "No"}</div>
          <div>Has More: {hasNextPage ? "Yes" : "No"}</div>
        </div>
      </div>

      <div className="space-y-4">
        {allSessions.map((session: DBSession) => (
          <SessionCard key={session.id} session={session} />
        ))}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="w-full py-2 bg-purple-600 text-white rounded"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
};
