import { useState, useCallback, useEffect } from 'react';

interface Statistics {
  totalSessions: number;
  averageSessionDuration: number;
  longestSession: number;
  shortestSession: number;
  totalTimeInChastity: number;
  streakDays: number;
}

interface UseStatisticsProps {
  userId: string | null;
  chastityHistory: Array<{
    duration: number;
    startTime: Date;
    endTime: Date;
  }>;
}

export const useStatistics = ({ userId, chastityHistory }: UseStatisticsProps) => {
  const [statistics, setStatistics] = useState<Statistics>({
    totalSessions: 0,
    averageSessionDuration: 0,
    longestSession: 0,
    shortestSession: 0,
    totalTimeInChastity: 0,
    streakDays: 0
  });

  const [isCalculating, setIsCalculating] = useState(false);

  const calculateStatistics = useCallback(() => {
    if (!userId || chastityHistory.length === 0) {
      setStatistics({
        totalSessions: 0,
        averageSessionDuration: 0,
        longestSession: 0,
        shortestSession: 0,
        totalTimeInChastity: 0,
        streakDays: 0
      });
      return;
    }

    setIsCalculating(true);

    const durations = chastityHistory.map(session => session.duration);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = totalDuration / durations.length;
    const longestDuration = Math.max(...durations);
    const shortestDuration = Math.min(...durations);

    // Calculate streak days based on session frequency
    const now = new Date();
    const sortedSessions = [...chastityHistory]
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
    
    let streakDays = 0;
    if (sortedSessions.length > 0) {
      const lastSession = sortedSessions[0];
      const daysSinceLastSession = Math.floor(
        (now.getTime() - new Date(lastSession.endTime).getTime()) / (24 * 60 * 60 * 1000)
      );
      
      if (daysSinceLastSession <= 7) {
        streakDays = sortedSessions.length;
      }
    }

    setStatistics({
      totalSessions: chastityHistory.length,
      averageSessionDuration: Math.round(averageDuration),
      longestSession: longestDuration,
      shortestSession: shortestDuration,
      totalTimeInChastity: totalDuration,
      streakDays
    });

    setIsCalculating(false);
  }, [userId, chastityHistory]);

  const getSessionTrends = useCallback(() => {
    if (chastityHistory.length < 2) return [];

    return chastityHistory
      .slice(-10) // Last 10 sessions
      .map((session, index) => ({
        sessionNumber: chastityHistory.length - 10 + index + 1,
        duration: session.duration,
        date: session.startTime
      }));
  }, [chastityHistory]);

  useEffect(() => {
    calculateStatistics();
  }, [calculateStatistics]);

  return {
    statistics,
    isCalculating,
    calculateStatistics,
    getSessionTrends
  };
};