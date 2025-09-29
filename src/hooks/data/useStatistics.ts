import { useState, useEffect, useMemo } from 'react';

interface ChastityHistoryEntry {
  id: string;
  duration: number;
  totalPauseDurationSeconds: number;
}

interface UseStatisticsProps {
  chastityHistory: ChastityHistoryEntry[];
  timeInChastity: number;
  accumulatedPauseTimeThisSession: number;
}

export const useStatistics = ({ 
  chastityHistory, 
  timeInChastity, 
  accumulatedPauseTimeThisSession 
}: UseStatisticsProps) => {
  const [totalChastityTime, setTotalChastityTime] = useState(0);
  const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0);

  // Calculate statistics from history
  useEffect(() => {
    let totalEffective = 0;
    let totalPaused = 0;
    chastityHistory.forEach(period => {
      totalEffective += (period.duration || 0) - (period.totalPauseDurationSeconds || 0);
      totalPaused += period.totalPauseDurationSeconds || 0;
    });
    setTotalChastityTime(totalEffective);
    setOverallTotalPauseTime(totalPaused);
  }, [chastityHistory]);

  // Current effective time for goals (memoized for performance)
  const effectiveTimeInChastityForGoal = useMemo(() => 
    Math.max(0, timeInChastity - accumulatedPauseTimeThisSession), 
    [timeInChastity, accumulatedPauseTimeThisSession]
  );

  // Main display time (memoized for performance)
  const mainChastityDisplayTime = useMemo(() => 
    Math.max(0, timeInChastity - accumulatedPauseTimeThisSession), 
    [timeInChastity, accumulatedPauseTimeThisSession]
  );

  return {
    totalChastityTime,
    overallTotalPauseTime,
    effectiveTimeInChastityForGoal,
    mainChastityDisplayTime
  };
};