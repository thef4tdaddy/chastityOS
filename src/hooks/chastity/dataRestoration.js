import { useCallback } from 'react';

export function useDataRestoration({
    setChastityHistory, setTotalTimeCageOff, setLastPauseEndTime, setIsCageOn,
    setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime,
    setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents,
    setHasSessionEverBeenActive, setRequiredKeyholderDurationSeconds,
    setShowRestoreSessionPrompt, setLoadedSessionData
}) {
    const applyRestoredData = useCallback((data) => {
        if (!data || typeof data !== 'object') {
            console.warn("⚠️ Skipping applyRestoredData: invalid or empty data", data);
            return;
        }
        const loadedHist = (data.chastityHistory || []).map(item => ({
            ...item,
            startTime: item.startTime?.toDate ? item.startTime.toDate() : null,
            endTime: item.endTime?.toDate ? item.endTime.toDate() : null,
            totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0,
            pauseEvents: (item.pauseEvents || []).map(p => ({
                ...p,
                startTime: p.startTime?.toDate ? p.startTime.toDate() : null,
                endTime: p.endTime?.toDate ? p.endTime.toDate() : null
            }))
        }));
        setChastityHistory(loadedHist);
        setTotalTimeCageOff(data.totalTimeCageOff || 0);
        const lPauseEndTime = data.lastPauseEndTime?.toDate ? data.lastPauseEndTime.toDate() : null;
        setLastPauseEndTime(lPauseEndTime && !isNaN(lPauseEndTime.getTime()) ? lPauseEndTime : null);
        const loadedCageOn = data.isCageOn || false;
        const loadedCageOnTime = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null;
        const loadedPauseStart = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;
        setIsCageOn(loadedCageOn);
        setCageOnTime(loadedCageOn && loadedCageOnTime && !isNaN(loadedCageOnTime.getTime()) ? loadedCageOnTime : null);
        if (loadedCageOn && loadedCageOnTime) {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - loadedCageOnTime.getTime()) / 1000);
            setTimeInChastity(elapsed);
        } else {
            setTimeInChastity(0);
        }
        setIsPaused(loadedCageOn ? (data.isPaused || false) : false);
        setPauseStartTime(loadedCageOn && data.isPaused && loadedPauseStart && !isNaN(loadedPauseStart.getTime()) ? loadedPauseStart : null);
        setAccumulatedPauseTimeThisSession(loadedCageOn ? (data.accumulatedPauseTimeThisSession || 0) : 0);
        setCurrentSessionPauseEvents(
            loadedCageOn
                ? (data.currentSessionPauseEvents || []).map(p => ({
                    ...p,
                    startTime: p.startTime?.toDate(),
                    endTime: p.endTime?.toDate()
                }))
                : []
        );
        setHasSessionEverBeenActive(data.hasSessionEverBeenActive !== undefined ? data.hasSessionEverBeenActive : true);
        
        // --- Load the Keyholder Duration ---
        setRequiredKeyholderDurationSeconds(data.requiredKeyholderDurationSeconds || 0);
        
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [setChastityHistory, setTotalTimeCageOff, setLastPauseEndTime, setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setHasSessionEverBeenActive, setRequiredKeyholderDurationSeconds, setShowRestoreSessionPrompt, setLoadedSessionData]);

    return { applyRestoredData };
}