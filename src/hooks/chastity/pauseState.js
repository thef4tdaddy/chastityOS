import { useState } from 'react';

export function usePauseState() {
    // --- Pause Management State ---
    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
    const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
    const [reasonForPauseInput, setReasonForPauseInput] = useState('');
    const [currentSessionPauseEvents, setCurrentSessionPauseEvents] = useState([]);
    const [livePauseDuration, setLivePauseDuration] = useState(0);
    const [lastPauseEndTime, setLastPauseEndTime] = useState(null);
    const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');

    return {
        isPaused, setIsPaused,
        pauseStartTime, setPauseStartTime,
        accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession,
        showPauseReasonModal, setShowPauseReasonModal,
        reasonForPauseInput, setReasonForPauseInput,
        currentSessionPauseEvents, setCurrentSessionPauseEvents,
        livePauseDuration, setLivePauseDuration,
        lastPauseEndTime, setLastPauseEndTime,
        pauseCooldownMessage, setPauseCooldownMessage
    };
}