import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

/**
 * @typedef {Object} HistorySession
 * @property {string} id
 * @property {Date} startTime
 * @property {Date} endTime
 * @property {number} duration
 * @property {string} [reason]
 * @property {Array} [pauseEvents]
 * @property {number} [totalPauseTime]
 * @property {number} [netDuration] - duration minus pause time
 */

/**
 * @typedef {Object} HistoryFilters
 * @property {Object} [dateRange]
 * @property {Date} dateRange.start
 * @property {Date} dateRange.end
 * @property {number} [minDuration]
 * @property {number} [maxDuration]
 */

/**
 * @typedef {Object} SessionHistoryOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {number} [pageSize=20]
 */

/**
 * Hook for managing session history
 * @param {SessionHistoryOptions} options
 * @returns {Object}
 */
export const useSessionHistory = ({ userId, isAuthReady, pageSize = 20 }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({});

  const fetchSessions = useCallback(
    async (append = false, lastDoc) => {
      if (!userId || !isAuthReady) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const historyCollection = collection(
          db,
          "users",
          userId,
          "sessionHistory",
        );
        let q = query(
          historyCollection,
          orderBy("startTime", "desc"),
          limit(pageSize),
        );

        if (lastDoc) {
          q = query(
            historyCollection,
            orderBy("startTime", "desc"),
            startAfter(lastDoc),
            limit(pageSize),
          );
        }

        const querySnapshot = await getDocs(q);
        const newSessions = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            pauseEvents:
              data.pauseEvents?.map((event) => ({
                ...event,
                startTime: event.startTime?.toDate(),
                endTime: event.endTime?.toDate(),
              })) || [],
          };
        });

        // Apply filters
        const filteredSessions = newSessions.filter((session) => {
          if (filters.dateRange) {
            const sessionDate = session.startTime;
            if (
              sessionDate < filters.dateRange.start ||
              sessionDate > filters.dateRange.end
            ) {
              return false;
            }
          }

          if (filters.minDuration && session.duration < filters.minDuration) {
            return false;
          }

          if (filters.maxDuration && session.duration > filters.maxDuration) {
            return false;
          }

          return true;
        });

        setSessions((prev) =>
          append ? [...prev, ...filteredSessions] : filteredSessions,
        );
        setHasMore(querySnapshot.docs.length === pageSize);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch session history",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId, isAuthReady, pageSize, filters],
  );

  const loadMore = useCallback(() => {
    if (sessions.length > 0 && hasMore && !isLoading) {
      const lastSession = sessions[sessions.length - 1];
      fetchSessions(true, lastSession);
    }
  }, [sessions, hasMore, isLoading, fetchSessions]);

  const deleteSession = useCallback(
    async (sessionId) => {
      if (!userId || !isAuthReady) {
        setError("User not authenticated");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const sessionDocRef = doc(
          db,
          "users",
          userId,
          "sessionHistory",
          sessionId,
        );
        await deleteDoc(sessionDocRef);

        setSessions((prev) =>
          prev.filter((session) => session.id !== sessionId),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete session",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId, isAuthReady],
  );

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setSessions([]);
    setHasMore(true);
  }, []);

  const getStatistics = useCallback(() => {
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce(
      (acc, session) => acc + session.duration,
      0,
    );
    const averageDuration =
      totalSessions > 0 ? totalDuration / totalSessions : 0;
    const longestSession = sessions.reduce(
      (max, session) => Math.max(max, session.duration),
      0,
    );
    const shortestSession = sessions.reduce(
      (min, session) => Math.min(min, session.duration),
      Infinity,
    );

    // Calculate net duration (excluding pause time)
    const totalNetDuration = sessions.reduce((acc, session) => {
      const pauseTime = session.totalPauseTime || 0;
      return acc + (session.duration - pauseTime);
    }, 0);
    const averageNetDuration =
      totalSessions > 0 ? totalNetDuration / totalSessions : 0;

    return {
      totalSessions,
      totalDuration,
      averageDuration,
      longestSession: longestSession === 0 ? 0 : longestSession,
      shortestSession: shortestSession === Infinity ? 0 : shortestSession,
      totalNetDuration,
      averageNetDuration,
    };
  }, [sessions]);

  const exportHistory = useCallback(() => {
    if (sessions.length === 0) {
      setError("No sessions to export");
      return;
    }

    try {
      const dataToExport = {
        exportedAt: new Date().toISOString(),
        userId,
        sessions: sessions.map((session) => ({
          ...session,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime.toISOString(),
          pauseEvents: session.pauseEvents?.map((event) => ({
            ...event,
            startTime: event.startTime?.toISOString(),
            endTime: event.endTime?.toISOString(),
          })),
        })),
        statistics: getStatistics(),
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `session-history-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export history");
    }
  }, [sessions, userId, getStatistics]);

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    hasMore,
    filters,
    loadMore,
    deleteSession,
    updateFilters,
    getStatistics,
    exportHistory,
    refresh: useCallback(() => {
      setSessions([]);
      setHasMore(true);
      fetchSessions();
    }, [fetchSessions]),
  };
};
