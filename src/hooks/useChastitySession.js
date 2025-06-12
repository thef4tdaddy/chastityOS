// src/hooks/useChastitySession.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, Timestamp, addDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { formatTime, formatElapsedTime } from '../utils';
import { db } from '../firebase';

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

    const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
    const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);
    const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');

    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
    const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
    const [reasonForPauseInput, setReasonForPauseInput] = useState('');
    const [currentSessionPauseEvents, setCurrentSessionPauseEvents] = useState([]);
    const [livePauseDuration, setLivePauseDuration] = useState(0);
    const [lastPauseEndTime, setLastPauseEndTime] = useState(null);
    const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');

    const [editSessionDateInput, setEditSessionDateInput] = useState('');
    const [editSessionTimeInput, setEditSessionTimeInput] = useState('');
    const [editSessionMessage, setEditSessionMessage] = useState('');

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
            setAccumulatedPauseTimeThisSession(0);
            setCurrentSessionPauseEvents([]);
            setPauseStartTime(null);
            setIsPaused(false);
            setHasSessionEverBeenActive(true);
            saveDataToFirestore({
                isCageOn: true,
                cageOnTime: currentTime,
                totalTimeCageOff: newTotalOffTime,
                timeInChastity: 0,
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
            reasonForRemoval: reasonForRemoval,
            totalPauseDurationSeconds: finalAccumulatedPauseTime,
            pauseEvents: currentSessionPauseEvents
        };
        const updatedHistory = [...chastityHistory, newHistoryEntry];
        setChastityHistory(updatedHistory);
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);

        // Do NOT reset lastPauseEndTime, so cooldown persists across sessions.
        await saveDataToFirestore({
            isCageOn: false,
            cageOnTime: null,
            timeInChastity: 0,
            chastityHistory: updatedHistory,
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: 0,
            currentSessionPauseEvents: []
        });
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, [isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, isPaused, pauseStartTime, chastityHistory, reasonForRemoval, saveDataToFirestore]);

    const handleCancelRemoval = useCallback(() => {
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, []);

    const handleUpdateCurrentCageOnTime = useCallback(async () => {
        if (!isCageOn || !cageOnTime) {
            setEditSessionMessage("No active session to edit.");
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
        setCageOnTime(newTime);
        setTimeInChastity(Math.max(0, Math.floor((new Date().getTime() - newTime.getTime()) / 1000)));
        const newTimeForLog = formatTime(newTime, true, true);
        const eventsColRef = typeof getEventsCollectionRef === 'function' ? getEventsCollectionRef() : null;
        if (eventsColRef) {
            try {
                await addDoc(eventsColRef, {
                    eventType: 'startTimeEdit',
                    eventTimestamp: Timestamp.now(),
                    oldStartTime: cageOnTime.toISOString(),
                    newStartTime: newTime.toISOString(),
                    notes: `Session start time edited by ${googleEmail || 'Anonymous User'}.\nOriginal: ${oldTimeForLog}.\nNew: ${newTimeForLog}.`,
                    editedBy: googleEmail || 'Anonymous User'
                });
                fetchEvents();
            } catch (error) {
                console.error("Error logging session edit event:", error);
                setEditSessionMessage("Error logging edit. Update applied locally.");
                setTimeout(() => setEditSessionMessage(''), 3000);
            }
        }
        await saveDataToFirestore({ cageOnTime: newTime });
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
        setIsPaused(true);
        setPauseStartTime(now);
        const updatedPauseEvents = [...currentSessionPauseEvents, { startTime: now, reason: reasonForPauseInput }];
        setCurrentSessionPauseEvents(updatedPauseEvents);
        setShowPauseReasonModal(false);
        setReasonForPauseInput('');
        await saveDataToFirestore({ isPaused: true, pauseStartTime: now, currentSessionPauseEvents: updatedPauseEvents });
    }, [reasonForPauseInput, saveDataToFirestore, currentSessionPauseEvents]);

    const handleCancelPauseModal = useCallback(() => setShowPauseReasonModal(false), []);
    
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
            hasSessionEverBeenActive: false
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

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) return;
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isCageOn && !isCageOn && !showRestoreSessionPrompt && data.cageOnTime) {
                    setLoadedSessionData(data);
                    setShowRestoreSessionPrompt(true);
                } else {
                    applyRestoredData(data);
                }
            } else {
                applyRestoredData({});
            }
        }, (error) => {
            console.error("Error listening to session data:", error);
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
                        accumulatedPauseTimeThisSession: 0
                    });
                }
            } catch (error) {
                console.error("Error checking/creating Firestore user doc:", error);
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
    }, [isCageOn, isPaused, cageOnTime, hasSessionEverBeenActive, pauseStartTime]);

    return {
        cageOnTime, isCageOn, timeInChastity, timeCageOff, chastityHistory, totalChastityTime,
        totalTimeCageOff, overallTotalPauseTime, showReasonModal, reasonForRemoval, setReasonForRemoval,
        tempEndTime, tempStartTime, isPaused, pauseStartTime, accumulatedPauseTimeThisSession,
        showPauseReasonModal, reasonForPauseInput, setReasonForPauseInput, currentSessionPauseEvents,
        livePauseDuration, lastPauseEndTime, pauseCooldownMessage, showRestoreSessionPrompt, loadedSessionData,
        hasSessionEverBeenActive, confirmReset, setConfirmReset, editSessionDateInput, setEditSessionDateInput,
        editSessionTimeInput, setEditSessionTimeInput, editSessionMessage, restoreUserIdInput,
        showRestoreFromIdPrompt, restoreFromIdMessage, handleUpdateCurrentCageOnTime, handleToggleCage,
        handleConfirmRemoval, handleCancelRemoval, handleInitiatePause, handleConfirmPause,
        handleCancelPauseModal, handleResumeSession, handleRestoreUserIdInputChange, handleInitiateRestoreFromId,
        handleCancelRestoreFromId, handleConfirmRestoreFromId, handleConfirmRestoreSession,
        handleDiscardAndStartNew, saveDataToFirestore, setChastityHistory, setTimeCageOff, setIsCageOn,
        setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime,
        setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setLastPauseEndTime, setHasSessionEverBeenActive,
    };
};
