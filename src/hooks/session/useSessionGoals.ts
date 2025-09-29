import { useState, useEffect, useRef, useMemo } from 'react';

interface UseSessionGoalsProps {
  isCageOn: boolean;
  isPaused: boolean;
  goalDurationSeconds: number | null;
  timeInChastity: number;
  accumulatedPauseTimeThisSession: number;
}

export const useSessionGoals = ({
  isCageOn,
  isPaused,
  goalDurationSeconds,
  timeInChastity,
  accumulatedPauseTimeThisSession
}: UseSessionGoalsProps) => {
  const [remainingGoalTime, setRemainingGoalTime] = useState<number | null>(null);
  const goalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized effective time for performance
  const safeTimeInChastity = useMemo(() => timeInChastity || 0, [timeInChastity]);
  const safeAccumulatedPauseTime = useMemo(() => accumulatedPauseTimeThisSession || 0, [accumulatedPauseTimeThisSession]);

  // Effect for the goal timer
  useEffect(() => {
    if (goalTimerRef.current) clearInterval(goalTimerRef.current);

    if (isCageOn && !isPaused && goalDurationSeconds && goalDurationSeconds > 0) {
      const calculateRemaining = () => {
        const currentEffectiveChastity = Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime);
        const remaining = goalDurationSeconds - currentEffectiveChastity;
        setRemainingGoalTime(remaining > 0 ? remaining : 0);
      };
      calculateRemaining();
      goalTimerRef.current = setInterval(calculateRemaining, 1000);
    } else {
      if (!isCageOn || !goalDurationSeconds || goalDurationSeconds <= 0) {
        setRemainingGoalTime(null);
      } else if (isPaused && goalDurationSeconds && goalDurationSeconds > 0) {
        const currentEffectiveChastity = Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime);
        const remaining = goalDurationSeconds - currentEffectiveChastity;
        setRemainingGoalTime(remaining > 0 ? remaining : 0);
      }
    }
    
    return () => { 
      if (goalTimerRef.current) clearInterval(goalTimerRef.current); 
    };
  }, [isCageOn, isPaused, safeTimeInChastity, safeAccumulatedPauseTime, goalDurationSeconds]);

  // Derived state calculations using useMemo for performance
  const effectiveTimeInChastityForGoal = useMemo(() => 
    Math.max(0, safeTimeInChastity - safeAccumulatedPauseTime), 
    [safeTimeInChastity, safeAccumulatedPauseTime]
  );

  return {
    remainingGoalTime,
    effectiveTimeInChastityForGoal
  };
};