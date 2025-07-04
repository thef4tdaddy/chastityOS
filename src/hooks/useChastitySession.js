import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, Timestamp, addDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { formatTime, formatElapsedTime } from '../utils';
import { db } from '../firebase';
import * as Sentry from '@sentry/react';

export const useChastitySession = (
    userId,
    isAuthReady,
    googleEmail,
    getEventsCollectionRef,
    fetchEvents
) => {
    // --- State declarations ---
    const [cageOnTime, setCageOnTime] = useState(null);
    const [isCageOn, setIsCageOn] = useState(false);
    const [timeInChastity, setTimeInChastity] = useState(0);
    const [timeCageOff, setTimeCageOff] = useState(0);
    const [cageOffStartTime, setCageOffStartTime] = useState(null);
    const [chastityHistory, setChastityHistory] = useState([]);
    const [totalChastityTime, setTotalChastityTime] = useState(0);
    const [totalTimeCageOff, setTotalTimeCageOff] = useState(0);
    const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonForRemoval, setReasonForRemoval] = useState(''); // stores selected removal category
    const [removalCustomReason, setRemovalCustomReason] = useState('');
    const [tempEndTime, setTempEndTime] = useState(null);
    const [tempStartTime, setTempStartTime] = useState(null);
    const [showRestoreSessionPrompt, setShowRestoreSessionPrompt] = useState(false);
    const [loadedSessionData, setLoadedSessionData] = useState(null);
    const [hasSessionEverBeenActive, setHasSessionEverBeenActive] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const resetTimeoutRef = useRef(null);

    const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
    const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);
    const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');

    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
    const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
    const [pauseReason, setPauseReason] = useState(''); // stores selected pause category
    const [pauseCustomReason, setPauseCustomReason] = useState('');
    const [currentSessionPauseEvents, setCurrentSessionPauseEvents] = useState([]);
    const [livePauseDuration, setLivePauseDuration] = useState(0);
    const [lastPauseEndTime, setLastPauseEndTime] = useState(null);
    const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');

    const [editSessionDateInput, setEditSessionDateInput] = useState('');
    const [editSessionTimeInput, setEditSessionTimeInput] = useState('');
    const [editSessionMessage, setEditSessionMessage] = useState('');
    
    // --- New State for Keyholder Duration ---
    const [requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds] = useState(0);


    const timerInChastityRef = useRef(null);
    const timerCageOffRef = useRef(null);
    const pauseDisplayTimerRef = useRef(null);

    const getDocRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return doc(db, "users", targetUserId);
    }, [userId]);

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
            Sentry.captureException(error);
        }
    }, [isAuthReady, userId, getDocRef]);

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
        const loadedCageOffStart = data.cageOffStartTime?.toDate ? data.cageOffStartTime.toDate() : null;
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
        setCageOffStartTime(!loadedCageOn && loadedCageOffStart && !isNaN(loadedCageOffStart.getTime()) ? loadedCageOffStart : null);
        if (!loadedCageOn && loadedCageOffStart) {
            const now = new Date();
            const elapsedOff = Math.floor((now.getTime() - loadedCageOffStart.getTime()) / 1000);
            setTimeCageOff(elapsedOff);
        } else {
            setTimeCageOff(0);
        }
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
    }, []);

    const handleToggleCage = useCallback(() => {
        if (!isAuthReady || isPaused) {
            if (isPaused) {
                console.warn("Cannot toggle cage while session is paused.");
            }
            return;
        }
        const currentTime = new Date();
        if (confirmReset) {
            setConfirmReset(false);
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
        }
        if (!isCageOn) {
            const newTotalOffTime = totalTimeCageOff + timeCageOff;
            setCageOnTime(currentTime);
            setIsCageOn(true);
            setTimeInChastity(0);
            setTimeCageOff(0);
            setCageOffStartTime(null);
            setAccumulatedPauseTimeThisSession(0);
            setCurrentSessionPauseEvents([]);
            setPauseStartTime(null);
            setIsPaused(false);
            setHasSessionEverBeenActive(true);
            saveDataToFirestore({
                isCageOn: true,
                cageOnTime: Timestamp.fromDate(currentTime),
                totalTimeCageOff: newTotalOffTime,
                timeInChastity: 0,
                cageOffStartTime: null,
                hasSessionEverBeenActive: true,
                isPaused: false,
                pauseStartTime: null,
                accumulatedPauseTimeThisSession: 0,
                currentSessionPauseEvents: []
            });
        } else {
            setTempEndTime(currentTime);
            setTempStartTime(cageOnTime);
            setShowReasonModal(true);
        }
    }, [isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, saveDataToFirestore]);

    const handleConfirmRemoval = useCallback(async () => {
        if (!isAuthReady || !tempStartTime || !tempEndTime) {
            console.error("Missing data for confirming removal.");
            return;
        }
        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
        if (isPaused && pauseStartTime) {
            finalAccumulatedPauseTime += Math.max(0, Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000));
        }
        const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));
        const newHistoryEntry = {
            id: crypto.randomUUID(),
            periodNumber: chastityHistory.length + 1,
            startTime: tempStartTime,
            endTime: tempEndTime,
            duration: rawDurationSeconds,
            reasonForRemoval: reasonForRemoval === 'Other' ? (removalCustomReason || 'Other') : reasonForRemoval,
            totalPauseDurationSeconds: finalAccumulatedPauseTime,
            pauseEvents: currentSessionPauseEvents
        };
        const updatedHistory = [...chastityHistory, newHistoryEntry];
        setChastityHistory(updatedHistory);
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setCageOffStartTime(tempEndTime);
        setTimeCageOff(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);

        // Do NOT reset lastPauseEndTime, so cooldown persists across sessions.
        await saveDataToFirestore({
            isCageOn: false,
            cageOnTime: null,
            timeInChastity: 0,
            cageOffStartTime: tempEndTime,
            chastityHistory: updatedHistory,
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0,
            currentSessionPauseEvents: []
        });
        setReasonForRemoval('');
        setRemovalCustomReason('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, [isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, isPaused, pauseStartTime, chastityHistory, reasonForRemoval, removalCustomReason, saveDataToFirestore]);

    const handleCancelRemoval = useCallback(() => {
        setReasonForRemoval('');
        setRemovalCustomReason('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, []);

    const handleUpdateCurrentCageOnTime = useCallback(async () => {
        // THIS IS THE FIX: Add a more robust check to ensure cageOnTime is a valid Date object.
        if (!isCageOn || !(cageOnTime instanceof Date) || isNaN(cageOnTime.getTime())) {
            setEditSessionMessage("No valid active session to edit.");
            Sentry.captureMessage("handleUpdateCurrentCageOnTime called with invalid cageOnTime", { extra: { cageOnTime }});
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        const newTime = new Date(`${editSessionDateInput}T${editSessionTimeInput}`);
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
        const oldTimeForLog = formatTime(cageOnTime, true, true);
        const newTimeForLog = formatTime(newTime, true, true);
        const eventsColRef = typeof getEventsCollectionRef === 'function' ? getEventsCollectionRef() : null;
        if (eventsColRef) {
            try {
                await addDoc(eventsColRef, {
                    eventType: 'startTimeEdit',
                    types: ['Session Edit'],
                    eventTimestamp: Timestamp.now(),
                    oldStartTime: cageOnTime.toISOString(),
                    newStartTime: newTime.toISOString(),
                    notes: `Session start time edited by ${googleEmail || 'Anonymous User'}.\nOriginal: ${oldTimeForLog}.\nNew: ${newTimeForLog}.`,
                    editedBy: googleEmail || 'Anonymous User'
                });
                fetchEvents();
            } catch (error) {
                console.error("Error logging session edit event:", error);
                Sentry.captureException(error);
                setEditSessionMessage("Error logging edit. Update applied locally.");
                setTimeout(() => setEditSessionMessage(''), 3000);
            }
        }
        // Update local state immediately for responsiveness
        setCageOnTime(newTime);
        setTimeInChastity(Math.max(0, Math.floor((new Date().getTime() - newTime.getTime()) / 1000)));
        // Save to Firestore
        await saveDataToFirestore({ cageOnTime: Timestamp.fromDate(newTime) });
        setEditSessionMessage("Start time updated successfully!");
        setTimeout(() => setEditSessionMessage(''), 3000);
    }, [isCageOn, cageOnTime, editSessionDateInput, editSessionTimeInput, getEventsCollectionRef, googleEmail, saveDataToFirestore, fetchEvents]);

    const handleInitiatePause = useCallback(() => {
        if (lastPauseEndTime && (new Date().getTime() - lastPauseEndTime.getTime() < 12 * 3600 * 1000)) {
            const remainingCooldown = (12 * 3600 * 1000) - (new Date().getTime() - lastPauseEndTime.getTime());
            setPauseCooldownMessage(`You can pause again in ${formatElapsedTime(Math.ceil(remainingCooldown / 1000))}.`);
            setTimeout(() => setPauseCooldownMessage(''), 5000);
            return;
        }
        setShowPauseReasonModal(true);
    }, [lastPauseEndTime]);

    const handleConfirmPause = useCallback(async () => {
        const now = new Date();
        const finalReason = pauseReason === 'Other' ? (pauseCustomReason || 'Other') : pauseReason;
        setIsPaused(true);
        setPauseStartTime(now);
        const updatedPauseEvents = [...currentSessionPauseEvents, { startTime: now, reason: finalReason }];
        setCurrentSessionPauseEvents(updatedPauseEvents);
        setShowPauseReasonModal(false);
        setPauseReason('');
        setPauseCustomReason('');
        await saveDataToFirestore({ isPaused: true, pauseStartTime: now, currentSessionPauseEvents: updatedPauseEvents });
    }, [pauseReason, pauseCustomReason, saveDataToFirestore, currentSessionPauseEvents]);

    const handleCancelPauseModal = useCallback(() => {
        setShowPauseReasonModal(false);
        setPauseReason('');
        setPauseCustomReason('');
    }, []);
    
    const handleResumeSession = useCallback(async () => {
        const now = new Date();
        if (!pauseStartTime) {
            console.error("No pause start time found to resume session.");
            return;
        }
        const duration = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);
        const newAccumulated = accumulatedPauseTimeThisSession + duration;

        const updatedPauseEvents = currentSessionPauseEvents.map((e, i) =>
            i === currentSessionPauseEvents.length - 1 ? { ...e, endTime: now, duration } : e
        );

        setAccumulatedPauseTimeThisSession(newAccumulated);
        setCurrentSessionPauseEvents(updatedPauseEvents);
        setIsPaused(false);
        setPauseStartTime(null);
        setLastPauseEndTime(now);

        await saveDataToFirestore({
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: newAccumulated,
            currentSessionPauseEvents: updatedPauseEvents,
            lastPauseEndTime: now
        });
    }, [pauseStartTime, accumulatedPauseTimeThisSession, saveDataToFirestore, currentSessionPauseEvents]);
    
    const handleEndChastityNow = useCallback(async (reason = 'Session ended programmatically.') => {
        if (!isCageOn || !cageOnTime) {
            console.error("Cannot end session: No active session.");
            return;
        }
        const endTime = new Date();
        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
        if (isPaused && pauseStartTime) {
            finalAccumulatedPauseTime += Math.max(0, Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000));
        }
        const rawDurationSeconds = Math.max(0, Math.floor((endTime.getTime() - cageOnTime.getTime()) / 1000));
        const newHistoryEntry = {
            id: crypto.randomUUID(),
            periodNumber: chastityHistory.length + 1,
            startTime: cageOnTime,
            endTime: endTime,
            duration: rawDurationSeconds,
            reasonForRemoval: reason,
            totalPauseDurationSeconds: finalAccumulatedPauseTime,
            pauseEvents: currentSessionPauseEvents
        };
        const updatedHistory = [...chastityHistory, newHistoryEntry];
        setChastityHistory(updatedHistory);
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setCageOffStartTime(endTime);
        setTimeCageOff(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
        await saveDataToFirestore({
            isCageOn: false, cageOnTime: null, timeInChastity: 0,
            cageOffStartTime: endTime,
            chastityHistory: updatedHistory, isPaused: false, pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: []
        });
    }, [isCageOn, cageOnTime, accumulatedPauseTimeThisSession, isPaused, pauseStartTime, chastityHistory, currentSessionPauseEvents, saveDataToFirestore]);
    
    const handleRestoreUserIdInputChange = (e) => setRestoreUserIdInput(e.target.value);
    const handleInitiateRestoreFromId = () => setShowRestoreFromIdPrompt(true);
    const handleCancelRestoreFromId = () => setShowRestoreFromIdPrompt(false);

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
                await setDoc(doc(db, "users", userId), docSnap.data(), { merge: true });
                fetchEvents(userId);
            } else {
                setRestoreFromIdMessage("No data found for the provided User ID.");
            }
        } catch (error) {
            console.error("Error restoring data from ID:", error);
            Sentry.captureException(error);
            setRestoreFromIdMessage(`Error restoring data: ${error.message}`);
        } finally {
            setShowRestoreFromIdPrompt(false);
            setRestoreUserIdInput('');
            setTimeout(() => setRestoreFromIdMessage(''), 3000);
        }
    }, [restoreUserIdInput, userId, applyRestoredData, fetchEvents]);

    const handleConfirmRestoreSession = useCallback(async () => {
        if (loadedSessionData) {
            const mergedData = {
                ...loadedSessionData,
                chastityHistory: loadedSessionData.chastityHistory || [],
                totalTimeCageOff: loadedSessionData.totalTimeCageOff || 0
            };
            applyRestoredData(mergedData);
            await saveDataToFirestore(mergedData);
        }
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [loadedSessionData, applyRestoredData, saveDataToFirestore]);

    const handleDiscardAndStartNew = useCallback(async () => {
        await saveDataToFirestore({
            isCageOn: false,
            cageOnTime: null,
            timeInChastity: 0,
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0,
            currentSessionPauseEvents: [],
            lastPauseEndTime: null,
            hasSessionEverBeenActive: false,
            cageOffStartTime: null
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
        setCageOffStartTime(null);
        setTimeCageOff(0);
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [saveDataToFirestore]);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) return;
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (
                    data.isCageOn &&
                    !isCageOn &&
                    !showRestoreSessionPrompt &&
                    data.cageOnTime
                ) {
                    setLoadedSessionData(data);
                    setShowRestoreSessionPrompt(true);
                } else if (!showRestoreSessionPrompt) {
                    applyRestoredData(data);
                }
            } else {
                applyRestoredData({});
            }
        }, (error) => {
            console.error("Error listening to session data:", error);
            Sentry.captureException(error);
        });
        return () => unsubscribe();
    }, [isAuthReady, userId, getDocRef, applyRestoredData, isCageOn, showRestoreSessionPrompt]);

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
                        accumulatedPauseTimeThisSession: 0,
                        requiredKeyholderDurationSeconds: 0,
                        cageOffStartTime: null
                    });
                }
            } catch (error) {
                console.error("Error checking/creating Firestore user doc:", error);
                Sentry.captureException(error);
            }
        };
        ensureUserDocExists();
    }, [isAuthReady, userId, getDocRef]);

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
        } else if (!isCageOn && cageOffStartTime) {
            timerCageOffRef.current = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - cageOffStartTime.getTime()) / 1000);
                setTimeCageOff(elapsed);
            }, 1000);
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
    }, [isCageOn, isPaused, cageOnTime, cageOffStartTime, pauseStartTime]);

    return {
        cageOnTime, isCageOn, timeInChastity, timeCageOff, chastityHistory, totalChastityTime,
        totalTimeCageOff, overallTotalPauseTime, showReasonModal, reasonForRemoval, setReasonForRemoval,
        removalCustomReason, setRemovalCustomReason,
        tempEndTime, tempStartTime, isPaused, pauseStartTime, accumulatedPauseTimeThisSession,
        showPauseReasonModal, pauseReason, setPauseReason, pauseCustomReason, setPauseCustomReason, currentSessionPauseEvents,
        livePauseDuration, lastPauseEndTime, pauseCooldownMessage, showRestoreSessionPrompt, loadedSessionData,
        hasSessionEverBeenActive, confirmReset, setConfirmReset, editSessionDateInput, setEditSessionDateInput,
        editSessionTimeInput, setEditSessionTimeInput, editSessionMessage, restoreUserIdInput,
        showRestoreFromIdPrompt, restoreFromIdMessage, handleUpdateCurrentCageOnTime, handleToggleCage,
        handleConfirmRemoval, handleCancelRemoval,
        handleEndChastityNow,
        handleInitiatePause, handleConfirmPause,
        handleCancelPauseModal, handleResumeSession, handleRestoreUserIdInputChange, handleInitiateRestoreFromId,
        handleCancelRestoreFromId, handleConfirmRestoreFromId, handleConfirmRestoreSession,
        handleDiscardAndStartNew, saveDataToFirestore, setChastityHistory, setTimeCageOff, setIsCageOn,
        setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime,
        setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setLastPauseEndTime, setHasSessionEverBeenActive,
        cageOffStartTime,
        requiredKeyholderDurationSeconds
    };
};
