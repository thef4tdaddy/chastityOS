import { useState } from 'react';

export function useSessionState() {
    // --- Core Session State ---
    const [cageOnTime, setCageOnTime] = useState(null);
    const [isCageOn, setIsCageOn] = useState(false);
    const [timeInChastity, setTimeInChastity] = useState(0);
    const [timeCageOff, setTimeCageOff] = useState(0);
    const [chastityHistory, setChastityHistory] = useState([]);
    const [totalChastityTime, setTotalChastityTime] = useState(0);
    const [totalTimeCageOff, setTotalTimeCageOff] = useState(0);
    const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0);
    const [hasSessionEverBeenActive, setHasSessionEverBeenActive] = useState(false);

    // --- Keyholder Duration State ---
    const [requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds] = useState(0);

    return {
        cageOnTime, setCageOnTime,
        isCageOn, setIsCageOn,
        timeInChastity, setTimeInChastity,
        timeCageOff, setTimeCageOff,
        chastityHistory, setChastityHistory,
        totalChastityTime, setTotalChastityTime,
        totalTimeCageOff, setTotalTimeCageOff,
        overallTotalPauseTime, setOverallTotalPauseTime,
        hasSessionEverBeenActive, setHasSessionEverBeenActive,
        requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds
    };
}