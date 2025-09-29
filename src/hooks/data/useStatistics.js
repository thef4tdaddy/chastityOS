import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * @typedef {Object} SessionStats
 * @property {number} totalSessions
 * @property {number} averageDuration
 * @property {number} longestSession
 * @property {number} totalTimeInChastity
 */

/**
 * @typedef {Object} StatisticsOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {Object} [dateRange]
 * @property {Date} dateRange.start
 * @property {Date} dateRange.end
 */

/**
 * Hook for fetching and calculating session statistics
 * @param {StatisticsOptions} options
 * @returns {Object}
 */
export const useStatistics = ({ userId, isAuthReady, dateRange }) => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageDuration: 0,
    longestSession: 0,
    totalTimeInChastity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    if (!userId || !isAuthReady) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userDocRef = collection(db, 'users', userId, 'sessions');
      let q = query(userDocRef, orderBy('startTime', 'desc'));

      if (dateRange) {
        q = query(
          userDocRef, 
          where('startTime', '>=', dateRange.start),
          where('startTime', '<=', dateRange.end),
          orderBy('startTime', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate()
      }));

      const totalSessions = sessions.length;
      const durations = sessions
        .filter(session => session.startTime && session.endTime)
        .map(session => (session.endTime.getTime() - session.startTime.getTime()) / 1000);

      const totalTimeInChastity = durations.reduce((acc, duration) => acc + duration, 0);
      const averageDuration = totalSessions > 0 ? totalTimeInChastity / totalSessions : 0;
      const longestSession = durations.length > 0 ? Math.max(...durations) : 0;

      setStats({
        totalSessions,
        averageDuration,
        longestSession,
        totalTimeInChastity
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady, dateRange]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const formattedStats = useMemo(() => ({
    ...stats,
    averageDurationFormatted: formatDuration(stats.averageDuration),
    longestSessionFormatted: formatDuration(stats.longestSession),
    totalTimeFormatted: formatDuration(stats.totalTimeInChastity)
  }), [stats]);

  return {
    stats: formattedStats,
    isLoading,
    error,
    refetch: fetchStatistics
  };
};

/**
 * Format duration in seconds to human readable string
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}