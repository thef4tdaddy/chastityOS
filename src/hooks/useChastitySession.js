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
    const [confirmReset, setConfirmReset] = useState(false); // Added this line
    const resetTimeoutRef = useRef(null); // Added this line

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

    const timerInChastityRef = useRef(null);
    const timerCageOffRef = useRef(null);
    const pauseDisplayTimerRef = useRef(null);

    const getDocRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return doc(db, "users", targetUserId);
    }, [userId]);

    const saveDataToFirestore = useCallback(async (dataToSave) => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) return;
        try {
            await setDoc(docRef, dataToSave, { merge: true });
        } catch (error) { console.error("Error saving session data to Firestore:", error); }
    }, [isAuthReady, userId, getDocRef]);

    const applyRestoredData = useCallback((data) => {
        const loadedHist = (data.chastityHistory || []).map(item => ({ ...item, startTime: item.startTime?.toDate ? item.startTime.toDate() : null, endTime: item.endTime?.toDate ? item.endTime.toDate() : null, totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0, pauseEvents: (item.pauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate ? p.startTime.toDate() : null, endTime: p.endTime?.toDate ? p.endTime.toDate() : null })) }));
        setChastityHistory(loadedHist);
        setTotalTimeCageOff(data.totalTimeCageOff || 0);
        
        const lPauseEndTime = data.lastPauseEndTime?.toDate ? data.lastPauseEndTime.toDate() : null;
        setLastPauseEndTime(lPauseEndTime && !isNaN(lPauseEndTime.getTime()) ? lPauseEndTime : null);
        const loadedCageOn = data.isCageOn || false;
        const loadedCageOnTime = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null;
        const loadedPauseStart = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;
        setIsCageOn(loadedCageOn);
        setCageOnTime(loadedCageOn && loadedCageOnTime && !isNaN(loadedCageOnTime.getTime()) ? loadedCageOnTime : null);
        setTimeInChastity(loadedCageOn ? (data.timeInChastity || 0) : 0);
        setIsPaused(loadedCageOn ? (data.isPaused || false) : false);
        setPauseStartTime(loadedCageOn && data.isPaused && loadedPauseStart && !isNaN(loadedPauseStart.getTime()) ? loadedPauseStart : null);
        setAccumulatedPauseTimeThisSession(loadedCageOn ? (data.accumulatedPauseTimeThisSession || 0) : 0);
        setCurrentSessionPauseEvents(loadedCageOn ? (data.currentSessionPauseEvents || []).map(p => ({...p, startTime: p.startTime?.toDate(), endTime: p.endTime?.toDate()})) : []);
        setHasSessionEverBeenActive(data.hasSessionEverBeenActive !== undefined ? data.hasSessionEverBeenActive : true);
        
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, []);

    // --- HANDLERS ---
    const handleToggleCage = useCallback(() => {
        if (!isAuthReady || isPaused) { return; }
        const currentTime = new Date();
        if (confirmReset) { setConfirmReset(false); if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current); }
        if (!isCageOn) {
            const newTotalOffTime = totalTimeCageOff + timeCageOff;
            setCageOnTime(currentTime); setIsCageOn(true); setTimeInChastity(0); setTimeCageOff(0);
            setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
            setPauseStartTime(null); setIsPaused(false);
            setHasSessionEverBeenActive(true);
            saveDataToFirestore({ isCageOn: true, cageOnTime: currentTime, totalTimeCageOff: newTotalOffTime, timeInChastity: 0, hasSessionEverBeenActive: true });
        } else {
            setTempEndTime(currentTime); setTempStartTime(cageOnTime);
            setShowReasonModal(true);
        }
    }, [isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, saveDataToFirestore]);

    const handleConfirmRemoval = useCallback(async () => { 
        if (!isAuthReady || !tempStartTime || !tempEndTime) return;
        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession; 
        if (isPaused && pauseStartTime) { 
            finalAccumulatedPauseTime += Math.max(0, Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000)); 
        } 
        const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000)); 
        const newHistoryEntry = { id: crypto.randomUUID(), periodNumber: chastityHistory.length + 1, startTime: tempStartTime, endTime: tempEndTime, duration: rawDurationSeconds, reasonForRemoval: reasonForRemoval, totalPauseDurationSeconds: finalAccumulatedPauseTime, pauseEvents: currentSessionPauseEvents }; 
        const updatedHistory = [...chastityHistory, newHistoryEntry];
        setChastityHistory(updatedHistory);
        setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
        saveDataToFirestore({ isCageOn: false, cageOnTime: null, chastityHistory: updatedHistory }); 
        setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false); 
    }, [isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, isPaused, pauseStartTime, chastityHistory, reasonForRemoval, saveDataToFirestore]);
    
    const handleCancelRemoval = useCallback(() => { setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false); }, []);
    
    const handleUpdateCurrentCageOnTime = useCallback(async () => {
        if (!isCageOn || !cageOnTime) { setEditSessionMessage("No active session."); return; }
        const newTime = new Date(`${editSessionDateInput}T${editSessionTimeInput}`);
        if (isNaN(newTime.getTime()) || newTime > new Date()) { setEditSessionMessage("Invalid date."); return; }
        const oldTimeForLog = formatTime(cageOnTime, true, true);
        const newTimeForLog = formatTime(newTime, true, true);
        const eventsColRef = getEventsCollectionRef();
        if (eventsColRef) {
            await addDoc(eventsColRef, {
                eventTimestamp: Timestamp.now(), 
                notes: `Session start time edited by ${googleEmail || 'user'}.\nOriginal: ${oldTimeForLog}.\nNew: ${newTimeForLog}.`,
            });
            fetchEvents();
        }
        setCageOnTime(newTime);
        setTimeInChastity(Math.max(0, Math.floor((new Date() - newTime) / 1000)));
        saveDataToFirestore({ cageOnTime: newTime });
        setEditSessionMessage("Start time updated.");
    }, [isCageOn, cageOnTime, editSessionDateInput, editSessionTimeInput, getEventsCollectionRef, googleEmail, saveDataToFirestore, fetchEvents]);

    const handleInitiatePause = useCallback(() => {
        if (lastPauseEndTime && (new Date() - lastPauseEndTime < 12 * 3600 * 1000)) {
            setPauseCooldownMessage('You can pause again in 12 hours.');
            return;
        }
        setShowPauseReasonModal(true);
    }, [lastPauseEndTime]);

    const handleConfirmPause = useCallback(async () => {
        const now = new Date();
        setIsPaused(true);
        setPauseStartTime(now);
        setCurrentSessionPauseEvents(prev => [...prev, { startTime: now, reason: reasonForPauseInput }]);
        setShowPauseReasonModal(false);
        setReasonForPauseInput('');
        await saveDataToFirestore({ isPaused: true, pauseStartTime: now });
    }, [reasonForPauseInput, saveDataToFirestore]);

    const handleCancelPauseModal = useCallback(() => setShowPauseReasonModal(false), []);

    const handleResumeSession = useCallback(async () => {
        const now = new Date();
        if (!pauseStartTime) return;
        const duration = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);
        const newAccumulated = accumulatedPauseTimeThisSession + duration;
        setAccumulatedPauseTimeThisSession(newAccumulated);
        setCurrentSessionPauseEvents(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, endTime: now, duration } : e));
        setIsPaused(false);
        setPauseStartTime(null);
        setLastPauseEndTime(now);
        await saveDataToFirestore({ isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: newAccumulated, lastPauseEndTime: now });
    }, [pauseStartTime, accumulatedPauseTimeThisSession, saveDataToFirestore]);
    
    const handleRestoreUserIdInputChange = (e) => setRestoreUserIdInput(e.target.value);
    const handleInitiateRestoreFromId = () => setShowRestoreFromIdPrompt(true);
    const handleCancelRestoreFromId = () => setShowRestoreFromIdPrompt(false);
    const handleConfirmRestoreFromId = async () => {
        const docRef = doc(db, 'users', restoreUserIdInput);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            applyRestoredData(docSnap.data());
            setRestoreFromIdMessage("Data restored.");
        } else {
            setRestoreFromIdMessage("No data found for this ID.");
        }
        setShowRestoreFromIdPrompt(false);
    };
    
    const handleConfirmRestoreSession = useCallback(() => {
        if (loadedSessionData) {
            applyRestoredData({ ...loadedSessionData, chastityHistory: chastityHistory, totalTimeCageOff: totalTimeCageOff });
        }
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [loadedSessionData, chastityHistory, totalTimeCageOff, applyRestoredData]);

    const handleDiscardAndStartNew = useCallback(async () => {
        await saveDataToFirestore({ isCageOn: false, cageOnTime: null, timeInChastity: 0 });
        setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0);
        setShowRestoreSessionPrompt(false); setLoadedSessionData(null);
    }, [saveDataToFirestore]);

    // --- EFFECTS ---
    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) return;

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isCageOn && !isCageOn) { // Check for active session on load
                    setLoadedSessionData(data);
                    setShowRestoreSessionPrompt(true);
                } else {
                    applyRestoredData(data);
                }
            } else {
                applyRestoredData({});
            }
        });
        return () => unsubscribe();
    }, [isAuthReady, userId, getDocRef, applyRestoredData, isCageOn]);

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
        if (isCageOn && !isPaused && cageOnTime) {
            timerInChastityRef.current = setInterval(() => setTimeInChastity(prev => prev + 1), 1000);
        } else {
            clearInterval(timerInChastityRef.current);
        }

        if (!isCageOn && hasSessionEverBeenActive) {
            timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
        } else {
            clearInterval(timerCageOffRef.current);
        }

        if (isPaused && pauseStartTime) {
            pauseDisplayTimerRef.current = setInterval(() => {
                setLivePauseDuration(Math.floor((new Date() - pauseStartTime) / 1000));
            }, 1000);
        } else {
            clearInterval(pauseDisplayTimerRef.current);
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
        setChastityHistory, setTimeCageOff, setIsCageOn, setCageOnTime, setTimeInChastity, setIsPaused, setPauseStartTime, setAccumulatedPauseTimeThisSession, setCurrentSessionPauseEvents, setLastPauseEndTime, setHasSessionEverBeenActive,
    };
};
