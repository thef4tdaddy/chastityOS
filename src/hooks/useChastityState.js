// src/hooks/useChastityState.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
    getFirestore, doc, getDoc, setDoc, Timestamp, setLogLevel,
    collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc, onSnapshot
} from 'firebase/firestore';
import { formatTime, formatElapsedTime } from '../utils';
import { useKeyholderHandlers } from './chastity/keyholderHandlers';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase configuration is missing or incomplete.");
}
const appIdForFirestore = firebaseConfig.appId || 'default-chastity-app-id';
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
setLogLevel('debug');

export const useChastityState = () => {
    // All state from App.jsx is here
    const [userId, setUserId] = useState(null);
    const [googleEmail, setGoogleEmail] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showUserIdInSettings, setShowUserIdInSettings] = useState(false);
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
    const [confirmReset, setConfirmReset] = useState(false);
    const resetTimeoutRef = useRef(null);
    const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
    const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);
    const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');
    const [submissivesNameInput, setSubmissivesNameInput] = useState('');
    const [savedSubmissivesName, setSavedSubmissivesName] = useState('');
    const [nameMessage, setNameMessage] = useState('');
    const [sexualEventsLog, setSexualEventsLog] = useState([]);
    const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
    const [newEventTime, setNewEventTime] = useState(new Date().toTimeString().slice(0,5));
    const [selectedEventTypes, setSelectedEventTypes] = useState([]);
    const [otherEventTypeChecked, setOtherEventTypeChecked] = useState(false);
    const [otherEventTypeDetail, setOtherEventTypeDetail] = useState('');
    const [newEventNotes, setNewEventNotes] = useState('');
    const [newEventDurationHours, setNewEventDurationHours] = useState('');
    const [newEventDurationMinutes, setNewEventDurationMinutes] = useState('');
    const [newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount] = useState('');
    const [newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount] = useState('');
    const [eventLogMessage, setEventLogMessage] = useState('');
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
    const [showPauseReasonModal, setShowPauseReasonModal] = useState(false);
    const [reasonForPauseInput, setReasonForPauseInput] = useState('');
    const [currentSessionPauseEvents, setCurrentSessionPauseEvents] = useState([]);
    const [livePauseDuration, setLivePauseDuration] = useState(0);
    const pauseDisplayTimerRef = useRef(null);
    const [lastPauseEndTime, setLastPauseEndTime] = useState(null);
    const [pauseCooldownMessage, setPauseCooldownMessage] = useState('');
    const [showRestoreSessionPrompt, setShowRestoreSessionPrompt] = useState(false);
    const [loadedSessionData, setLoadedSessionData] = useState(null);
    const [hasSessionEverBeenActive, setHasSessionEverBeenActive] = useState(false);
    const [goalDurationSeconds, setGoalDurationSeconds] = useState(null);
    const [keyholderName, setKeyholderName] = useState('');
    const [keyholderPasswordHash, setKeyholderPasswordHash] = useState(null);
    const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
    const [requiredKeyholderDurationSeconds, setRequiredKeyholderDurationSeconds] = useState(null);
    const [keyholderMessage, setKeyholderMessage] = useState('');
    const [editSessionDateInput, setEditSessionDateInput] = useState('');
    const [editSessionTimeInput, setEditSessionTimeInput] = useState('');
    const [editSessionMessage, setEditSessionMessage] = useState('');
    const [isTrackingAllowed, setIsTrackingAllowed] = useState(true);
    const [eventDisplayMode, setEventDisplayMode] = useState('kinky'); // Keep state for future use
    const [rewards, setRewards] = useState([]);
    const [punishments, setPunishments] = useState([]);

    const timerInChastityRef = useRef(null);
    const timerCageOffRef = useRef(null);

    const getDocRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return doc(db, "artifacts", appIdForFirestore, "users", targetUserId);
    }, [userId]);

    const getEventsCollectionRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return collection(db, "artifacts", appIdForFirestore, "users", targetUserId, "sexualEventsLog");
    }, [userId]);

    const saveDataToFirestore = useCallback(async (dataToSave) => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) return;
        try {
            const firestoreReadyData = {
                ...dataToSave,
                eventDisplayMode, // Save current display mode
                hasSessionEverBeenActive,
                goalDurationSeconds: dataToSave.goalDurationSeconds !== undefined ? dataToSave.goalDurationSeconds : goalDurationSeconds,
                keyholderName: dataToSave.keyholderName !== undefined ? dataToSave.keyholderName : keyholderName,
                keyholderPasswordHash: dataToSave.keyholderPasswordHash !== undefined ? dataToSave.keyholderPasswordHash : keyholderPasswordHash,
                requiredKeyholderDurationSeconds: dataToSave.requiredKeyholderDurationSeconds !== undefined ? dataToSave.requiredKeyholderDurationSeconds : requiredKeyholderDurationSeconds,
                rewards: dataToSave.rewards !== undefined ? dataToSave.rewards : rewards,
                punishments: dataToSave.punishments !== undefined ? dataToSave.punishments : punishments,
                isTrackingAllowed
            };
            const toTS = (d) => d instanceof Date && !isNaN(d.getTime()) ? Timestamp.fromDate(d) : (typeof d === 'string' && new Date(d) instanceof Date && !isNaN(new Date(d).getTime()) ? Timestamp.fromDate(new Date(d)) : null);
            firestoreReadyData.cageOnTime = toTS(firestoreReadyData.cageOnTime);
            if (firestoreReadyData.chastityHistory) { firestoreReadyData.chastityHistory = firestoreReadyData.chastityHistory.map(item => ({ ...item, startTime: toTS(item.startTime), endTime: toTS(item.endTime), pauseEvents: (item.pauseEvents || []).map(p => ({ ...p, startTime: toTS(p.startTime), endTime: toTS(p.endTime) })) })); }
            firestoreReadyData.pauseStartTime = toTS(firestoreReadyData.pauseStartTime);
            firestoreReadyData.lastPauseEndTime = toTS(firestoreReadyData.lastPauseEndTime);
            if (firestoreReadyData.currentSessionPauseEvents) { firestoreReadyData.currentSessionPauseEvents = firestoreReadyData.currentSessionPauseEvents.map(p => ({ ...p, startTime: toTS(p.startTime), endTime: toTS(p.endTime) })); }
            if (typeof firestoreReadyData.submissivesName === 'undefined') firestoreReadyData.submissivesName = savedSubmissivesName;
            if (Object.prototype.hasOwnProperty.call(firestoreReadyData, 'userAlias')) { delete firestoreReadyData.userAlias; }
            await setDoc(docRef, firestoreReadyData, { merge: true });
        } catch (error) { console.error("Error saving main data to Firestore:", error); }
    }, [userId, getDocRef, isAuthReady, savedSubmissivesName, hasSessionEverBeenActive, goalDurationSeconds, keyholderName, keyholderPasswordHash, requiredKeyholderDurationSeconds, rewards, punishments, isTrackingAllowed, eventDisplayMode]);

    const applyRestoredData = useCallback((data) => {
        const loadedHist = (data.chastityHistory || []).map(item => ({ ...item, startTime: item.startTime?.toDate ? item.startTime.toDate() : null, endTime: item.endTime?.toDate ? item.endTime.toDate() : null, totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0, pauseEvents: (item.pauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate ? p.startTime.toDate() : null, endTime: p.endTime?.toDate ? p.endTime.toDate() : null })) }));
        setChastityHistory(loadedHist);
        setTotalTimeCageOff(data.totalTimeCageOff || 0);
        const cName = data.submissivesName || ''; setSavedSubmissivesName(cName); setSubmissivesNameInput(cName);
        const lPauseEndTime = data.lastPauseEndTime?.toDate ? data.lastPauseEndTime.toDate() : null; setLastPauseEndTime(lPauseEndTime && !isNaN(lPauseEndTime.getTime()) ? lPauseEndTime : null);
        const loadedCageOn = data.isCageOn || false; const loadedCageOnTime = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null; const loadedPauseStart = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;
        setIsCageOn(loadedCageOn); setCageOnTime(loadedCageOn && loadedCageOnTime && !isNaN(loadedCageOnTime.getTime()) ? loadedCageOnTime : null);
        setTimeInChastity(loadedCageOn ? (data.timeInChastity || 0) : 0); setIsPaused(loadedCageOn ? (data.isPaused || false) : false);
        setPauseStartTime(loadedCageOn && data.isPaused && loadedPauseStart && !isNaN(loadedPauseStart.getTime()) ? loadedPauseStart : null);
        setAccumulatedPauseTimeThisSession(loadedCageOn ? (data.accumulatedPauseTimeThisSession || 0) : 0);
        setCurrentSessionPauseEvents(loadedCageOn ? (data.currentSessionPauseEvents || []).map(p => ({...p, startTime: p.startTime?.toDate(), endTime: p.endTime?.toDate()})) : []);
        setHasSessionEverBeenActive(data.hasSessionEverBeenActive !== undefined ? data.hasSessionEverBeenActive : true);
        setGoalDurationSeconds(data.goalDurationSeconds || null);
        setKeyholderName(data.keyholderName || '');
        setKeyholderPasswordHash(data.keyholderPasswordHash || null);
        setRequiredKeyholderDurationSeconds(data.requiredKeyholderDurationSeconds || null);
        setRewards(data.rewards || []);
        setPunishments(data.punishments || []);
        setIsKeyholderModeUnlocked(false);
        setShowRestoreSessionPrompt(false); setLoadedSessionData(null);
        setEventDisplayMode(data.eventDisplayMode || 'kinky');
        setIsTrackingAllowed(data.isTrackingAllowed !== undefined ? data.isTrackingAllowed : true);
    }, []);

    const fetchEvents = useCallback(async (targetUserId = userId) => {
        if (!isAuthReady || !targetUserId) return;
        setIsLoadingEvents(true);
        const eventsColRef = getEventsCollectionRef(targetUserId);
        if (!eventsColRef) { setEventLogMessage("Error: Could not get event log reference."); setTimeout(() => setEventLogMessage(''), 3000); setIsLoadingEvents(false); return; }
        try {
            const q = query(eventsColRef, orderBy("eventTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            setSexualEventsLog(querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), eventTimestamp: d.data().eventTimestamp?.toDate() })));
        } catch (error) { console.error("Error fetching events:", error); setEventLogMessage("Failed to load events."); setTimeout(() => setEventLogMessage(''), 3000);
        } finally { setIsLoadingEvents(false); }
    }, [isAuthReady, userId, getEventsCollectionRef]);

    const handleSetEventDisplayMode = useCallback(async (mode) => {
        if (mode === 'kinky' || mode === 'vanilla') {
            setEventDisplayMode(mode);
            await saveDataToFirestore({ eventDisplayMode: mode });
        }
    }, [saveDataToFirestore]);

    const {
        handleSetKeyholder,
        handleClearKeyholder,
        handleUnlockKeyholderControls,
        handleLockKeyholderControls,
        handleSetRequiredDuration,
        handleSetGoalDuration
    } = useKeyholderHandlers({
        userId,
        saveDataToFirestore,
        setKeyholderName,
        setKeyholderPasswordHash,
        setRequiredKeyholderDurationSeconds,
        setIsKeyholderModeUnlocked,
        setKeyholderMessage,
        setGoalDurationSeconds,
        keyholderPasswordHash,
        keyholderName
    });

    const handleAddReward = useCallback(async ({ timeSeconds = 0, other = '' }) => {
        const newReward = { id: crypto.randomUUID(), timeSeconds: timeSeconds > 0 ? timeSeconds : null, other: other.trim() };
        const updated = [...rewards, newReward];
        setRewards(updated);
        let newRequired = requiredKeyholderDurationSeconds;
        if (timeSeconds > 0 && requiredKeyholderDurationSeconds !== null) {
            newRequired = Math.max(0, requiredKeyholderDurationSeconds - timeSeconds);
            setRequiredKeyholderDurationSeconds(newRequired);
        }
        await saveDataToFirestore({ rewards: updated, requiredKeyholderDurationSeconds: newRequired });
    }, [rewards, requiredKeyholderDurationSeconds, saveDataToFirestore]);

    const handleAddPunishment = useCallback(async ({ timeSeconds = 0, other = '' }) => {
        const newPunishment = { id: crypto.randomUUID(), timeSeconds: timeSeconds > 0 ? timeSeconds : null, other: other.trim() };
        const updated = [...punishments, newPunishment];
        setPunishments(updated);
        const newRequired = (requiredKeyholderDurationSeconds || 0) + (timeSeconds > 0 ? timeSeconds : 0);
        setRequiredKeyholderDurationSeconds(newRequired);
        await saveDataToFirestore({ punishments: updated, requiredKeyholderDurationSeconds: newRequired });
    }, [punishments, requiredKeyholderDurationSeconds, saveDataToFirestore]);
    
    const handleUpdateCurrentCageOnTime = useCallback(async () => {
        if (!isCageOn || !cageOnTime) {
            setEditSessionMessage("No active session to edit.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        const originalCageOnTime = new Date(cageOnTime.getTime());
        const newDateTimeString = `${editSessionDateInput}T${editSessionTimeInput}`;
        const newProposedCageOnTime = new Date(newDateTimeString);
        if (isNaN(newProposedCageOnTime.getTime())) {
            setEditSessionMessage("Invalid date or time format for edit.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        if (newProposedCageOnTime.getTime() > new Date().getTime()) {
            setEditSessionMessage("Start time cannot be in the future.");
            setTimeout(() => setEditSessionMessage(''), 3000);
            return;
        }
        const oldCageOnTimeForLog = formatTime(originalCageOnTime, true, true);
        const newCageOnTimeForLog = formatTime(newProposedCageOnTime, true, true);
        setCageOnTime(newProposedCageOnTime);
        const eventsColRef = getEventsCollectionRef();
        if (eventsColRef && userId) {
            try {
                await addDoc(eventsColRef, {
                    eventTimestamp: Timestamp.now(), 
                    loggedAt: serverTimestamp(),
                    types: ["Session Edit"],
                    otherTypeDetail: "",
                    notes: `Cage start time manually updated.\nOriginal: ${oldCageOnTimeForLog}.\nNew: ${newCageOnTimeForLog}.`,
                    durationSeconds: null, selfOrgasmAmount: null, partnerOrgasmAmount: null
                });
                fetchEvents();
            } catch (error) {
                console.error("App.js: Error logging session edit event:", error);
                setEditSessionMessage("Failed to log edit. See console. Start time reverted.");
                setTimeout(() => setEditSessionMessage(''), 4000);
                setCageOnTime(originalCageOnTime);
                return; 
            }
        }
        let updatedTimeInChastity = 0;
        if (newProposedCageOnTime instanceof Date && !isNaN(newProposedCageOnTime.getTime())) {
             updatedTimeInChastity = Math.max(0, Math.floor((new Date().getTime() - newProposedCageOnTime.getTime()) / 1000));
        }
        setTimeInChastity(updatedTimeInChastity);
        await saveDataToFirestore({
            isCageOn, cageOnTime: newProposedCageOnTime, timeInChastity: updatedTimeInChastity,
            isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents,
            chastityHistory, totalTimeCageOff, submissivesName: savedSubmissivesName,
            lastPauseEndTime, goalDurationSeconds, keyholderName,
            keyholderPasswordHash, requiredKeyholderDurationSeconds,
        });
        setEditSessionMessage("Session start time updated successfully!");
        setTimeout(() => setEditSessionMessage(''), 3000);
    }, [isCageOn, cageOnTime, editSessionDateInput, editSessionTimeInput, getEventsCollectionRef, userId, fetchEvents, saveDataToFirestore, isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, chastityHistory, totalTimeCageOff, savedSubmissivesName, lastPauseEndTime, goalDurationSeconds, keyholderName, keyholderPasswordHash, requiredKeyholderDurationSeconds]);

    const handleInitiatePause = useCallback(() => { setPauseCooldownMessage(''); if (lastPauseEndTime instanceof Date && !isNaN(lastPauseEndTime.getTime())) { const twelveHoursInMillis = 12 * 3600 * 1000; const timeSinceLastPauseEnd = new Date().getTime() - lastPauseEndTime.getTime(); if (timeSinceLastPauseEnd < twelveHoursInMillis) { const remainingTime = twelveHoursInMillis - timeSinceLastPauseEnd; const hours = Math.floor(remainingTime / 3600000); const minutes = Math.floor((remainingTime % 3600000) / 60000); setPauseCooldownMessage(`You can pause again in approximately ${hours}h ${minutes}m.`); setTimeout(() => setPauseCooldownMessage(''), 5000); return; } } setShowPauseReasonModal(true); }, [lastPauseEndTime]);
    const handleConfirmPause = useCallback(async () => { if (!isCageOn) { setShowPauseReasonModal(false); setReasonForPauseInput(''); return; } const now = new Date(); const newPauseEvent = { id: crypto.randomUUID(), startTime: now, reason: reasonForPauseInput.trim() || "N/A", endTime: null, duration: null }; setIsPaused(true); setPauseStartTime(now); const updatedSessionPauses = [...currentSessionPauseEvents, newPauseEvent]; setCurrentSessionPauseEvents(updatedSessionPauses); setShowPauseReasonModal(false); setReasonForPauseInput(''); await saveDataToFirestore({ isPaused: true, pauseStartTime: now, accumulatedPauseTimeThisSession, currentSessionPauseEvents: updatedSessionPauses, lastPauseEndTime }); }, [isCageOn, reasonForPauseInput, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore, lastPauseEndTime]);
    const handleCancelPauseModal = useCallback(() => { setShowPauseReasonModal(false); setReasonForPauseInput(''); }, []);
    const handleResumeSession = useCallback(async () => { if (!isPaused || !(pauseStartTime instanceof Date) || isNaN(pauseStartTime.getTime())) { setIsPaused(false); setPauseStartTime(null); setLivePauseDuration(0); return; } const endTime = new Date(); const currentPauseDuration = Math.max(0, Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000)); const newAccumulatedPauseTime = accumulatedPauseTimeThisSession + currentPauseDuration; const updatedSessionPauses = currentSessionPauseEvents.map((event, index) => (index === currentSessionPauseEvents.length - 1 && !event.endTime) ? { ...event, endTime, duration: currentPauseDuration } : event ); setAccumulatedPauseTimeThisSession(newAccumulatedPauseTime); setIsPaused(false); setPauseStartTime(null); setCurrentSessionPauseEvents(updatedSessionPauses); setLivePauseDuration(0); setLastPauseEndTime(endTime); await saveDataToFirestore({ isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: newAccumulatedPauseTime, currentSessionPauseEvents: updatedSessionPauses, lastPauseEndTime: endTime }); }, [isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore]);
    
    const handleToggleCage = useCallback(() => {
        if (!isAuthReady || isPaused) { return; }
        const currentTime = new Date();
        if (confirmReset) { setConfirmReset(false); if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current); }
        if (!isCageOn) {
            const newTotalOffTime = totalTimeCageOff + timeCageOff; setTotalTimeCageOff(newTotalOffTime);
            setCageOnTime(currentTime); setIsCageOn(true); setTimeInChastity(0); setTimeCageOff(0);
            setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
            setPauseStartTime(null); setIsPaused(false);
            setHasSessionEverBeenActive(true);
            saveDataToFirestore({ isCageOn: true, cageOnTime: currentTime, totalTimeCageOff: newTotalOffTime, timeInChastity: 0, chastityHistory, submissivesName: savedSubmissivesName, isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime, hasSessionEverBeenActive: true });
        } else {
            setTempEndTime(currentTime); setTempStartTime(cageOnTime);
            setShowReasonModal(true);
        }
    }, [isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, saveDataToFirestore, chastityHistory, savedSubmissivesName, lastPauseEndTime]);

    const handleConfirmRemoval = useCallback(async () => { if (!isAuthReady || !(tempStartTime instanceof Date) || !(tempEndTime instanceof Date) || isNaN(tempStartTime.getTime()) || isNaN(tempEndTime.getTime())) { setShowReasonModal(false); return; } let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession; let finalPauseEventsForHistory = currentSessionPauseEvents; if (isPaused && pauseStartTime instanceof Date && !isNaN(pauseStartTime.getTime())) { const finalPauseDuration = Math.max(0, Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000)); finalAccumulatedPauseTime += finalPauseDuration; finalPauseEventsForHistory = currentSessionPauseEvents.map((event, index) => (index === currentSessionPauseEvents.length - 1 && !event.endTime) ? { ...event, endTime: tempEndTime, duration: finalPauseDuration } : event ); } const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000)); const newHistoryEntry = { id: crypto.randomUUID(), periodNumber: chastityHistory.length + 1, startTime: tempStartTime, endTime: tempEndTime, duration: rawDurationSeconds, reasonForRemoval: reasonForRemoval.trim() || 'N/A', totalPauseDurationSeconds: finalAccumulatedPauseTime, pauseEvents: finalPauseEventsForHistory }; const updatedHistoryState = [...chastityHistory, newHistoryEntry]; setChastityHistory(updatedHistoryState); setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]); setHasSessionEverBeenActive(true); saveDataToFirestore({ isCageOn: false, cageOnTime: null, timeInChastity: 0, chastityHistory: updatedHistoryState, totalTimeCageOff, submissivesName: savedSubmissivesName, isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime, hasSessionEverBeenActive: true }); setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false); }, [isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, isPaused, pauseStartTime, chastityHistory, reasonForRemoval, saveDataToFirestore, totalTimeCageOff, savedSubmissivesName, lastPauseEndTime]);
    
    const handleCancelRemoval = useCallback(() => { setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false); }, []);
    
    const clearAllEvents = useCallback(async () => { if (!isAuthReady || !userId) return; const eventsColRef = getEventsCollectionRef(); if (!eventsColRef) { return; } try { const q = query(eventsColRef); const querySnapshot = await getDocs(q); const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, eventsColRef.path, docSnapshot.id))); await Promise.all(deletePromises); setSexualEventsLog([]); } catch (error) { console.error("App.js: clearAllEvents - Error:", error); } }, [isAuthReady, userId, getEventsCollectionRef]);
    
    const handleResetAllData = useCallback(() => { if (!isAuthReady) return; if (confirmReset) { if (timerInChastityRef.current) clearInterval(timerInChastityRef.current); if (timerCageOffRef.current) clearInterval(timerCageOffRef.current); if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current); setCageOnTime(null); setIsCageOn(false); setTimeInChastity(0); setTimeCageOff(0); setChastityHistory([]); setTotalChastityTime(0); setTotalTimeCageOff(0); setSavedSubmissivesName(''); setSubmissivesNameInput(''); setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]); setLastPauseEndTime(null); setPauseCooldownMessage(''); setHasSessionEverBeenActive(false); setConfirmReset(false); setShowReasonModal(false); setGoalDurationSeconds(null); setKeyholderName(''); setKeyholderPasswordHash(null); setRequiredKeyholderDurationSeconds(null); setIsKeyholderModeUnlocked(false); setIsTrackingAllowed(true); saveDataToFirestore({ cageOnTime: null, isCageOn: false, timeInChastity: 0, chastityHistory: [], totalChastityTime: 0, totalTimeCageOff: 0, submissivesName: '', isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime: null, hasSessionEverBeenActive: false, goalDurationSeconds: null, keyholderName: '', keyholderPasswordHash: null, requiredKeyholderDurationSeconds: null, isTrackingAllowed: true }); clearAllEvents(); setNameMessage("All data reset."); setTimeout(() => setNameMessage(''), 4000); } else { setConfirmReset(true); resetTimeoutRef.current = setTimeout(() => { setConfirmReset(false); }, 3000); } }, [isAuthReady, confirmReset, saveDataToFirestore, clearAllEvents, setIsTrackingAllowed]);
    
    const handleSubmissivesNameInputChange = useCallback((event) => { setSubmissivesNameInput(event.target.value) }, []);
    
    const handleSetSubmissivesName = useCallback(async () => { if (!isAuthReady || !userId) { setNameMessage("Auth error."); setTimeout(() => setNameMessage(''), 3000); return; } if (savedSubmissivesName) { setNameMessage("Name set. Reset to change."); setTimeout(() => setNameMessage(''), 4000); return; } const trimmedName = submissivesNameInput.trim(); if (!trimmedName) { setNameMessage("Name empty."); setTimeout(() => setNameMessage(''), 3000); return; } setSavedSubmissivesName(trimmedName); await saveDataToFirestore({ submissivesName: trimmedName, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, lastPauseEndTime, hasSessionEverBeenActive: true }); setNameMessage("Name set!"); setTimeout(() => setNameMessage(''), 3000); }, [isAuthReady, userId, savedSubmissivesName, submissivesNameInput, saveDataToFirestore, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, lastPauseEndTime]);
    
    const handleToggleUserIdVisibility = useCallback(() => { setShowUserIdInSettings(prev => !prev); }, []);
    const handleEventTypeChange = useCallback((type) => { setSelectedEventTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]); }, []);
    const handleOtherEventTypeCheckChange = useCallback((e) => { setOtherEventTypeChecked(e.target.checked); if (!e.target.checked) { setOtherEventTypeDetail(''); } }, []);
    
    const handleLogNewEvent = useCallback(async (e) => {
        e.preventDefault();
        if (!isAuthReady || !userId) { setEventLogMessage("Auth error."); setTimeout(() => setEventLogMessage(''), 3000); return; }
        const finalEventTypes = [...selectedEventTypes];
        let finalOtherDetail = null; if (otherEventTypeChecked && otherEventTypeDetail.trim()) { finalOtherDetail = otherEventTypeDetail.trim(); }
        if (finalEventTypes.length === 0 && !finalOtherDetail) { setEventLogMessage("Select type or specify 'Other'."); setTimeout(() => setEventLogMessage(''), 3000); return; }
        const eventsColRef = getEventsCollectionRef(); if (!eventsColRef) { setEventLogMessage("Event log ref error."); setTimeout(() => setEventLogMessage(''), 3000); return; }
        const dateTimeString = `${newEventDate}T${newEventTime}`; const eventTimestamp = new Date(dateTimeString);
        if (isNaN(eventTimestamp.getTime())) { setEventLogMessage("Invalid date/time."); setTimeout(() => setEventLogMessage(''), 3000); return; }
        const durationHoursNum = parseInt(newEventDurationHours, 10) || 0; const durationMinutesNum = parseInt(newEventDurationMinutes, 10) || 0;
        const durationSeconds = (durationHoursNum * 3600) + (durationMinutesNum * 60);
        const selfOrgasmAmountNum = selectedEventTypes.includes("Orgasm (Self)") && newEventSelfOrgasmAmount ? parseInt(newEventSelfOrgasmAmount, 10) || null : null;
        const partnerOrgasmAmountNum = selectedEventTypes.includes("Orgasm (Partner)") && newEventPartnerOrgasmAmount ? parseInt(newEventPartnerOrgasmAmount, 10) || null : null;
        const newEventData = { eventTimestamp: Timestamp.fromDate(eventTimestamp), loggedAt: serverTimestamp(), types: finalEventTypes, otherTypeDetail: finalOtherDetail, notes: newEventNotes.trim(), durationSeconds: durationSeconds > 0 ? durationSeconds : null, selfOrgasmAmount: selfOrgasmAmountNum, partnerOrgasmAmount: partnerOrgasmAmountNum };
        try {
            await addDoc(eventsColRef, newEventData);
            setEventLogMessage("Event logged!"); setNewEventDate(new Date().toISOString().slice(0, 10)); setNewEventTime(new Date().toTimeString().slice(0,5));
            setSelectedEventTypes([]); setOtherEventTypeChecked(false); setOtherEventTypeDetail(''); setNewEventNotes('');
            setNewEventDurationHours(''); setNewEventDurationMinutes(''); setNewEventSelfOrgasmAmount(''); setNewEventPartnerOrgasmAmount('');
            fetchEvents();
        } catch (error) { console.error("App.js: handleLogNewEvent - Error:", error); setEventLogMessage("Failed to log. See console."); }
        setTimeout(() => setEventLogMessage(''), 3000);
    }, [isAuthReady, userId, selectedEventTypes, otherEventTypeChecked, otherEventTypeDetail, newEventDate, newEventTime, newEventDurationHours, newEventDurationMinutes, newEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, newEventNotes, getEventsCollectionRef, fetchEvents]);
    
    const handleExportTrackerCSV = useCallback(() => { if (!isAuthReady || chastityHistory.length === 0) { setEventLogMessage("No tracker history."); setTimeout(() => setEventLogMessage(''), 3000); return; } let csvContent = "Period #,Start Time,End Time,Raw Duration,Pause Duration,Effective Duration,Reason,Pause Events\n"; chastityHistory.forEach(p => { const rawF = formatElapsedTime(p.duration); const pauseF = formatElapsedTime(p.totalPauseDurationSeconds||0); const effF = formatElapsedTime(p.duration-(p.totalPauseDurationSeconds||0)); let pausesS = (p.pauseEvents||[]).map(pe=>`[${formatTime(pe.startTime,true,true)} to ${formatTime(pe.endTime,true,true)} (${formatElapsedTime(pe.duration||0)}) R: ${pe.reason||'N/A'}]`).join('; '); csvContent += `${p.periodNumber},${formatTime(p.startTime,true,true)},${formatTime(p.endTime,true,true)},${rawF},${pauseF},${effF},"${(p.reasonForRemoval||'').replace(/"/g,'""')}","${pausesS.replace(/"/g,'""')}"\n`; }); const link = document.createElement("a"); link.href=encodeURI("data:text/csv;charset=utf-8,"+csvContent); link.download="chastity_tracker_history.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link); setEventLogMessage("Tracker CSV exported!"); setTimeout(() => setEventLogMessage(''), 3000); }, [isAuthReady, chastityHistory]);
    const handleExportEventLogCSV = useCallback(() => { if (!isAuthReady || sexualEventsLog.length === 0) { setEventLogMessage("No events."); setTimeout(() => setEventLogMessage(''), 3000); return; } let csv = "Date,Type(s),Other,Duration,Orgasm (Self),Orgasm (Partner),Notes\n"; sexualEventsLog.slice().reverse().forEach(ev=>{csv+=`${formatTime(ev.eventTimestamp,true,true)},"${(ev.types||[]).join('; ')}","${ev.otherTypeDetail||''}","${ev.durationSeconds?formatElapsedTime(ev.durationSeconds):''}",${ev.selfOrgasmAmount||''},${ev.partnerOrgasmAmount||''},"${(ev.notes||'').replace(/"/g,'""')}"\n`;}); const link=document.createElement("a");link.href=encodeURI("data:text/csv;charset=utf-8,"+csv);link.download="sexual_events_log.csv";document.body.appendChild(link);link.click();document.body.removeChild(link);setEventLogMessage("Events CSV exported!"); setTimeout(() => setEventLogMessage(''), 3000);}, [isAuthReady, sexualEventsLog]);
    const handleExportTextReport = useCallback(() => { if(!isAuthReady){setEventLogMessage("Auth error.");setTimeout(()=>setEventLogMessage(''),3000);return;}let r=`Report ${formatTime(new Date(),true,true)}\nName: ${savedSubmissivesName||'N/A'}\nUID: ${userId||'N/A'}\nKH: ${keyholderName||'N/A'}\n------------------\nSTATUS:\nCage: ${isCageOn?(isPaused?'ON (Paused)':'ON'):'OFF'}\n`;if(isCageOn&&cageOnTime){r+=`Since: ${formatTime(cageOnTime,true,true)}\nEffective Session: ${formatElapsedTime(timeInChastity-(accumulatedPauseTimeThisSession||0))}\n`;if(isPaused&&pauseStartTime)r+=`Paused For: ${formatElapsedTime(livePauseDuration)}\n`;if((accumulatedPauseTimeThisSession||0)>0)r+=`Total Paused This Session: ${formatElapsedTime(isPaused&&pauseStartTime?(accumulatedPauseTimeThisSession||0)+livePauseDuration:(accumulatedPauseTimeThisSession||0))}\n`;}else r+=`Current Off: ${formatElapsedTime(timeCageOff)}\n`;r+=`\nTOTALS:\nChastity: ${formatElapsedTime(totalChastityTime)}\nOff: ${formatElapsedTime(totalTimeCageOff)}\nPaused: ${formatElapsedTime(overallTotalPauseTime)}\n------------------\n`;if(keyholderName && requiredKeyholderDurationSeconds !== null) {r+=`KH Required Duration: ${formatElapsedTime(requiredKeyholderDurationSeconds)}\n------------------\n`} else if (goalDurationSeconds !== null) {r+=`Personal Goal: ${formatElapsedTime(goalDurationSeconds)}\n------------------\n`} r+=`HISTORY (Recent First):\n`;if(chastityHistory.length>0)chastityHistory.slice().reverse().forEach(p=>{r+=`P#${p.periodNumber}: ${formatTime(p.startTime,true,true)}-${formatTime(p.endTime,true,true)}\n Raw: ${formatElapsedTime(p.duration)} Paused: ${formatElapsedTime(p.totalPauseDurationSeconds||0)} Eff: ${formatElapsedTime(p.duration-(p.totalPauseDurationSeconds||0))}\n R: ${p.reasonForRemoval||'N/A'}\n`;if(p.pauseEvents&&p.pauseEvents.length>0)p.pauseEvents.forEach(pe=>{r+=`  - P: ${formatTime(pe.startTime,true,true)}-${formatTime(pe.endTime,true,true)} (${formatElapsedTime(pe.duration||0)}) R: ${pe.reason||'N/A'}\n`;});r+='\n';});else r+="No history.\n\n";r+=`------------------\nEVENTS (Recent First):\n`;if(sexualEventsLog.length>0)sexualEventsLog.forEach(ev=>{let ts=(ev.types||[]).map(t=>{if(t==="Orgasm (Partner)" && keyholderName) return `Orgasm (${keyholderName})`; if(t==="Orgasm (Self)"&&savedSubmissivesName) return `Orgasm (${savedSubmissivesName})`; return t;}).join(', ');if(ev.otherTypeDetail)ts+=(ts?', ':'')+`Other: ${ev.otherTypeDetail}`;let os=[];if(ev.selfOrgasmAmount)os.push(`Self: ${ev.selfOrgasmAmount}`);if(ev.partnerOrgasmAmount)os.push(`${keyholderName||'Partner'}: ${ev.partnerOrgasmAmount}`);r+=`${formatTime(ev.eventTimestamp,true,true)}\n Types: ${ts||'N/A'}\n Dur: ${ev.durationSeconds?formatElapsedTime(ev.durationSeconds):'N/A'}\n Orgasms: ${os.join(', ')||'N/A'}\n Notes: ${ev.notes||'N/A'}\n\n`;});else r+="No events.\n";r+="------------------\nEnd";const b=new Blob([r],{type:'text/plain;charset=utf-8'});const l=document.createElement("a");l.href=URL.createObjectURL(b);l.download=`ChastityOS_Report_${new Date().toISOString().slice(0,10)}.txt`;document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(l.href);setEventLogMessage("Report exported!");setTimeout(()=>setEventLogMessage(''),3000);},[isAuthReady,savedSubmissivesName,userId,isCageOn,cageOnTime,timeInChastity,timeCageOff,totalChastityTime,totalTimeCageOff,chastityHistory,sexualEventsLog,overallTotalPauseTime,isPaused,accumulatedPauseTimeThisSession,livePauseDuration,pauseStartTime, keyholderName, requiredKeyholderDurationSeconds, goalDurationSeconds]);
    const handleExportJSON = useCallback(() => {
        if (!isAuthReady || !userId) {
            setEventLogMessage("Authentication not ready.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }

        const dataToExport = {
            isCageOn, cageOnTime, timeInChastity, timeCageOff, chastityHistory, totalTimeCageOff,
            savedSubmissivesName, sexualEventsLog, isPaused, pauseStartTime, accumulatedPauseTimeThisSession,
            currentSessionPauseEvents, lastPauseEndTime, hasSessionEverBeenActive, goalDurationSeconds,
            keyholderName, keyholderPasswordHash, requiredKeyholderDurationSeconds, isTrackingAllowed,
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `ChastityOS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setEventLogMessage("JSON backup exported!");
        setTimeout(() => setEventLogMessage(''), 3000);
    }, [ isAuthReady, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff, chastityHistory, totalTimeCageOff, savedSubmissivesName, sexualEventsLog, isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, lastPauseEndTime, hasSessionEverBeenActive, goalDurationSeconds, keyholderName, keyholderPasswordHash, requiredKeyholderDurationSeconds, isTrackingAllowed ]);
    const handleImportJSON = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!window.confirm("Are you sure you want to overwrite all current data with this backup? This cannot be undone.")) {
                    if (event.target) event.target.value = null;
                    return;
                }
                if (timerInChastityRef.current) clearInterval(timerInChastityRef.current);
                if (timerCageOffRef.current) clearInterval(timerCageOffRef.current);
                setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setIsPaused(false);
                setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
                applyRestoredData(data);
                const loadedEvents = (data.sexualEventsLog || []).map(item => ({ ...item, eventTimestamp: item.eventTimestamp ? new Date(item.eventTimestamp) : null }));
                setSexualEventsLog(loadedEvents);
                const mainDataToSave = { ...data };
                delete mainDataToSave.sexualEventsLog;
                await saveDataToFirestore({ ...mainDataToSave, hasSessionEverBeenActive: data.hasSessionEverBeenActive !== undefined ? data.hasSessionEverBeenActive : true });
                const eventsColRef = getEventsCollectionRef();
                if (eventsColRef && userId) {
                    const q = query(eventsColRef);
                    const querySnapshot = await getDocs(q);
                    const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, eventsColRef.path, docSnapshot.id)));
                    await Promise.all(deletePromises);
                    const setEventPromises = loadedEvents.map(eventData => {
                        const { id, ...restOfEventData } = eventData;
                        const timestamp = restOfEventData.eventTimestamp instanceof Date && !isNaN(restOfEventData.eventTimestamp) ? Timestamp.fromDate(restOfEventData.eventTimestamp) : serverTimestamp();
                        if (id) {
                            return setDoc(doc(eventsColRef, id), { ...restOfEventData, eventTimestamp: timestamp, loggedAt: serverTimestamp() });
                        } else {
                            return addDoc(eventsColRef, { ...restOfEventData, eventTimestamp: timestamp, loggedAt: serverTimestamp() });
                        }
                    });
                    await Promise.all(setEventPromises);
                }
                setEventLogMessage("Data restored successfully from JSON backup!");
                setTimeout(() => setEventLogMessage(''), 4000);
            } catch (error) {
                console.error("Error importing JSON:", error);
                setEventLogMessage("Error importing JSON file. See console for details.");
                setTimeout(() => setEventLogMessage(''), 4000);
            } finally {
                if (event.target) event.target.value = null;
            }
        };
        reader.readAsText(file);
    }, [applyRestoredData, saveDataToFirestore, getEventsCollectionRef, userId]);
    
    const handleRestoreUserIdInputChange = (event) => { setRestoreUserIdInput(event.target.value) };
    const handleInitiateRestoreFromId = () => { if (!restoreUserIdInput.trim()) { setRestoreFromIdMessage("Enter User ID."); setTimeout(() => setRestoreFromIdMessage(''), 3000); return; } setShowRestoreFromIdPrompt(true); };
    const handleCancelRestoreFromId = () => { setShowRestoreFromIdPrompt(false); setRestoreFromIdMessage(''); };
    const handleConfirmRestoreFromId = async () => {
        if (!restoreUserIdInput.trim() || !userId) { setRestoreFromIdMessage("Invalid input or current user session not ready."); setTimeout(() => setRestoreFromIdMessage(''), 3000); setShowRestoreFromIdPrompt(false); return; }
        const targetDocRef = doc(db, "artifacts", appIdForFirestore, "users", restoreUserIdInput.trim());
        try {
            const docSnap = await getDoc(targetDocRef);
            if (docSnap.exists()) {
                const dataToRestore = docSnap.data();
                if (timerInChastityRef.current) clearInterval(timerInChastityRef.current);
                if (timerCageOffRef.current) clearInterval(timerCageOffRef.current);
                setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
                applyRestoredData(dataToRestore);
                await saveDataToFirestore({ ...dataToRestore, hasSessionEverBeenActive: dataToRestore.hasSessionEverBeenActive !== undefined ? dataToRestore.hasSessionEverBeenActive : true });
                setRestoreFromIdMessage("Data restored successfully and saved under your User ID.");
                setRestoreUserIdInput('');
                if (isAuthReady && userId) fetchEvents(userId);
            } else { setRestoreFromIdMessage("No data found for the provided User ID."); }
        } catch (error) { console.error("Error restoring from ID:", error); setRestoreFromIdMessage("Error during restore. See console for details."); }
        setShowRestoreFromIdPrompt(false);
        setTimeout(() => setRestoreFromIdMessage(''), 4000);
    };
    
    const handleConfirmRestoreSession = useCallback(async () => { if (loadedSessionData) { const cageOnT = loadedSessionData.cageOnTime instanceof Timestamp ? loadedSessionData.cageOnTime.toDate() : new Date(loadedSessionData.cageOnTime); const pauseStartT = loadedSessionData.pauseStartTime instanceof Timestamp ? loadedSessionData.pauseStartTime.toDate() : (loadedSessionData.pauseStartTime ? new Date(loadedSessionData.pauseStartTime) : null); setIsCageOn(loadedSessionData.isCageOn); setCageOnTime(cageOnT && !isNaN(cageOnT.getTime()) ? cageOnT : null); setTimeInChastity(loadedSessionData.timeInChastity||0); setIsPaused(loadedSessionData.isPaused||false); setPauseStartTime(loadedSessionData.isPaused && pauseStartT && !isNaN(pauseStartT.getTime()) ? pauseStartT : null); setAccumulatedPauseTimeThisSession(loadedSessionData.accumulatedPauseTimeThisSession||0); setCurrentSessionPauseEvents((loadedSessionData.currentSessionPauseEvents||[]).map(p => ({...p, startTime: p.startTime?.toDate? p.startTime.toDate():null, endTime: p.endTime?.toDate? p.endTime.toDate():null }))); setHasSessionEverBeenActive(true); await saveDataToFirestore({ isCageOn: loadedSessionData.isCageOn, cageOnTime: cageOnT && !isNaN(cageOnT.getTime()) ? cageOnT : null, timeInChastity: loadedSessionData.timeInChastity || 0, isPaused: loadedSessionData.isPaused || false, pauseStartTime: (loadedSessionData.isPaused && pauseStartT && !isNaN(pauseStartT.getTime())) ? pauseStartT : null, accumulatedPauseTimeThisSession: loadedSessionData.accumulatedPauseTimeThisSession || 0, currentSessionPauseEvents: (loadedSessionData.currentSessionPauseEvents||[]).map(p => ({...p, startTime: p.startTime?.toDate? p.startTime.toDate():null, endTime: p.endTime?.toDate? p.endTime.toDate():null })), lastPauseEndTime, submissivesName: savedSubmissivesName, totalTimeCageOff, chastityHistory, hasSessionEverBeenActive: true, goalDurationSeconds }); } setShowRestoreSessionPrompt(false); setLoadedSessionData(null); }, [loadedSessionData, saveDataToFirestore, lastPauseEndTime, savedSubmissivesName, totalTimeCageOff, chastityHistory, goalDurationSeconds]);
    
    const handleDiscardAndStartNew = useCallback(async () => { setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]); setTimeCageOff(0); const newHasSessionEverBeenActive = chastityHistory.length > 0 || sexualEventsLog.length > 0; setHasSessionEverBeenActive(newHasSessionEverBeenActive); await saveDataToFirestore({ isCageOn: false, cageOnTime: null, timeInChastity: 0, isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], chastityHistory, totalChastityTime, totalTimeCageOff, submissivesName: savedSubmissivesName, lastPauseEndTime, hasSessionEverBeenActive: newHasSessionEverBeenActive, goalDurationSeconds, keyholderName, keyholderPasswordHash, requiredKeyholderDurationSeconds }); setShowRestoreSessionPrompt(false); setLoadedSessionData(null); }, [saveDataToFirestore, chastityHistory, sexualEventsLog, totalTimeCageOff, savedSubmissivesName, lastPauseEndTime, goalDurationSeconds, keyholderName, keyholderPasswordHash, requiredKeyholderDurationSeconds, totalChastityTime]);

    // --- All useEffect hooks --- //
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), async (u) => {
            if (u) {
                // Migrate data from anonymous user to new Google account if needed
                if (user && user.isAnonymous && !u.isAnonymous && user.uid !== u.uid) {
                  // Migrate data from anonymous UID to signed-in UID
                  const anonDocRef = doc(db, "artifacts", appIdForFirestore, "users", user.uid);
                  const newDocRef = doc(db, "artifacts", appIdForFirestore, "users", u.uid);
                  try {
                    const anonSnap = await getDoc(anonDocRef);
                    if (anonSnap.exists()) {
                      const dataToMigrate = anonSnap.data();
                      await setDoc(newDocRef, dataToMigrate, { merge: true });
                      await deleteDoc(anonDocRef); // Optional: delete old doc
                      console.log("✅ Migrated data from anonymous account to Google account.");
                    }
                  } catch (err) {
                    console.error("⚠️ Failed to migrate anonymous data:", err);
                  }
                }
                setUserId(u.uid);
                setIsAuthReady(true);
                setGoogleEmail(!u.isAnonymous ? u.email : null);
                setUser(u);
            } else {
                setUser(null);
                setUserId(null);
                setIsAuthReady(false);
                setGoogleEmail(null);
                signInAnonymously(getAuth()).catch(console.error);
            }
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) { setIsLoading(false); return; }
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (isLoading) {
                  const activeSessionIsCageOnLoaded = data.isCageOn || false;
                  const activeSessionCageOnTimeLoaded = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null;
                  if (activeSessionIsCageOnLoaded && activeSessionCageOnTimeLoaded && !isNaN(activeSessionCageOnTimeLoaded.getTime())) {
                    const loadedPauseStartTimeFromData = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;
                    setLoadedSessionData({
                      isCageOn: true,
                      cageOnTime: activeSessionCageOnTimeLoaded,
                      timeInChastity: data.timeInChastity || 0,
                      isPaused: data.isPaused || false,
                      pauseStartTime:
                        loadedPauseStartTimeFromData && !isNaN(loadedPauseStartTimeFromData.getTime())
                          ? loadedPauseStartTimeFromData
                          : null,
                      accumulatedPauseTimeThisSession: data.accumulatedPauseTimeThisSession || 0,
                      currentSessionPauseEvents: (data.currentSessionPauseEvents || []).map(p => ({
                        ...p,
                        startTime: p.startTime?.toDate ? p.startTime.toDate() : null,
                        endTime: p.endTime?.toDate ? p.endTime.toDate() : null
                      })),
                    });
                    setShowRestoreSessionPrompt(true);
                  }
                }
                applyRestoredData(data);
                setIsLoading(false);
            } else {
                applyRestoredData({});
                setIsLoading(false);
            }
        }, (error) => {
            console.error("Error with real-time listener:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [isAuthReady, userId, getDocRef, applyRestoredData, isLoading]);

    useEffect(() => {
        let totalEffectiveChastity = 0;
        let totalOverallPaused = 0;
        chastityHistory.forEach(p => {
            totalEffectiveChastity += Math.max(0, (p.duration || 0) - (p.totalPauseDurationSeconds || 0));
            totalOverallPaused += (p.totalPauseDurationSeconds || 0);
        });
        setTotalChastityTime(totalEffectiveChastity);
        setOverallTotalPauseTime(totalOverallPaused);
    }, [chastityHistory]);
    
    useEffect(() => {
        if (isCageOn && cageOnTime instanceof Date && !isNaN(cageOnTime.getTime())) {
            setEditSessionDateInput(cageOnTime.toISOString().slice(0, 10));
            setEditSessionTimeInput(cageOnTime.toTimeString().slice(0, 5));
        } else {
            setEditSessionDateInput('');
            setEditSessionTimeInput('');
            setEditSessionMessage('');
        }
    }, [isCageOn, cageOnTime]);
    
    useEffect(() => {
        const timerConditionsMet = isCageOn && !isPaused && isAuthReady && cageOnTime instanceof Date && !isNaN(cageOnTime.getTime());
        if (timerConditionsMet) {
            const initialElapsedTime = Math.max(0, Math.floor((new Date().getTime() - cageOnTime.getTime()) / 1000));
            setTimeInChastity(initialElapsedTime);
            timerInChastityRef.current = setInterval(() => { setTimeInChastity(prevTime => prevTime + 1); }, 1000);
        } else if (timerInChastityRef.current) { clearInterval(timerInChastityRef.current); }

        if (!isCageOn && isAuthReady && hasSessionEverBeenActive) {
            timerCageOffRef.current = setInterval(() => { setTimeCageOff(prev => prev + 1); }, 1000);
        } else if (timerCageOffRef.current) { clearInterval(timerCageOffRef.current); }
        
        if (isPaused && pauseStartTime instanceof Date && !isNaN(pauseStartTime.getTime())) {
            setLivePauseDuration(Math.max(0, Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000)));
            pauseDisplayTimerRef.current = setInterval(() => setLivePauseDuration(prev => prev + 1), 1000);
        } else if (pauseDisplayTimerRef.current) {
            clearInterval(pauseDisplayTimerRef.current);
            setLivePauseDuration(0);
        }
        
        return () => {
            if (timerInChastityRef.current) clearInterval(timerInChastityRef.current);
            if (timerCageOffRef.current) clearInterval(timerCageOffRef.current);
            if (pauseDisplayTimerRef.current) clearInterval(pauseDisplayTimerRef.current);
        };
    }, [isCageOn, isPaused, cageOnTime, isAuthReady, hasSessionEverBeenActive, pauseStartTime]);

    return {
        userId, googleEmail, isAuthReady, user, isLoading,
        showUserIdInSettings, setShowUserIdInSettings,
        cageOnTime, setCageOnTime, isCageOn, setIsCageOn,
        timeInChastity, setTimeInChastity, timeCageOff, setTimeCageOff,
        chastityHistory, setChastityHistory, totalChastityTime,
        totalTimeCageOff, overallTotalPauseTime, showReasonModal, setShowReasonModal,
        reasonForRemoval, setReasonForRemoval, tempEndTime, setTempEndTime,
        tempStartTime, setTempStartTime, confirmReset, setConfirmReset,
        restoreUserIdInput, setRestoreUserIdInput,
        showRestoreFromIdPrompt, setShowRestoreFromIdPrompt, restoreFromIdMessage, setRestoreFromIdMessage,
        submissivesNameInput, setSubmissivesNameInput, savedSubmissivesName,
        nameMessage, setNameMessage, sexualEventsLog, setSexualEventsLog,
        newEventDate, setNewEventDate, newEventTime, setNewEventTime,
        selectedEventTypes, setSelectedEventTypes, otherEventTypeChecked, setOtherEventTypeChecked,
        otherEventTypeDetail, setOtherEventTypeDetail, newEventNotes, setNewEventNotes,
        newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, setNewEventDurationMinutes,
        newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount,
        eventLogMessage, setEventLogMessage, isLoadingEvents,
        isPaused, setIsPaused, pauseStartTime, setPauseStartTime,
        accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession,
        showPauseReasonModal, setShowPauseReasonModal, reasonForPauseInput, setReasonForPauseInput,
        currentSessionPauseEvents, setCurrentSessionPauseEvents, livePauseDuration,
        lastPauseEndTime, setLastPauseEndTime,
        pauseCooldownMessage, setPauseCooldownMessage, showRestoreSessionPrompt, setShowRestoreSessionPrompt,
        loadedSessionData, hasSessionEverBeenActive,
        goalDurationSeconds, keyholderName,
        isKeyholderModeUnlocked, requiredKeyholderDurationSeconds,
        rewards, punishments,
        keyholderMessage, setKeyholderMessage, editSessionDateInput, setEditSessionDateInput,
        editSessionTimeInput, setEditSessionTimeInput, editSessionMessage,
        setEditSessionMessage,
        isTrackingAllowed, eventDisplayMode,
        handleSetEventDisplayMode, handleSetKeyholder, handleClearKeyholder, handleUnlockKeyholderControls,
        handleLockKeyholderControls, handleSetRequiredDuration, handleSetGoalDuration,
        handleAddReward, handleAddPunishment,
        handleUpdateCurrentCageOnTime, handleInitiatePause, handleConfirmPause,
        handleCancelPauseModal, handleResumeSession, handleToggleCage,
        handleConfirmRemoval, handleCancelRemoval, handleResetAllData,
        handleSubmissivesNameInputChange, handleSetSubmissivesName,
        handleToggleUserIdVisibility, handleEventTypeChange, handleOtherEventTypeCheckChange,
        handleLogNewEvent, handleExportTrackerCSV, handleExportEventLogCSV,
        handleExportTextReport, handleExportJSON, handleImportJSON,
        handleRestoreUserIdInputChange, handleInitiateRestoreFromId,
        handleCancelRestoreFromId, handleConfirmRestoreFromId,
        handleConfirmRestoreSession, handleDiscardAndStartNew, fetchEvents
    };
};
