import { useEffect, useRef } from 'react';

export const useChastityTimers = ({ 
    isCageOn, 
    isPaused, 
    cageOnTime, 
    hasSessionEverBeenActive, 
    pauseStartTime,
    setTimeInChastity,
    setTimeCageOff,
    setLivePauseDuration
}) => {
    const timerInChastityRef = useRef();
    const timerCageOffRef = useRef();
    const pauseDisplayTimerRef = useRef();

    useEffect(() => {
        clearInterval(timerInChastityRef.current);
        clearInterval(timerCageOffRef.current);
        clearInterval(pauseDisplayTimerRef.current);
        
        if (isCageOn && !isPaused && cageOnTime) {
            timerInChastityRef.current = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - cageOnTime.getTime()) / 1000);
                setTimeInChastity(elapsed);
            }, 1000);
        } else if (!isCageOn && hasSessionEverBeenActive) {
            timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
        }
        
        if (isPaused && pauseStartTime) {
            pauseDisplayTimerRef.current = setInterval(() => {
                setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000));
            }, 1000);
        } else {
            setLivePauseDuration(0);
        }
        
        return () => {
            clearInterval(timerInChastityRef.current);
            clearInterval(timerCageOffRef.current);
            clearInterval(pauseDisplayTimerRef.current);
        };
    }, [isCageOn, isPaused, cageOnTime, hasSessionEverBeenActive, pauseStartTime, setTimeInChastity, setTimeCageOff, setLivePauseDuration]);

    return { timerInChastityRef, timerCageOffRef, pauseDisplayTimerRef };
};