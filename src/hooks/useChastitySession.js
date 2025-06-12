// src/hooks/useChastitySession.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, Timestamp, addDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { formatTime } from '../utils';
import { db } from '../firebase';

export const useChastitySession = (
    userId,
    isAuthReady,
    googleEmail,
    getEventsCollectionRef,
    fetchEvents
) => {
    // --- Session State ---
    const [cageOnTime, setCageOnTime] = useState(null);
    const [isCageOn, setIsCageOn] = useState(false);
    const [timeInChastity, setTimeInChastity] = useState(0);
    const [timeCageOff, setTimeCageOff] = useState(0);
    const [chastityHistory, setChastityHistory] = useState([]);
    const [totalChastityTime, setTotalChastityTime] = useState(0);
    const [totalTimeCageOff, setTotalTimeCageOff] = useState(0);
    const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonForRemoval, setReasonForRemoval] = useState('');
    const [tempEndTime, setTempEndTime] = useState(null);
    const [tempStartTime, setTempStartTime] = useState(null);
    const [showRestoreSessionPrompt, setShowRestoreSessionPrompt] = useState(false);
    const [loadedSessionData, setLoadedSessionData] = useState(null);
    const [hasSessionEverBeenActive, setHasSessionEverBeenActive] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const resetTimeoutRef = useRef(null);

    // --- Restore From ID State ---
    const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
    const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);
    const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');

    // --- Pause State ---
    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
    const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
    const [reasonForPauseInput, setReasonForPauseInput] = useState('');
    const [currentSessionPauseEvents, setCurrentSessionPauseEvents] = useState([]);
    const [livePauseDuration, setLivePauseDuration] = useState(0);
    const [lastPauseEndTime, setLastPauseEndTime] = useState(null);
    const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');

    // --- Session Edit State ---
    const [editSessionDateInput, setEditSessionDateInput] = useState('');
    const [editSessionTimeInput, setEditSessionTimeInput] = useState('');
    const [editSessionMessage, setEditSessionMessage] = useState('');

    // Refs for interval timers to manage their lifecycle
    const timerInChastityRef = useRef(null);
    const timerCageOffRef = useRef(null);
    const pauseDisplayTimerRef = useRef(null);

    /**
     * Returns the Firestore document reference for the current user's data.
     * @param {string} targetUserId - Optional, specify a user ID, defaults to current userId.
     * @returns {DocumentReference | null} The Firestore document reference or null if userId is not available.
     */
    const getDocRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return doc(db, "users", targetUserId);
    }, [userId]);

    /**
     * Saves specified data to the current user's Firestore document.
     * @param {object} dataToSave - An object containing key-value pairs to save.
     */
    const saveDataToFirestore = useCallback(async (dataToSave) => {
        if (!isAuthReady || !userId) {
            console.warn("Attempted to save data before authentication was ready or user ID was available.");
            return;
        }
        const docRef = getDocRef();
        if (!docRef) {
            console.error("Firestore document reference is null, cannot save data.");
            return;
        }
        try {
            await setDoc(docRef, dataToSave, { merge: true });
        } catch (error) {
            console.error("Error saving session data to Firestore:", error);
        }
    }, [isAuthReady, userId, getDocRef]);

    /**
     * Applies restored session data to the component's state.
     * @param {object} data - The data object retrieved from Firestore.
     */
    const applyRestoredData = useCallback((data) => {
        if (!data || typeof data !== 'object') {
            console.warn("⚠️ Skipping applyRestoredData: invalid or empty data", data);
            return;
        }

        // Map Firestore Timestamps back to JavaScript Date objects for history
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

        // Convert pause end time from Firestore Timestamp to Date
        const lPauseEndTime = data.lastPauseEndTime?.toDate ? data.lastPauseEndTime.toDate() : null;
        setLastPauseEndTime(lPauseEndTime && !isNaN(lPauseEndTime.getTime()) ? lPauseEndTime : null);

        const loadedCageOn = data.isCageOn || false;
        const loadedCageOnTime = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null;
        const loadedPauseStart = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;

        setIsCageOn(loadedCageOn);
        setCageOnTime(loadedCageOn && loadedCageOnTime && !isNaN(loadedCageOnTime.getTime()) ? loadedCageOnTime : null);

        // Recalculate timeInChastity immediately based on loaded data
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

        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, []);

    // --- SESSION CONTROL HANDLERS ---

    /**
     * Toggles the chastity cage status (on/off).
     */
    const handleToggleCage = useCallback(() => {
        if (!isAuthReady || isPaused) {
            if (isPaused) {
                console.warn("Cannot toggle cage while session is paused.");
            }
            return;
        }
        const currentTime = new Date();

        // Clear any pending reset confirmation if a new action is taken
        if (confirmReset) {
            setConfirmReset(false);
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
        }

        if (!isCageOn) {
            // Turning cage ON
            const newTotalOffTime = totalTimeCageOff + timeCageOff;
            setCageOnTime(currentTime);
            setIsCageOn(true);
            setTimeInChastity(0); // Reset live timer
            setTimeCageOff(0);    // Reset cage off timer for current duration
            setAccumulatedPauseTimeThisSession(0);
            setCurrentSessionPauseEvents([]);
            setPauseStartTime(null);
            setIsPaused(false);
            setHasSessionEverBeenActive(true); // Mark that a session has at least started once

            // Save new state to Firestore
            saveDataToFirestore({
                isCageOn: true,
                cageOnTime: currentTime,
                totalTimeCageOff: newTotalOffTime,
                timeInChastity: 0,
                hasSessionEverBeenActive: true,
                isPaused: false, // Ensure this is explicitly set to false
                pauseStartTime: null, // Ensure this is explicitly set to null
                accumulatedPauseTimeThisSession: 0,
                currentSessionPauseEvents: []
            });
        } else {
            // Turning cage OFF - initiate modal for reason
            setTempEndTime(currentTime);
            setTempStartTime(cageOnTime);
            setShowReasonModal(true);
        }
    }, [isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, saveDataToFirestore]);

    /**
     * Confirms cage removal, logs the session, and resets current session state.
     */
    const handleConfirmRemoval = useCallback(async () => {
        if (!isAuthReady || !tempStartTime || !tempEndTime) {
            console.error("Missing data for confirming removal.");
            return;
        }

        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
        // If currently paused, add the live pause duration to accumulated before finalizing
        if (isPaused && pauseStartTime) {
            finalAccumulatedPauseTime += Math.max(0, Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000));
        }

        const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));

        // Create new history entry
        const newHistoryEntry = {
            id: crypto.randomUUID(),
            periodNumber: chastityHistory.length + 1,
            startTime: tempStartTime,
            endTime: tempEndTime,
            duration: rawDurationSeconds,
            reasonForRemoval: reasonForRemoval,
            totalPauseDurationSeconds: finalAccumulatedPauseTime,
            pauseEvents: currentSessionPauseEvents // Save detailed pause events for history
        };

        const updatedHistory = [...chastityHistory, newHistoryEntry];
        setChastityHistory(updatedHistory);

        // Reset current session state
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
        setLastPauseEndTime(null); // Clear last pause end time for new session

        // Save updated history and reset current session state to Firestore
        await saveDataToFirestore({
            isCageOn: false,
            cageOnTime: null,
            timeInChastity: 0,
            chastityHistory: updatedHistory, // Update history with the new entry
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0,
            currentSessionPauseEvents: [],
            lastPauseEndTime: null
        });

        // Clear temporary states and close modal
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, [isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, isPaused, pauseStartTime, chastityHistory, reasonForRemoval, saveDataToFirestore]);

    /**
     * Cancels the cage removal process and closes the reason modal.
     */
    const handleCancelRemoval = useCallback(() => {
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, []);

    /**
     * Updates the start time of the current active chastity session.
     */
    const handleUpdateCurrentCageOnTime = useCallback(async () => {
        if (!isCageOn || !cageOnTime) {
            setEditSessionMessage("No active session to edit.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }

        const newTime = new Date(`${editSessionDateInput}T${editSessionTimeInput}`);

        // Validate the new time input
        if (isNaN(newTime.getTime())) {
            setEditSessionMessage("Invalid date and/or time provided.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        if (newTime.getTime() > new Date().getTime()) {
            setEditSessionMessage("Start time cannot be in the future.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }

        // Capture old time for logging BEFORE updating cageOnTime
        const oldTimeForLog = formatTime(cageOnTime, true, true);

        // Update cageOnTime state immediately with the new value
        setCageOnTime(newTime);

        // Recalculate and set timeInChastity based on the new cageOnTime
        // This is crucial to immediately reflect the change in the timer display
        setTimeInChastity(Math.max(0, Math.floor((new Date().getTime() - newTime.getTime()) / 1000)));

        // Log the session edit event
        const newTimeForLog = formatTime(newTime, true, true);
        const eventsColRef = typeof getEventsCollectionRef === 'function' ? getEventsCollectionRef() : null;
        if (eventsColRef) {
            try {
                await addDoc(eventsColRef, {
                    eventType: 'startTimeEdit', // Explicit event type
                    eventTimestamp: Timestamp.now(),
                    oldStartTime: cageOnTime.toISOString(), // Store as ISO string to preserve full timestamp
                    newStartTime: newTime.toISOString(),     // Store as ISO string
                    notes: `Session start time edited by ${googleEmail || 'Anonymous User'}.\nOriginal: ${oldTimeForLog}.\nNew: ${newTimeForLog}.`,
                    editedBy: googleEmail || 'Anonymous User' // Track who made the edit
                });
                fetchEvents(); // Re-fetch events to update the log table
            } catch (error) {
                console.error("Error logging session edit event:", error);
                setEditSessionMessage("Error logging edit. Update applied locally.");
                setTimeout(() => setEditSessionMessage(''), 3000);
            }
        }

        // Save the updated cageOnTime to Firestore
        await saveDataToFirestore({ cageOnTime: newTime });

        setEditSessionMessage("Start time updated successfully!");
        setTimeout(() => setEditSessionMessage(''), 3000); // Clear message after 3 seconds
    }, [isCageOn, cageOnTime, editSessionDateInput, editSessionTimeInput, getEventsCollectionRef, googleEmail, saveDataToFirestore, fetchEvents]);

    // --- PAUSE CONTROL HANDLERS ---

    /**
     * Initiates the pause process, showing the reason modal if no cooldown is active.
     */
    const handleInitiatePause = useCallback(() => {
        // Implement a cooldown period to prevent rapid pausing/unpausing
        // For example, allow pausing only if 12 hours have passed since the last unpause/session end
        if (lastPauseEndTime && (new Date().getTime() - lastPauseEndTime.getTime() < 12 * 3600 * 1000)) { // 12 hours cooldown
            setPauseCooldownMessage('You can pause again only 12 hours after the last unpause or session end.');
            setTimeout(() => setPauseCooldownMessage(''), 5000); // Clear message after 5 seconds
            return;
        }
        setShowPauseReasonModal(true);
    }, [lastPauseEndTime]);

    /**
     * Confirms pausing the session and logs the pause start.
     */
    const handleConfirmPause = useCallback(async () => {
        const now = new Date();
        setIsPaused(true);
        setPauseStartTime(now);
        // Add a new pause event entry to the current session's pauseEvents array
        setCurrentSessionPauseEvents(prev => [...prev, { startTime: now, reason: reasonForPauseInput }]);
        setShowPauseReasonModal(false);
        setReasonForPauseInput(''); // Clear the reason input

        // Save updated pause state to Firestore
        await saveDataToFirestore({ isPaused: true, pauseStartTime: now, currentSessionPauseEvents: currentSessionPauseEvents });
    }, [reasonForPauseInput, saveDataToFirestore, currentSessionPauseEvents]);

    /**
     * Cancels the pause modal without pausing the session.
     */
    const handleCancelPauseModal = useCallback(() => setShowPauseReasonModal(false), []);

    /**
     * Resumes the session, calculates pause duration, and updates accumulated pause time.
     */
    const handleResumeSession = useCallback(async () => {
        const now = new Date();
        if (!pauseStartTime) {
            console.error("No pause start time found to resume session.");
            return;
        }
        const duration = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);
        const newAccumulated = accumulatedPauseTimeThisSession + duration;

        setAccumulatedPauseTimeThisSession(newAccumulated);
        // Update the last pause event with an end time and duration
        setCurrentSessionPauseEvents(prev =>
            prev.map((e, i) =>
                i === prev.length - 1 ? { ...e, endTime: now, duration } : e
            )
        );
        setIsPaused(false);
        setPauseStartTime(null);
        setLastPauseEndTime(now); // Set the end time of the last pause for cooldown calculation

        // Save updated state to Firestore
        await saveDataToFirestore({
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: newAccumulated,
            currentSessionPauseEvents: currentSessionPauseEvents,
            lastPauseEndTime: now
        });
    }, [pauseStartTime, accumulatedPauseTimeThisSession, saveDataToFirestore, currentSessionPauseEvents]);

    // --- DATA RESTORATION FROM ID HANDLERS ---
    const handleRestoreUserIdInputChange = (e) => setRestoreUserIdInput(e.target.value);
    const handleInitiateRestoreFromId = () => setShowRestoreFromIdPrompt(true);
    const handleCancelRestoreFromId = () => setShowRestoreFromIdPrompt(false);

    /**
     * Confirms and performs data restoration from another user ID.
     */
    const handleConfirmRestoreFromId = useCallback(async () => {
        if (!restoreUserIdInput.trim()) {
            setRestoreFromIdMessage("Please enter a User ID.");
            setTimeout(() => setRestoreFromIdMessage(''), 3000);
            setShowRestoreFromIdPrompt(false);
            return;
        }

        const docRef = doc(db, 'users', restoreUserIdInput);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                applyRestoredData(docSnap.data());
                setRestoreFromIdMessage("Data successfully loaded from User ID!");
                // Also clear the current user's session data in Firestore if different
                // and save the restored data to the current user's doc.
                await setDoc(doc(db, "users", userId), docSnap.data(), { merge: true });
                // Re-fetch events for the new user ID
                fetchEvents(userId);
            } else {
                setRestoreFromIdMessage("No data found for the provided User ID.");
            }
        } catch (error) {
            console.error("Error restoring data from ID:", error);
            setRestoreFromIdMessage(`Error restoring data: ${error.message}`);
        } finally {
            setShowRestoreFromIdPrompt(false);
            setRestoreUserIdInput('');
            setTimeout(() => setRestoreFromIdMessage(''), 3000);
        }
    }, [restoreUserIdInput, userId, applyRestoredData, fetchEvents]);

    /**
     * Confirms and resumes a previously active session found on load.
     */
    const handleConfirmRestoreSession = useCallback(async () => {
        if (loadedSessionData) {
            // Merge loaded session data with existing history and timeCageOff (if any)
            // This is important if a user started anonymously, then logged in, then had a session.
            // The applyRestoredData will handle converting timestamps and setting states.
            const mergedData = {
                ...loadedSessionData,
                chastityHistory: loadedSessionData.chastityHistory || [],
                totalTimeCageOff: loadedSessionData.totalTimeCageOff || 0
            };
            applyRestoredData(mergedData);
            await saveDataToFirestore(mergedData); // Persist merged data to current user's doc
        }
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [loadedSessionData, applyRestoredData, saveDataToFirestore]);

    /**
     * Discards a previously active session found on load and starts a new one from scratch.
     */
    const handleDiscardAndStartNew = useCallback(async () => {
        // Reset only the active session state, leaving history and total off time
        await saveDataToFirestore({
            isCageOn: false,
            cageOnTime: null,
            timeInChastity: 0,
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0,
            currentSessionPauseEvents: [],
            lastPauseEndTime: null,
            hasSessionEverBeenActive: false // Reset this to indicate a fresh start visually if needed
        });
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
        setLastPauseEndTime(null);
        setHasSessionEverBeenActive(false);

        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [saveDataToFirestore]);

    // --- EFFECTS ---

    /**
     * Effect to subscribe to Firestore changes for session data.
     * Runs on initial auth readiness and userId changes.
     */
    useEffect(() => {
        if (!isAuthReady || !userId) return;

        const docRef = getDocRef();
        if (!docRef) return;

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Only show restore prompt if an active session is found AND it's not already handled
                if (data.isCageOn && !isCageOn && !showRestoreSessionPrompt && data.cageOnTime) {
                    setLoadedSessionData(data);
                    setShowRestoreSessionPrompt(true);
                } else {
                    // Apply data directly if no active session or already handled
                    applyRestoredData(data);
                }
            } else {
                // If doc doesn't exist, initialize with default empty data
                applyRestoredData({});
            }
        }, (error) => {
            console.error("Error listening to session data:", error);
            // Optionally handle this with a user-facing message
        });

        return () => unsubscribe(); // Cleanup on unmount or dependency change
    }, [isAuthReady, userId, getDocRef, applyRestoredData, isCageOn, showRestoreSessionPrompt]);

    /**
     * Effect to ensure the user's Firestore document exists on initial load/login.
     */
    useEffect(() => {
        if (!isAuthReady || !userId) return;

        const ensureUserDocExists = async () => {
            try {
                const docRef = getDocRef();
                if (!docRef) return;

                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    console.log("🆕 Creating default user doc for:", userId);
                    await setDoc(docRef, {
                        isCageOn: false,
                        chastityHistory: [],
                        totalTimeCageOff: 0,
                        hasSessionEverBeenActive: false,
                        isPaused: false,
                        accumulatedPauseTimeThisSession: 0
                    });
                }
            } catch (error) {
                console.error("Error checking/creating Firestore user doc:", error);
            }
        };

        ensureUserDocExists();
    }, [isAuthReady, userId, getDocRef]);

    /**
     * Effect to update total effective and paused times from chastity history.
     * Recalculates whenever chastityHistory changes.
     */
    useEffect(() => {
        let totalEffective = 0;
        let totalPaused = 0;
        chastityHistory.forEach(p => {
            totalEffective += (p.duration || 0) - (p.totalPauseDurationSeconds || 0);
            totalPaused += p.totalPauseDurationSeconds || 0;
        });
        setTotalChastityTime(totalEffective);
        setOverallTotalPauseTime(totalPaused);
    }, [chastityHistory]);

    /**
     * Effect to manage the live timers for "time in chastity", "time cage off",
     * and "live pause duration".
     * Clears and re-sets intervals based on cage/pause status changes.
     */
    useEffect(() => {
        // Clear all intervals on effect re-run to prevent multiple timers
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
            // Only run "cage off" timer if a session has ever been active
            timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
        }

        if (isPaused && pauseStartTime) {
            pauseDisplayTimerRef.current = setInterval(() => {
                setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000));
            }, 1000);
        } else {
            setLivePauseDuration(0); // Reset live pause duration if not paused
        }

        // Cleanup function for when the component unmounts or dependencies change
        return () => {
            clearInterval(timerInChastityRef.current);
            clearInterval(timerCageOffRef.current);
            clearInterval(pauseDisplayTimerRef.current);
        };
    }, [isCageOn, isPaused, cageOnTime, hasSessionEverBeenActive, pauseStartTime]);


    return {
        cageOnTime, isCageOn, timeInChastity, timeCageOff, chastityHistory, totalChastityTime,
        totalTimeCageOff, overallTotalPauseTime, showReasonModal, reasonForRemoval, tempEndTime,
        tempStartTime, isPaused, pauseStartTime, accumulatedPauseTimeThisSession, showPauseReasonModal, reasonForPauseInput,
        currentSessionPauseEvents, livePauseDuration, lastPauseEndTime, pauseCooldownMessage,
        showRestoreSessionPrompt, loadedSessionData, hasSessionEverBeenActive, confirmReset, setConfirmReset,
        editSessionDateInput, setEditSessionDateInput, editSessionTimeInput, setEditSessionTimeInput, editSessionMessage,
        restoreUserIdInput, showRestoreFromIdPrompt, restoreFromIdMessage,
        handleUpdateCurrentCageOnTime, handleToggleCage,
        handleConfirmRemoval, handleCancelRemoval,
        handleInitiatePause, handleConfirmPause, handleCancelPauseModal, handleResumeSession,
        handleRestoreUserIdInputChange, handleInitiateRestoreFromId, handleCancelRestoreFromId, handleConfirmRestoreFromId,
        handleConfirmRestoreSession, handleDiscardAndStartNew,
        saveDataToFirestore,
        // Expose setters for external manipulation (e.g., reset all data)
        setChastityHistory, setTimeCageOff, setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setLastPauseEndTime, setHasSessionEverBeenActive,
    };
};
