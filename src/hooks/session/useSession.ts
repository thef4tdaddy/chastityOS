import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSessionProps {
  isCageOn: boolean;
  isPaused: boolean;
  cageOnTime: Date | null;
  hasSessionEverBeenActive: boolean;
  setTimeInChastity: (time: number) => void;
  setTimeCageOff: (updater: (prev: number) => number) => void;
}

export const useSession = ({
  isCageOn,
  isPaused,
  cageOnTime,
  hasSessionEverBeenActive,
  setTimeInChastity,
  setTimeCageOff
}: UseSessionProps) => {
  const timerInChastityRef = useRef<NodeJS.Timeout | null>(null);
  const timerCageOffRef = useRef<NodeJS.Timeout | null>(null);

  // Session timers effect
  useEffect(() => {
    // Clear existing timers
    if (timerInChastityRef.current) clearInterval(timerInChastityRef.current);
    if (timerCageOffRef.current) clearInterval(timerCageOffRef.current);

    if (isCageOn && !isPaused && cageOnTime) {
      // Timer for time in chastity
      timerInChastityRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - cageOnTime.getTime()) / 1000);
        setTimeInChastity(elapsed);
      }, 1000);
    } else if (!isCageOn && hasSessionEverBeenActive) {
      // Timer for time cage off
      timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
    }

    return () => {
      if (timerInChastityRef.current) clearInterval(timerInChastityRef.current);
      if (timerCageOffRef.current) clearInterval(timerCageOffRef.current);
    };
  }, [isCageOn, isPaused, cageOnTime, hasSessionEverBeenActive, setTimeInChastity, setTimeCageOff]);

  return {
    // Session timers are handled internally
  };
};