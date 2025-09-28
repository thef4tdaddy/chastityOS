import { useState, useRef } from 'react';

/**
 * Custom hook for managing chastity session state
 */
export const useSessionState = () => {
    // Core session state
    const [cageOnTime, setCageOnTime] = useState(null);
    const [isCageOn, setIsCageOn] = useState(false);
    const [timeInChastity, setTimeInChastity] = useState(0);
    const [timeCageOff, setTimeCageOff] = useState(0);
    const [chastityHistory, setChastityHistory] = useState([]);
    const [totalChastityTime, setTotalChastityTime] = useState(0);
    const [totalTimeCageOff, setTotalTimeCageOff] = useState(0);
    const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0);
    const [hasSessionEverBeenActive, setHasSessionEverBeenActive] = useState(false);
    
    // Modal states
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonForRemoval, setReasonForRemoval] = useState('');
    const [tempEndTime, setTempEndTime] = useState(null);
    const [tempStartTime, setTempStartTime] = useState(null);
    const [confirmReset, setConfirmReset] = useState(false);
    
    // Pause-related state
    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
    const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
    const [reasonForPauseInput, setReasonForPauseInput] = useState('');
    const [currentSessionPauseEvents, setCurrentSessionPauseEvents] = useState([]);
    const [livePauseDuration, setLivePauseDuration] = useState(0);
    const [lastPauseEndTime, setLastPauseEndTime] = useState(null);
    const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');
    
    // Session editing
    const [editSessionDateInput, setEditSessionDateInput] = useState('');
    const [editSessionTimeInput, setEditSessionTimeInput] = useState('');
    const [editSessionMessage, setEditSessionMessage] = useState('');
    
    // Keyholder duration
    const [requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds] = useState(0);
    
    // Restore functionality
    const [showRestoreSessionPrompt, setShowRestoreSessionPrompt] = useState(false);
    const [loadedSessionData, setLoadedSessionData] = useState(null);
    const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
    const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);
    const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');
    
    // Timer refs
    const timerInChastityRef = useRef(null);
    const timerCageOffRef = useRef(null);
    const pauseDisplayTimerRef = useRef(null);
    const resetTimeoutRef = useRef(null);

    return {
        // Core session state
        cageOnTime, setCageOnTime,
        isCageOn, setIsCageOn,
        timeInChastity, setTimeInChastity,
        timeCageOff, setTimeCageOff,
        chastityHistory, setChastityHistory,
        totalChastityTime, setTotalChastityTime,
        totalTimeCageOff, setTotalTimeCageOff,
        overallTotalPauseTime, setOverallTotalPauseTime,
        hasSessionEverBeenActive, setHasSessionEverBeenActive,
        
        // Modal states
        showReasonModal, setShowReasonModal,
        reasonForRemoval, setReasonForRemoval,
        tempEndTime, setTempEndTime,
        tempStartTime, setTempStartTime,
        confirmReset, setConfirmReset,
        
        // Pause-related state
        isPaused, setIsPaused,
        pauseStartTime, setPauseStartTime,
        accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession,
        showPauseReasonModal, setShowPauseReasonModal,
        reasonForPauseInput, setReasonForPauseInput,
        currentSessionPauseEvents, setCurrentSessionPauseEvents,
        livePauseDuration, setLivePauseDuration,
        lastPauseEndTime, setLastPauseEndTime,
        pauseCooldownMessage, setPauseCooldownMessage,
        
        // Session editing
        editSessionDateInput, setEditSessionDateInput,
        editSessionTimeInput, setEditSessionTimeInput,
        editSessionMessage, setEditSessionMessage,
        
        // Keyholder duration
        requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds,
        
        // Restore functionality
        showRestoreSessionPrompt, setShowRestoreSessionPrompt,
        loadedSessionData, setLoadedSessionData,
        restoreUserIdInput, setRestoreUserIdInput,
        showRestoreFromIdPrompt, setShowRestoreFromIdPrompt,
        restoreFromIdMessage, setRestoreFromIdMessage,
        
        // Timer refs
        timerInChastityRef,
        timerCageOffRef,
        pauseDisplayTimerRef,
        resetTimeoutRef
    };
};