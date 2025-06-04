// src/App.jsx
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
    getFirestore, doc, getDoc, setDoc, Timestamp, setLogLevel,
    collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc
} from 'firebase/firestore';

import { formatTime, formatElapsedTime, EVENT_TYPES } from './utils';
import MainNav from './components/MainNav';
import FooterNav from './components/FooterNav';

// --- Hashing Helper ---
async function generateHash(text) {
    if (!text) return null;
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error("Error generating hash:", error);
        return null;
    }
}

// Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const appIdForFirestore = typeof __app_id !== 'undefined' ? __app_id : (firebaseConfig.appId || 'default-chastity-app-id'); // eslint-disable-line no-undef

// Initialize Firebase App and Services
let firebaseApp;
let auth;
let db;
let firebaseInitializationError = null;

try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase configuration is missing or incomplete in environment variables.");
    }
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    setLogLevel('debug'); // Or 'error' in production
    console.log("Firebase initialized successfully in App.jsx");
} catch (error) {
    console.error("Error initializing Firebase in App.jsx:", error);
    firebaseInitializationError = error.message || "Unknown Firebase initialization error.";
    // Ensure auth and db are null if initialization fails
    auth = null;
    db = null;
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));


const App = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // True by default until auth and initial data load attempt
    const [currentPage, setCurrentPage] = useState('tracker');
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

    const timerInChastityRef = useRef(null);
    const timerCageOffRef = useRef(null);
    const dataLoadedForUser = useRef(null);

    useEffect(() => { /* GA Init */ if (GA_MEASUREMENT_ID) { if (typeof window.gtag === 'function') { window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false }); } else { console.warn("gtag.js not found."); } } else { console.warn("GA_MEASUREMENT_ID not set."); } }, []);
    useEffect(() => { /* GA Page View */ if (GA_MEASUREMENT_ID && typeof window.gtag === 'function' && isAuthReady && userId) { const pagePath = `/${currentPage}`; const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1').trim(); window.gtag('event', 'page_view', { page_title: pageTitle, page_path: pagePath, user_id: userId }); } }, [currentPage, isAuthReady, userId]);

    const getDocRef = useCallback((targetUserId = userId) => {
        if (!targetUserId || !db) return null; 
        return doc(db, "artifacts", appIdForFirestore, "users", targetUserId);
    }, [userId]); 

    const getEventsCollectionRef = useCallback((targetUserId = userId) => {
        if (!targetUserId || !db) return null; 
        return collection(db, "artifacts", appIdForFirestore, "users", targetUserId, "sexualEventsLog");
    }, [userId]); 

    const applyRestoredData = useCallback((data) => {
        console.log("[applyRestoredData] Applying data:", data);
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
        const cName = data.submissivesName || '';
        setSavedSubmissivesName(cName);
        setSubmissivesNameInput(cName); 

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
        
        setHasSessionEverBeenActive(data.hasSessionEverBeenActive || false); 

        setGoalDurationSeconds(data.goalDurationSeconds !== undefined ? data.goalDurationSeconds : null);
        setKeyholderName(data.keyholderName || '');
        setKeyholderPasswordHash(data.keyholderPasswordHash || null);
        setRequiredKeyholderDurationSeconds(data.requiredKeyholderDurationSeconds !== undefined ? data.requiredKeyholderDurationSeconds : null);
        setIsKeyholderModeUnlocked(false); 

        setShowRestoreSessionPrompt(false); 
        setLoadedSessionData(null); 

    }, [setHasSessionEverBeenActive]);

    useEffect(() => { 
        if (!auth) {
            console.error("Firebase Auth is not initialized in App.jsx. Cannot set up onAuthStateChanged listener.");
            setIsAuthReady(false);
            setIsLoading(false); // Stop loading if Firebase isn't even set up
            return;
        }
        console.log("[Auth Effect] Setting up onAuthStateChanged listener.");
        const unsub = onAuthStateChanged(auth, async u => {
            const currentUid = u ? u.uid : null;
            console.log(`[Auth Effect] onAuthStateChanged triggered. Current User ID: ${currentUid}, Previous App userId: ${userId}`);

            if (currentUid) { 
                if (userId !== currentUid) { 
                    console.log(`[Auth Effect] User ID changed or first sign-in. Old: ${userId}, New: ${currentUid}. Resetting dataLoadedForUser.`);
                    dataLoadedForUser.current = null; 
                }
                setUserId(currentUid);
                setIsAuthReady(true);
            } else { 
                console.log(`[Auth Effect] No user or signed out. Trying anonymous sign-in. Previous userId: ${userId}`);
                try {
                    await signInAnonymously(auth);
                    console.log("[Auth Effect] Anonymous sign-in initiated. Listener will re-evaluate.");
                } catch (error) {
                    console.error("[Auth Effect] Anonymous sign-in failed:", error);
                    setUserId(null);
                    setIsAuthReady(false); 
                    dataLoadedForUser.current = null;
                    setIsLoading(false);
                    applyRestoredData({ hasSessionEverBeenActive: false });
                    setTimeCageOff(0);
                }
            }
        });
        return () => {
            console.log("[Auth Effect] Cleaning up onAuthStateChanged listener.");
            unsub();
        };
    }, [userId, applyRestoredData]); 


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
        console.log(`[Load Initial Data Effect] Triggered. isAuthReady: ${isAuthReady}, userId: ${userId}, dataLoadedForUser: ${dataLoadedForUser.current}, firebaseInitError: ${firebaseInitializationError}`);

        if (firebaseInitializationError) {
            console.error("[Load Initial Data Effect] Firebase initialization failed. Skipping data load.");
            setIsLoading(false);
            return;
        }

        if (!isAuthReady || !userId || !db) { // Also check for db
            console.log(`[Load Initial Data Effect] Guard: Auth not ready, no userId, or DB not init. Returning. isAuthReady=${isAuthReady}, userId=${userId}, db=${!!db}`);
            if (isLoading && (!auth || !auth.currentUser)) setIsLoading(false); // If still loading but no actual firebase user
            return;
        }

        if (dataLoadedForUser.current === userId) {
            console.log(`[Load Initial Data Effect] Data already loaded for user ${userId}. Ensuring isLoading is false.`);
            if (isLoading) setIsLoading(false);
            return;
        }
        
        const docRef = getDocRef(userId);
        if (!docRef) {
            console.error("[Load Initial Data Effect] Failed to get document reference.");
            setIsLoading(false);
            return;
        }

        const loadInitialDataInternal = async () => {
            console.log(`[App.jsx loadInitialDataInternal] Attempting to load for userId: ${userId}`);
            setIsLoading(true);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("App.js: loadInitialData - Raw data from Firestore:", JSON.stringify(data, null, 2));
                    applyRestoredData(data); 

                    const activeSessionIsCageOnLoaded = data.isCageOn || false;
                    const activeSessionCageOnTimeLoaded = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null;

                    if (activeSessionIsCageOnLoaded && activeSessionCageOnTimeLoaded && !isNaN(activeSessionCageOnTimeLoaded.getTime())) {
                        console.log("App.js: loadInitialData - Active session found. Preparing restore prompt.");
                        const loadedPauseStartTimeFromData = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;
                        setLoadedSessionData({ 
                            isCageOn: true,
                            cageOnTime: activeSessionCageOnTimeLoaded,
                            timeInChastity: data.timeInChastity || 0,
                            isPaused: data.isPaused || false,
                            pauseStartTime: loadedPauseStartTimeFromData && !isNaN(loadedPauseStartTimeFromData.getTime()) ? loadedPauseStartTimeFromData : null,
                            accumulatedPauseTimeThisSession: data.accumulatedPauseTimeThisSession || 0,
                            currentSessionPauseEvents: (data.currentSessionPauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate? p.startTime.toDate() : null, endTime: p.endTime?.toDate? p.endTime.toDate() : null })),
                        });
                        setIsCageOn(true);
                        setCageOnTime(activeSessionCageOnTimeLoaded);
                        setTimeInChastity(data.timeInChastity || 0);
                        setIsPaused(true); 
                        setPauseStartTime(new Date()); 
                        setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
                        setCurrentSessionPauseEvents((data.currentSessionPauseEvents || []).map(p => ({...p, startTime: p.startTime?.toDate? p.startTime.toDate() : null, endTime: p.endTime?.toDate? p.endTime.toDate() : null})));
                        setShowRestoreSessionPrompt(true);
                        console.log("App.js: loadInitialData - Showing restore prompt. App in 'paused neutral state'.");
                    } else {
                        console.log("App.js: loadInitialData - No active/valid session in Firestore.");
                        if (!(data.hasSessionEverBeenActive || false)) {
                           setTimeCageOff(0); 
                        }
                        setLivePauseDuration(0);
                        setShowRestoreSessionPrompt(false);
                    }
                } else {
                    console.log("App.js: loadInitialData - No document found for user.");
                    applyRestoredData({ hasSessionEverBeenActive: false }); 
                    setTimeInChastity(0);
                    setTimeCageOff(0); 
                    setLivePauseDuration(0);
                    setPauseCooldownMessage('');
                }
                dataLoadedForUser.current = userId; 
            } catch (error) {
                console.error("Error loading initial tracker data:", error);
                applyRestoredData({ hasSessionEverBeenActive: false }); 
                setTimeInChastity(0);
                setTimeCageOff(0);
                setLivePauseDuration(0);
                setPauseCooldownMessage('');
                dataLoadedForUser.current = null; 
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialDataInternal();
    }, [isAuthReady, userId, getDocRef, applyRestoredData, setIsLoading, isLoading]); 


    const fetchEvents = useCallback(async (targetUserId = userId) => {
        if (!isAuthReady || !targetUserId || !db) return; // Check db
        setIsLoadingEvents(true);
        const eventsColRef = getEventsCollectionRef(targetUserId);
        if (!eventsColRef) {
            console.error("App.js: fetchEvents - Could not get event log reference.");
            setEventLogMessage("Error: Could not get event log reference.");
            setTimeout(() => setEventLogMessage(''), 3000);
            setIsLoadingEvents(false);
            return;
        }
        try {
            const q = query(eventsColRef, orderBy("eventTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedEvents = querySnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                eventTimestamp: d.data().eventTimestamp?.toDate() 
            }));
            setSexualEventsLog(fetchedEvents);
        } catch (error) {
            console.error("Error fetching sexual events:", error);
            setEventLogMessage("Failed to load sexual events.");
            setTimeout(() => setEventLogMessage(''), 3000);
        } finally {
            setIsLoadingEvents(false);
        }
    }, [isAuthReady, userId, getEventsCollectionRef, setIsLoadingEvents, setEventLogMessage]); 

    useEffect(() => { 
        if ((currentPage === 'logEvent' || currentPage === 'fullReport' || currentPage === 'feedback') && isAuthReady && userId && db) {
            fetchEvents();
        }
    }, [currentPage, isAuthReady, userId, fetchEvents]);


    const saveDataToFirestore = useCallback(async (dataToSave) => {
        if (!isAuthReady || !userId || !db) { // Check db
            console.warn("saveDataToFirestore: Auth not ready, no userId, or DB not init. Aborting save.");
            return;
        }
        const docRef = getDocRef();
        if (!docRef) {
            console.error("saveDataToFirestore: Failed to get document reference. Aborting save.");
            return;
        }

        try {
            const firestoreReadyData = { ...dataToSave };

            if (typeof firestoreReadyData.hasSessionEverBeenActive === 'undefined') {
                firestoreReadyData.hasSessionEverBeenActive = hasSessionEverBeenActive;
            }
            if (typeof firestoreReadyData.goalDurationSeconds === 'undefined') {
                firestoreReadyData.goalDurationSeconds = goalDurationSeconds;
            }
            if (typeof firestoreReadyData.keyholderName === 'undefined') {
                firestoreReadyData.keyholderName = keyholderName;
            }
            if (typeof firestoreReadyData.keyholderPasswordHash === 'undefined') {
                firestoreReadyData.keyholderPasswordHash = keyholderPasswordHash;
            }
            if (typeof firestoreReadyData.requiredKeyholderDurationSeconds === 'undefined') {
                firestoreReadyData.requiredKeyholderDurationSeconds = requiredKeyholderDurationSeconds;
            }

            const toTimestampSafe = (dateInput) => {
                if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
                    return Timestamp.fromDate(dateInput);
                }
                if (dateInput && typeof dateInput.toDate === 'function') { 
                    return dateInput;
                }
                if (typeof dateInput === 'string') {
                    const parsedDate = new Date(dateInput);
                    if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
                        return Timestamp.fromDate(parsedDate);
                    }
                }
                return null; 
            };

            firestoreReadyData.cageOnTime = toTimestampSafe(firestoreReadyData.cageOnTime);
            if (firestoreReadyData.chastityHistory) {
                firestoreReadyData.chastityHistory = firestoreReadyData.chastityHistory.map(item => ({
                    ...item,
                    startTime: toTimestampSafe(item.startTime),
                    endTime: toTimestampSafe(item.endTime),
                    pauseEvents: (item.pauseEvents || []).map(p => ({
                        ...p,
                        startTime: toTimestampSafe(p.startTime),
                        endTime: toTimestampSafe(p.endTime)
                    }))
                }));
            }
            firestoreReadyData.pauseStartTime = toTimestampSafe(firestoreReadyData.pauseStartTime);
            firestoreReadyData.lastPauseEndTime = toTimestampSafe(firestoreReadyData.lastPauseEndTime);

            if (firestoreReadyData.currentSessionPauseEvents) {
                firestoreReadyData.currentSessionPauseEvents = firestoreReadyData.currentSessionPauseEvents.map(p => ({
                    ...p,
                    startTime: toTimestampSafe(p.startTime),
                    endTime: toTimestampSafe(p.endTime)
                }));
            }
            
            if (typeof firestoreReadyData.submissivesName === 'undefined') {
                firestoreReadyData.submissivesName = savedSubmissivesName;
            }

            if (Object.prototype.hasOwnProperty.call(firestoreReadyData, 'userAlias')) {
                delete firestoreReadyData.userAlias;
            }
            
            console.log("Saving to Firestore with data:", JSON.stringify(firestoreReadyData, null, 2));
            await setDoc(docRef, firestoreReadyData, { merge: true });
            console.log("Data saved successfully to Firestore.");

        } catch (error) {
            console.error("Error saving main data to Firestore:", error);
        }
    }, [userId, getDocRef, isAuthReady, savedSubmissivesName, hasSessionEverBeenActive, goalDurationSeconds, keyholderName, keyholderPasswordHash, requiredKeyholderDurationSeconds]);


    const handleSetKeyholder = useCallback(async (name) => {
        if (!userId || !db) { setKeyholderMessage("Error: User ID not available or DB not init."); return null; }
        const khName = name.trim();
        if (!khName) { setKeyholderMessage("Keyholder name cannot be empty."); return null; }
        const stringToHash = userId + khName; 
        const hash = await generateHash(stringToHash);
        if (!hash) { setKeyholderMessage("Error generating Keyholder ID."); return null; }

        setKeyholderName(khName);
        setKeyholderPasswordHash(hash);
        setRequiredKeyholderDurationSeconds(null); 
        setIsKeyholderModeUnlocked(false); 
        await saveDataToFirestore({
            keyholderName: khName,
            keyholderPasswordHash: hash,
            requiredKeyholderDurationSeconds: null
        });
        setKeyholderMessage(`Keyholder "${khName}" set. Password preview generated.`);
        return hash.substring(0, 8).toUpperCase(); 
    }, [userId, saveDataToFirestore, setKeyholderMessage]);

    const handleClearKeyholder = useCallback(async () => {
        if (!db) {setKeyholderMessage("DB not init."); return;}
        setKeyholderName('');
        setKeyholderPasswordHash(null);
        setRequiredKeyholderDurationSeconds(null);
        setIsKeyholderModeUnlocked(false);
        await saveDataToFirestore({
            keyholderName: '',
            keyholderPasswordHash: null,
            requiredKeyholderDurationSeconds: null
        });
        setKeyholderMessage("Keyholder data cleared.");
    }, [saveDataToFirestore, setKeyholderMessage]);

    const handleUnlockKeyholderControls = useCallback(async (enteredPasswordPreview) => {
        if (!userId || !keyholderName || !keyholderPasswordHash) {
            setKeyholderMessage("Keyholder not fully set up.");
            return false;
        }
        const expectedPreview = keyholderPasswordHash.substring(0, 8).toUpperCase();
        if (enteredPasswordPreview.toUpperCase() === expectedPreview) {
            setIsKeyholderModeUnlocked(true);
            setKeyholderMessage("Keyholder controls unlocked.");
            return true;
        } else {
            setIsKeyholderModeUnlocked(false);
            setKeyholderMessage("Incorrect Keyholder password.");
            return false;
        }
    }, [userId, keyholderName, keyholderPasswordHash, setKeyholderMessage]);

    const handleLockKeyholderControls = useCallback(() => {
        setIsKeyholderModeUnlocked(false);
        setKeyholderMessage("Keyholder controls locked.");
    }, [setKeyholderMessage]);

    const handleSetRequiredDuration = useCallback(async (durationInSeconds) => {
        if (!db) {setKeyholderMessage("DB not init."); return false;}
        const newDuration = Number(durationInSeconds);
        if (!isNaN(newDuration) && newDuration >= 0) {
            setRequiredKeyholderDurationSeconds(newDuration > 0 ? newDuration : null); 
            await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration > 0 ? newDuration : null });
            setKeyholderMessage(newDuration > 0 ? "Required duration updated." : "Required duration cleared.");
            return true;
        }
        setKeyholderMessage("Invalid duration value.");
        return false;
    }, [saveDataToFirestore, setKeyholderMessage]);

    const handleSetGoalDuration = useCallback(async (newDurationInSeconds) => {
        if (!db) return false;
        const newDuration = newDurationInSeconds === null ? null : Number(newDurationInSeconds);
        if (newDuration === null || (!isNaN(newDuration) && newDuration >= 0)) {
            setGoalDurationSeconds(newDuration);
            await saveDataToFirestore({ goalDurationSeconds: newDuration }); 
            return true;
        }
        return false;
    }, [saveDataToFirestore, setGoalDurationSeconds]);


    useEffect(() => {
        const timerConditionsMet = isCageOn && !isPaused && isAuthReady && cageOnTime instanceof Date && !isNaN(cageOnTime.getTime());
        // console.log('[App.jsx Timer useEffect Check]', { isCageOn, isPaused, isAuthReady, cageOnTime: cageOnTime ? cageOnTime.toISOString() : null, isValidDate: cageOnTime instanceof Date && !isNaN(cageOnTime.getTime()), timerConditionsMet });

        if (timerConditionsMet) {
            // console.log(`[App.jsx Timer] Started/Resumed. Current timeInChastity from state: ${timeInChastity}`);
            timerInChastityRef.current = setInterval(() => {
                setTimeInChastity(prevTime => prevTime + 1);
            }, 1000);
        } else if (timerInChastityRef.current) {
            // console.log('[App.jsx Timer] Cleared interval because conditions no longer met.');
            clearInterval(timerInChastityRef.current);
        }
        return () => {
            if (timerInChastityRef.current) {
                // console.log('[App.jsx Timer] Chastity timer cleanup: Cleared interval.');
                clearInterval(timerInChastityRef.current);
            }
        };
    }, [isCageOn, isPaused, cageOnTime, isAuthReady, timeInChastity]); 

    useEffect(() => {
        if (!isCageOn && isAuthReady && hasSessionEverBeenActive) {
            // console.log('[App.jsx timeCageOff Timer] Starting. Conditions:', { isCageOn, isAuthReady, hasSessionEverBeenActive });
            timerCageOffRef.current = setInterval(() => {
                setTimeCageOff(prev => prev + 1);
            }, 1000);
        } else if (timerCageOffRef.current) {
            // console.log('[App.jsx timeCageOff Timer] Clearing.');
            clearInterval(timerCageOffRef.current);
        }
        return () => {
            if (timerCageOffRef.current) {
                // console.log('[App.jsx timeCageOff Timer] Cleanup clearing.');
                clearInterval(timerCageOffRef.current);
            }
        };
    }, [isCageOn, isAuthReady, hasSessionEverBeenActive]);


    useEffect(() => {
        if (isPaused && pauseStartTime instanceof Date && !isNaN(pauseStartTime.getTime())) {
            setLivePauseDuration(Math.max(0, Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000)));
            pauseDisplayTimerRef.current = setInterval(() => {
                setLivePauseDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (pauseDisplayTimerRef.current) clearInterval(pauseDisplayTimerRef.current);
            setLivePauseDuration(0); 
        }
        return () => {
            if (pauseDisplayTimerRef.current) clearInterval(pauseDisplayTimerRef.current);
        };
    }, [isPaused, pauseStartTime]);

    const handleInitiatePause = useCallback(() => {
        setPauseCooldownMessage(''); 
        if (lastPauseEndTime instanceof Date && !isNaN(lastPauseEndTime.getTime())) {
            const twelveHoursInMillis = 12 * 3600 * 1000;
            const timeSinceLastPauseEnd = new Date().getTime() - lastPauseEndTime.getTime();
            if (timeSinceLastPauseEnd < twelveHoursInMillis) {
                const remainingTime = twelveHoursInMillis - timeSinceLastPauseEnd;
                const hours = Math.floor(remainingTime / 3600000);
                const minutes = Math.floor((remainingTime % 3600000) / 60000);
                setPauseCooldownMessage(`You can pause again in approximately ${hours}h ${minutes}m.`);
                setTimeout(() => setPauseCooldownMessage(''), 5000);
                return;
            }
        }
        setShowPauseReasonModal(true);
    }, [lastPauseEndTime]);

    const handleConfirmPause = useCallback(async () => {
        if (!isCageOn || !db) { 
            setShowPauseReasonModal(false);
            setReasonForPauseInput('');
            return;
        }
        const now = new Date();
        const newPauseEvent = {
            id: crypto.randomUUID(), 
            startTime: now,
            reason: reasonForPauseInput.trim() || "N/A",
            endTime: null, 
            duration: null  
        };

        setIsPaused(true);
        setPauseStartTime(now); 
        const updatedSessionPauses = [...currentSessionPauseEvents, newPauseEvent];
        setCurrentSessionPauseEvents(updatedSessionPauses);

        setShowPauseReasonModal(false);
        setReasonForPauseInput('');

        await saveDataToFirestore({
            isPaused: true,
            pauseStartTime: now,
            currentSessionPauseEvents: updatedSessionPauses,
        });
    }, [isCageOn, reasonForPauseInput, currentSessionPauseEvents, saveDataToFirestore]); 

    const handleCancelPauseModal = useCallback(() => {
        setShowPauseReasonModal(false);
        setReasonForPauseInput('');
    }, []);

    const handleResumeSession = useCallback(async () => {
        if (!isPaused || !(pauseStartTime instanceof Date) || isNaN(pauseStartTime.getTime()) || !db) {
            setIsPaused(false);
            setPauseStartTime(null);
            setLivePauseDuration(0);
            return;
        }

        const endTime = new Date();
        const currentPauseDuration = Math.max(0, Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000));
        const newAccumulatedPauseTime = accumulatedPauseTimeThisSession + currentPauseDuration;

        const updatedSessionPauses = currentSessionPauseEvents.map((event, index) => {
            if (index === currentSessionPauseEvents.length - 1 && !event.endTime) { 
                return { ...event, endTime: endTime, duration: currentPauseDuration };
            }
            return event;
        });

        setAccumulatedPauseTimeThisSession(newAccumulatedPauseTime);
        setIsPaused(false);
        setPauseStartTime(null); 
        setCurrentSessionPauseEvents(updatedSessionPauses);
        setLivePauseDuration(0); 
        setLastPauseEndTime(endTime); 

        await saveDataToFirestore({
            isPaused: false,
            pauseStartTime: null,
            accumulatedPauseTimeThisSession: newAccumulatedPauseTime,
            currentSessionPauseEvents: updatedSessionPauses,
            lastPauseEndTime: endTime
        });
    }, [isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore]);


    const handleToggleCage = useCallback(() => {
        // console.log('[App.jsx handleToggleCage Called]', { isAuthReady, isPausedCurrent: isPaused, isCageOnCurrent: isCageOn, confirmReset });
        if (!isAuthReady || isPaused || !db) { 
            // console.log('[App.jsx handleToggleCage] Aborted: Auth not ready, session paused, or DB not init.');
            return;
        }

        const currentTime = new Date();

        if (confirmReset) { 
            setConfirmReset(false);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        }

        if (!isCageOn) { 
            const newTotalOffTime = totalTimeCageOff + timeCageOff; 
            setTotalTimeCageOff(newTotalOffTime);

            setCageOnTime(currentTime);
            setIsCageOn(true);
            setTimeInChastity(0); 
            setTimeCageOff(0);    

            setAccumulatedPauseTimeThisSession(0);
            setCurrentSessionPauseEvents([]);
            setHasSessionEverBeenActive(true); 

            // console.log('[App.jsx handleToggleCage] Starting new session. CageOnTime:', currentTime.toISOString());
            saveDataToFirestore({
                isCageOn: true,
                cageOnTime: currentTime,
                totalTimeCageOff: newTotalOffTime, 
                timeInChastity: 0, 
                isPaused: false, 
                pauseStartTime: null,
                accumulatedPauseTimeThisSession: 0,
                currentSessionPauseEvents: [],
                hasSessionEverBeenActive: true, 
            });

        } else { 
            // console.log('[App.jsx handleToggleCage] Ending session. Current cageOnTime:', cageOnTime ? cageOnTime.toISOString() : null);
            setTempEndTime(currentTime); 
            setTempStartTime(cageOnTime);  
            // console.log('[App.jsx handleToggleCage] Calling setShowReasonModal(true)');
            setShowReasonModal(true); 
        }
    }, [
        isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime,
        saveDataToFirestore, 
        setHasSessionEverBeenActive, resetTimeoutRef 
    ]);

    const handleConfirmRemoval = useCallback(async () => {
        if (!isAuthReady || !(tempStartTime instanceof Date) || !(tempEndTime instanceof Date) || isNaN(tempStartTime.getTime()) || isNaN(tempEndTime.getTime()) || !db) {
            setShowReasonModal(false);
            setReasonForRemoval(''); 
            setTempEndTime(null);   
            setTempStartTime(null);
            return;
        }

        let finalAccumulatedPauseTime = accumulatedPauseTimeThisSession;
        let finalPauseEventsForHistory = currentSessionPauseEvents;

        if (isPaused && pauseStartTime instanceof Date && !isNaN(pauseStartTime.getTime())) {
            const finalPauseDuration = Math.max(0, Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000));
            finalAccumulatedPauseTime += finalPauseDuration;
            finalPauseEventsForHistory = currentSessionPauseEvents.map((event, index) =>
                (index === currentSessionPauseEvents.length - 1 && !event.endTime) 
                    ? { ...event, endTime: tempEndTime, duration: finalPauseDuration }
                    : event
            );
        }

        const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));
        const sessionEffectiveDuration = Math.max(0, rawDurationSeconds - finalAccumulatedPauseTime);

        const currentSessionGoalDuration = goalDurationSeconds; 
        let goalStatusForHistory = "N/A";
        let goalTimeDifferenceForHistory = null; 

        if (currentSessionGoalDuration !== null && currentSessionGoalDuration > 0) {
            if (sessionEffectiveDuration >= currentSessionGoalDuration) {
                goalStatusForHistory = "Met";
            } else {
                goalStatusForHistory = "Not Met";
            }
            goalTimeDifferenceForHistory = currentSessionGoalDuration - sessionEffectiveDuration;
        }

        const newHistoryEntry = {
            id: crypto.randomUUID(),
            periodNumber: chastityHistory.length + 1,
            startTime: tempStartTime,
            endTime: tempEndTime,
            duration: rawDurationSeconds, 
            reasonForRemoval: reasonForRemoval.trim() || 'N/A',
            totalPauseDurationSeconds: finalAccumulatedPauseTime, 
            pauseEvents: finalPauseEventsForHistory, 
            goalDurationAtSessionStart: currentSessionGoalDuration, 
            goalStatus: goalStatusForHistory,
            goalTimeDifference: goalTimeDifferenceForHistory,
        };

        const updatedHistoryState = [...chastityHistory, newHistoryEntry];
        setChastityHistory(updatedHistoryState); 

        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0); 
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
        setHasSessionEverBeenActive(true); 

        await saveDataToFirestore({
            isCageOn: false, cageOnTime: null, timeInChastity: 0,
            chastityHistory: updatedHistoryState, 
            isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
            hasSessionEverBeenActive: true,
        });

        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);

    }, [
        isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents,
        isPaused, pauseStartTime, chastityHistory, reasonForRemoval, saveDataToFirestore,
        goalDurationSeconds, 
        setHasSessionEverBeenActive 
    ]);

    const handleCancelRemoval = useCallback(() => {
        setReasonForRemoval('');
        setTempEndTime(null);
        setTempStartTime(null);
        setShowReasonModal(false);
    }, []);


    const clearAllEvents = useCallback(async () => {
        if (!isAuthReady || !userId || !db) return;
        const eventsColRef = getEventsCollectionRef();
        if (!eventsColRef) {
            console.error("App.js: clearAllEvents - Could not get event log reference.");
            return;
        }
        try {
            const q = query(eventsColRef); 
            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(db, eventsColRef.path, docSnapshot.id)) 
            );
            await Promise.all(deletePromises);
            setSexualEventsLog([]); 
            console.log("App.js: clearAllEvents - All sexual events cleared from Firestore and local state.");
        } catch (error) {
            console.error("App.js: clearAllEvents - Error clearing events:", error);
        }
    }, [isAuthReady, userId, getEventsCollectionRef]); 

    const handleResetAllData = useCallback(() => {
        if (!isAuthReady || !db) return;
        if (confirmReset) {
            if (timerInChastityRef.current) clearInterval(timerInChastityRef.current);
            if (timerCageOffRef.current) clearInterval(timerCageOffRef.current);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

            setCageOnTime(null);
            setIsCageOn(false);
            setTimeInChastity(0);
            setTimeCageOff(0);
            setChastityHistory([]);
            setSavedSubmissivesName('');
            setSubmissivesNameInput(''); 
            setIsPaused(false);
            setPauseStartTime(null);
            setAccumulatedPauseTimeThisSession(0);
            setCurrentSessionPauseEvents([]);
            setLastPauseEndTime(null);
            setPauseCooldownMessage('');
            setLivePauseDuration(0);
            setHasSessionEverBeenActive(false); 
            setGoalDurationSeconds(null);
            setKeyholderName('');
            setKeyholderPasswordHash(null);
            setRequiredKeyholderDurationSeconds(null);
            setIsKeyholderModeUnlocked(false);
            setKeyholderMessage('');
            setConfirmReset(false); 
            setShowReasonModal(false); 

            saveDataToFirestore({
                cageOnTime: null, isCageOn: false, timeInChastity: 0,
                chastityHistory: [],
                totalChastityTime: 0, totalTimeCageOff: 0,
                submissivesName: '',
                isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
                lastPauseEndTime: null,
                hasSessionEverBeenActive: false, 
                goalDurationSeconds: null, 
                keyholderName: '', keyholderPasswordHash: null, requiredKeyholderDurationSeconds: null, 
            });

            clearAllEvents(); 

            setNameMessage("All data has been reset.");
            setTimeout(() => setNameMessage(''), 4000);
            setCurrentPage('tracker'); 

        } else {
            setConfirmReset(true);
            resetTimeoutRef.current = setTimeout(() => {
                setConfirmReset(false); 
            }, 3000);
        }
    }, [isAuthReady, confirmReset, saveDataToFirestore, clearAllEvents, setCurrentPage, setNameMessage, setConfirmReset, resetTimeoutRef, setHasSessionEverBeenActive]);


    const handleSubmissivesNameInputChange = useCallback((event) => {
        setSubmissivesNameInput(event.target.value);
    }, []);

    const handleSetSubmissivesName = useCallback(async () => {
        if (!isAuthReady || !userId || !db) {
            setNameMessage("Authentication error or DB not init. Cannot set name.");
            setTimeout(() => setNameMessage(''), 3000);
            return;
        }
        if (savedSubmissivesName) { 
            setNameMessage("Submissive's name is already set. To change, please reset data (or implement an edit feature).");
            setTimeout(() => setNameMessage(''), 4000);
            return;
        }
        const trimmedName = submissivesNameInput.trim();
        if (!trimmedName) {
            setNameMessage("Submissive's name cannot be empty.");
            setTimeout(() => setNameMessage(''), 3000);
            return;
        }
        setSavedSubmissivesName(trimmedName);
        await saveDataToFirestore({ submissivesName: trimmedName });
        setNameMessage("Submissive's name set successfully!");
        setTimeout(() => setNameMessage(''), 3000);
    }, [isAuthReady, userId, savedSubmissivesName, submissivesNameInput, saveDataToFirestore]);

    const handleToggleUserIdVisibility = useCallback(() => {
        setShowUserIdInSettings(prev => !prev);
    }, []);


    const handleEventTypeChange = useCallback((type) => {
        setSelectedEventTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    }, []);

    const handleOtherEventTypeCheckChange = useCallback((e) => {
        setOtherEventTypeChecked(e.target.checked);
        if (!e.target.checked) {
            setOtherEventTypeDetail(''); 
        }
    }, []);

    const handleLogNewEvent = useCallback(async (e) => {
        e.preventDefault(); 
        if (!isAuthReady || !userId || !db) {
            setEventLogMessage("Authentication error or DB not init. Cannot log event.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }

        const finalEventTypes = [...selectedEventTypes];
        let finalOtherDetail = null;
        if (otherEventTypeChecked && otherEventTypeDetail.trim()) {
            finalOtherDetail = otherEventTypeDetail.trim();
        }

        if (finalEventTypes.length === 0 && !finalOtherDetail) {
            setEventLogMessage("Please select at least one event type or specify 'Other' details.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }

        const eventsColRef = getEventsCollectionRef();
        if (!eventsColRef) {
            setEventLogMessage("Error: Could not get event log reference.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }

        const dateTimeString = `${newEventDate}T${newEventTime}`;
        const eventTimestamp = new Date(dateTimeString);
        if (isNaN(eventTimestamp.getTime())) {
            setEventLogMessage("Invalid date or time provided.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }

        const durationHoursNum = parseInt(newEventDurationHours, 10) || 0;
        const durationMinutesNum = parseInt(newEventDurationMinutes, 10) || 0;
        const durationSeconds = (durationHoursNum * 3600) + (durationMinutesNum * 60);

        const selfOrgasmAmountNum = selectedEventTypes.includes("Orgasm (Self)") && newEventSelfOrgasmAmount
            ? (parseInt(newEventSelfOrgasmAmount, 10) || null) 
            : null;
        const partnerOrgasmAmountNum = selectedEventTypes.includes("Orgasm (Partner)") && newEventPartnerOrgasmAmount
            ? (parseInt(newEventPartnerOrgasmAmount, 10) || null)
            : null;

        const newEventData = {
            eventTimestamp: Timestamp.fromDate(eventTimestamp), 
            loggedAt: serverTimestamp(), 
            types: finalEventTypes,
            otherTypeDetail: finalOtherDetail,
            notes: newEventNotes.trim(),
            durationSeconds: durationSeconds > 0 ? durationSeconds : null, 
            selfOrgasmAmount: selfOrgasmAmountNum,
            partnerOrgasmAmount: partnerOrgasmAmountNum,
        };

        try {
            await addDoc(eventsColRef, newEventData);
            setEventLogMessage("Event logged successfully!");
            setNewEventDate(new Date().toISOString().slice(0, 10));
            setNewEventTime(new Date().toTimeString().slice(0,5));
            setSelectedEventTypes([]);
            setOtherEventTypeChecked(false);
            setOtherEventTypeDetail('');
            setNewEventNotes('');
            setNewEventDurationHours('');
            setNewEventDurationMinutes('');
            setNewEventSelfOrgasmAmount('');
            setNewEventPartnerOrgasmAmount('');
            fetchEvents(); 
        } catch (error) {
            console.error("App.js: handleLogNewEvent - Error logging event:", error);
            setEventLogMessage("Failed to log event. See console for details.");
        }
        setTimeout(() => setEventLogMessage(''), 3000); 
    }, [
        isAuthReady, userId, selectedEventTypes, otherEventTypeChecked, otherEventTypeDetail,
        newEventDate, newEventTime, newEventDurationHours, newEventDurationMinutes,
        newEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, newEventNotes,
        getEventsCollectionRef, fetchEvents 
    ]);


    const handleExportTrackerCSV = useCallback(() => {
        if (!isAuthReady || chastityHistory.length === 0) {
            setEventLogMessage("No tracker history to export.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }
        let csvContent = "Period #,Start Time,End Time,Raw Duration,Total Pause Duration,Effective Chastity Duration,Reason for Removal,Goal Set,Goal Status,Goal Difference,Pause Events\n";
        chastityHistory.forEach(p => {
            const rawDurationFormatted = formatElapsedTime(p.duration || 0);
            const pauseDurationFormatted = formatElapsedTime(p.totalPauseDurationSeconds || 0);
            const effectiveDuration = Math.max(0, (p.duration || 0) - (p.totalPauseDurationSeconds || 0));
            const effectiveDurationFormatted = formatElapsedTime(effectiveDuration);
            const reason = (p.reasonForRemoval || '').replace(/"/g, '""'); 

            const goalSetFormatted = p.goalDurationAtSessionStart ? formatElapsedTime(p.goalDurationAtSessionStart) : 'N/A';
            const goalStatusFormatted = p.goalStatus || 'N/A';
            let goalDiffFormatted = 'N/A';
            if (p.goalTimeDifference !== null) {
                goalDiffFormatted = `${p.goalTimeDifference >= 0 ? 'Short by' : 'Exceeded by'} ${formatElapsedTime(Math.abs(p.goalTimeDifference))}`;
            }

            let pauseEventsString = (p.pauseEvents || [])
                .map(pe => `[Start: ${formatTime(pe.startTime, true, true)}; End: ${formatTime(pe.endTime, true, true)}; Duration: ${formatElapsedTime(pe.duration || 0)}; Reason: ${(pe.reason || 'N/A').replace(/"/g, '""')}]`)
                .join('; ');
            pauseEventsString = `"${pauseEventsString}"`; 

            csvContent += `${p.periodNumber},"${formatTime(p.startTime, true, true)}","${formatTime(p.endTime, true, true)}",${rawDurationFormatted},${pauseDurationFormatted},${effectiveDurationFormatted},"${reason}","${goalSetFormatted}","${goalStatusFormatted}","${goalDiffFormatted}",${pauseEventsString}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "chastity_tracker_history.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        setEventLogMessage("Tracker history CSV exported!");
        setTimeout(() => setEventLogMessage(''), 3000);
    }, [isAuthReady, chastityHistory, setEventLogMessage]);

    const handleExportEventLogCSV = useCallback(() => {
        if (!isAuthReady || sexualEventsLog.length === 0) {
            setEventLogMessage("No sexual events to export.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }
        let csvContent = "Event Timestamp,Logged At,Type(s),Other Type Detail,Notes,Duration (s),Self Orgasm Count,Partner Orgasm Count\n";
        sexualEventsLog.slice().reverse().forEach(ev => { 
            const typesString = `"${(ev.types || []).join('; ')}"`; 
            const otherDetailString = `"${(ev.otherTypeDetail || '').replace(/"/g, '""')}"`;
            const notesString = `"${(ev.notes || '').replace(/"/g, '""')}"`;
            csvContent += `"${formatTime(ev.eventTimestamp, true, true)}","${formatTime(ev.loggedAt, true, true)}",${typesString},${otherDetailString},${notesString},${ev.durationSeconds || ''},${ev.selfOrgasmAmount || ''},${ev.partnerOrgasmAmount || ''}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "sexual_events_log.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        setEventLogMessage("Sexual events log CSV exported!");
        setTimeout(() => setEventLogMessage(''), 3000);
    }, [isAuthReady, sexualEventsLog, setEventLogMessage]);

    const handleExportTextReport = useCallback(() => {
        if(!isAuthReady){setEventLogMessage("Auth error.");setTimeout(()=>setEventLogMessage(''),3000);return;}
        let r=`ChastityOS Report - Generated: ${formatTime(new Date(),true,true)}\n`;
        r+=`-------------------------------------\n`;
        r+=`User Alias: ${savedSubmissivesName||'Not Set'}\n`;
        if(userId) r+=`User ID: ${userId}\n`;
        if(keyholderName) r+=`Keyholder: ${keyholderName}\n`;
        r+=`-------------------------------------\n\n`;

        r+=`CURRENT STATUS:\n`;
        r+=`Cage Status: ${isCageOn ? (isPaused ? 'ON (Session PAUSED)' : 'ON') : 'OFF'}\n`;
        if(isCageOn && cageOnTime){
            let currentEffectiveSessionTime = timeInChastity - accumulatedPauseTimeThisSession;
            if (isPaused && pauseStartTime) { 
                currentEffectiveSessionTime -= livePauseDuration;
            }
            currentEffectiveSessionTime = Math.max(0, currentEffectiveSessionTime);

            r+=`Current Session Started: ${formatTime(cageOnTime,true,true)}\n`;
            r+=`Effective Time This Session: ${formatElapsedTime(currentEffectiveSessionTime)}\n`;
            
            if(isPaused && pauseStartTime){
                r+=`Currently Paused For: ${formatElapsedTime(livePauseDuration)}\n`;
            }
            const totalPausedThisSessionDisplay = accumulatedPauseTimeThisSession + (isPaused && pauseStartTime ? livePauseDuration : 0);
            if(totalPausedThisSessionDisplay > 0) {
                r+=`Total Paused This Session (incl. current if paused): ${formatElapsedTime(totalPausedThisSessionDisplay)}\n`;
            }
        } else {
            r+=`Current Time Cage Off: ${formatElapsedTime(timeCageOff)}\n`;
        }
        r+=`\n`;

        const activeGoalSecsReport = requiredKeyholderDurationSeconds !== null && requiredKeyholderDurationSeconds > 0 && keyholderName
                              ? requiredKeyholderDurationSeconds
                              : (goalDurationSeconds !== null && goalDurationSeconds > 0 ? goalDurationSeconds : null);
        const goalTypeReport = requiredKeyholderDurationSeconds !== null && requiredKeyholderDurationSeconds > 0 && keyholderName
                              ? "Keyholder Required" : "Personal Goal";

        if (activeGoalSecsReport !== null) {
            r += `ACTIVE GOAL (${goalTypeReport}): ${formatElapsedTime(activeGoalSecsReport)}\n`;
            if (isCageOn) {
                let currentEffectiveSessionTimeForGoal = timeInChastity - accumulatedPauseTimeThisSession;
                currentEffectiveSessionTimeForGoal = Math.max(0, currentEffectiveSessionTimeForGoal);

                const timeRemaining = activeGoalSecsReport - currentEffectiveSessionTimeForGoal;
                if (timeRemaining <= 0) {
                    r += `Status: Goal Met! (Exceeded by ${formatElapsedTime(Math.abs(timeRemaining))})\n`;
                } else {
                    r += `Status: In Progress. Time Remaining: ${formatElapsedTime(timeRemaining)}\n`;
                }
                if (isPaused) r += `(Goal countdown effectively paused as session is paused)\n`;
            } else {
                r += `Status: Not active (cage is off).\n`;
            }
            r += `\n`;
        }

        r+=`OVERALL TOTALS:\n`;
        r+=`Total Effective Chastity Time: ${formatElapsedTime(totalChastityTime)}\n`; 
        r+=`Total Time Cage Off: ${formatElapsedTime(totalTimeCageOff)}\n`; 
        r+=`Overall Total Paused Time (in completed sessions): ${formatElapsedTime(overallTotalPauseTime)}\n`;
        r+=`-------------------------------------\n\n`;

        r+=`CHASTITY HISTORY (Most Recent First):\n`;
        if(chastityHistory.length>0){
            chastityHistory.slice().reverse().forEach(p=>{
                r+=`-------------------------------------\n`;
                r+=`Period #${p.periodNumber}:\n`;
                r+=`  Start: ${formatTime(p.startTime,true,true)}\n`;
                r+=`  End:   ${formatTime(p.endTime,true,true)}\n`;
                const sessionRawDuration = p.duration || 0;
                const sessionPauseDuration = p.totalPauseDurationSeconds || 0;
                const sessionEffectiveChastity = Math.max(0, sessionRawDuration - sessionPauseDuration);
                r+=`  Raw Duration: ${formatElapsedTime(sessionRawDuration)}\n`;
                r+=`  Paused Duration: ${formatElapsedTime(sessionPauseDuration)}\n`;
                r+=`  Effective Chastity: ${formatElapsedTime(sessionEffectiveChastity)}\n`;
                r+=`  Reason for Removal: ${p.reasonForRemoval||'N/A'}\n`;

                if (p.goalDurationAtSessionStart !== null && p.goalDurationAtSessionStart > 0) {
                    r+=`  Goal for Session: ${formatElapsedTime(p.goalDurationAtSessionStart)}\n`;
                    r+=`  Goal Status: ${p.goalStatus}\n`; 
                    if (p.goalTimeDifference !== null) {
                        if (p.goalStatus === "Met") {
                            r+=`  Progress: Exceeded by ${formatElapsedTime(Math.abs(p.goalTimeDifference))}\n`;
                        } else if (p.goalStatus === "Not Met") {
                            r+=`  Progress: Short by ${formatElapsedTime(p.goalTimeDifference)}\n`;
                        }
                    }
                } else {
                    r+=`  Goal for Session: N/A\n`;
                }

                if(p.pauseEvents && p.pauseEvents.length > 0){
                    r+=`  Pause Events During Session:\n`;
                    p.pauseEvents.forEach(pe => {
                        r+=`    - Paused: ${formatTime(pe.startTime,true,true)} to ${formatTime(pe.endTime,true,true)}\n`;
                        r+=`      Duration: ${formatElapsedTime(pe.duration||0)}\n`;
                        r+=`      Reason: ${pe.reason||'N/A'}\n`;
                    });
                }
                r+=`\n`;
            });
        } else {
            r+="No chastity history recorded.\n\n";
        }
        r+=`-------------------------------------\n\n`;

        r+=`SEXUAL EVENTS LOG (Most Recent First):\n`;
        if(sexualEventsLog.length>0){
            sexualEventsLog.forEach(ev=>{ 
                let typeStrings = (ev.types||[]).map(t => {
                    if(t === "Orgasm (Self)" && savedSubmissivesName) return `Orgasm (${savedSubmissivesName})`;
                    if(t === "Orgasm (Partner)" && keyholderName) return `Orgasm (${keyholderName})`;
                    return t;
                }).join(', ');
                if(ev.otherTypeDetail) typeStrings += (typeStrings ? ', ' : '') + `Other: ${ev.otherTypeDetail}`;

                let orgasmCounts = [];
                if(ev.selfOrgasmAmount) orgasmCounts.push(`${savedSubmissivesName || 'Self'}: ${ev.selfOrgasmAmount}`);
                if(ev.partnerOrgasmAmount) orgasmCounts.push(`${keyholderName || 'Partner'}: ${ev.partnerOrgasmAmount}`);

                r+=`-------------------------------------\n`;
                r+=`Date: ${formatTime(ev.eventTimestamp,true,true)}\n`;
                r+=`  Type(s): ${typeStrings || 'N/A'}\n`;
                r+=`  Duration: ${ev.durationSeconds ? formatElapsedTime(ev.durationSeconds) : 'N/A'}\n`;
                r+=`  Orgasm Count(s): ${orgasmCounts.join(', ') || 'N/A'}\n`;
                r+=`  Notes: ${ev.notes||'N/A'}\n`;
                r+=`\n`;
            });
        } else {
            r+="No sexual events logged.\n\n";
        }
        r+=`-------------------------------------\nEnd of Report`;

        const blob = new Blob([r],{type:'text/plain;charset=utf-8'});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const filenameTime = new Date().toISOString().slice(0,19).replace(/:/g,'-').replace('T','_');
        link.download = `ChastityOS_Report_${filenameTime}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setEventLogMessage("Full text report exported!");
        setTimeout(()=>setEventLogMessage(''),3000);
    },[
        isAuthReady, savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff,
        totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, overallTotalPauseTime,
        isPaused, accumulatedPauseTimeThisSession, livePauseDuration, pauseStartTime,
        keyholderName, requiredKeyholderDurationSeconds, goalDurationSeconds,
        setEventLogMessage
    ]);


    const handleRestoreUserIdInputChange = (event) => {
        setRestoreUserIdInput(event.target.value);
    };

    const handleInitiateRestoreFromId = () => {
        if (!restoreUserIdInput.trim()) {
            setRestoreFromIdMessage("Please enter a User ID to restore from.");
            setTimeout(() => setRestoreFromIdMessage(''), 3000);
            return;
        }
        setShowRestoreFromIdPrompt(true); 
    };
    const handleCancelRestoreFromId = () => {
        setShowRestoreFromIdPrompt(false);
        setRestoreFromIdMessage(''); 
    };

    const handleConfirmRestoreFromId = async () => {
        if (!restoreUserIdInput.trim() || !userId || !db) { 
            setRestoreFromIdMessage("Invalid input, current user session error, or DB not init.");
            setTimeout(() => setRestoreFromIdMessage(''), 3000);
            setShowRestoreFromIdPrompt(false);
            return;
        }

        const targetUserIdToRestoreFrom = restoreUserIdInput.trim();
        const targetDocRef = doc(db, "artifacts", appIdForFirestore, "users", targetUserIdToRestoreFrom); 

        try {
            const docSnap = await getDoc(targetDocRef);
            if (docSnap.exists()) {
                const dataToRestore = docSnap.data();
                console.log("Restoring data from Firestore:", JSON.stringify(dataToRestore, null, 2));
                applyRestoredData(dataToRestore);
                await saveDataToFirestore({
                    ...dataToRestore, 
                    hasSessionEverBeenActive: dataToRestore.hasSessionEverBeenActive !== undefined ? dataToRestore.hasSessionEverBeenActive : true,
                });

                setRestoreFromIdMessage("Data restored and saved successfully for the current user!");
                setRestoreUserIdInput(''); 
                setCurrentPage('tracker'); 
                if (isAuthReady && userId) {
                    fetchEvents(userId);
                }

            } else {
                setRestoreFromIdMessage("No data found for the provided User ID.");
            }
        } catch (error) {
            console.error("Error restoring data from User ID:", error);
            setRestoreFromIdMessage("Error during data restoration. See console for details.");
        }
        setShowRestoreFromIdPrompt(false); 
        setTimeout(() => setRestoreFromIdMessage(''), 4000); 
    };


    const handleConfirmRestoreSession = useCallback(async () => {
        if (loadedSessionData && db) { // Check db
            const cageOnT = loadedSessionData.cageOnTime instanceof Timestamp
                ? loadedSessionData.cageOnTime.toDate()
                : new Date(loadedSessionData.cageOnTime);

            const pauseStartT = loadedSessionData.pauseStartTime instanceof Timestamp
                ? loadedSessionData.pauseStartTime.toDate()
                : (loadedSessionData.pauseStartTime ? new Date(loadedSessionData.pauseStartTime) : null);

            setIsCageOn(loadedSessionData.isCageOn);
            setCageOnTime(cageOnT && !isNaN(cageOnT.getTime()) ? cageOnT : null);
            setTimeInChastity(loadedSessionData.timeInChastity || 0);
            setIsPaused(loadedSessionData.isPaused || false);
            setPauseStartTime((loadedSessionData.isPaused && pauseStartT && !isNaN(pauseStartT.getTime())) ? pauseStartT : null);
            setAccumulatedPauseTimeThisSession(loadedSessionData.accumulatedPauseTimeThisSession || 0);
            setCurrentSessionPauseEvents((loadedSessionData.currentSessionPauseEvents || []).map(p => ({
                ...p,
                startTime: p.startTime?.toDate? p.startTime.toDate():null,
                endTime: p.endTime?.toDate? p.endTime.toDate():null
            })));
            
            setHasSessionEverBeenActive(true); 

            await saveDataToFirestore({
                isCageOn: loadedSessionData.isCageOn,
                cageOnTime: cageOnT && !isNaN(cageOnT.getTime()) ? cageOnT : null,
                timeInChastity: loadedSessionData.timeInChastity || 0,
                isPaused: loadedSessionData.isPaused || false,
                pauseStartTime: (loadedSessionData.isPaused && pauseStartT && !isNaN(pauseStartT.getTime())) ? pauseStartT : null,
                accumulatedPauseTimeThisSession: loadedSessionData.accumulatedPauseTimeThisSession || 0,
                currentSessionPauseEvents: (loadedSessionData.currentSessionPauseEvents||[]).map(p => ({...p, startTime: p.startTime?.toDate? p.startTime.toDate():null, endTime: p.endTime?.toDate? p.endTime.toDate():null })),
                lastPauseEndTime,
                submissivesName: savedSubmissivesName,
                totalTimeCageOff,
                chastityHistory, 
                hasSessionEverBeenActive: true,
            });
        }
        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null); 
    }, [loadedSessionData, saveDataToFirestore, lastPauseEndTime, savedSubmissivesName, totalTimeCageOff, chastityHistory, setHasSessionEverBeenActive]);

    const handleDiscardAndStartNew = useCallback(async () => {
        if (!db) return; // Check db
        setIsCageOn(false);
        setCageOnTime(null);
        setTimeInChastity(0);
        setIsPaused(false);
        setPauseStartTime(null);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentSessionPauseEvents([]);
        setTimeCageOff(0); 

        const newHasSessionEverBeenActive = chastityHistory.length > 0 || sexualEventsLog.length > 0 || (savedSubmissivesName !== '');
        setHasSessionEverBeenActive(newHasSessionEverBeenActive);

        await saveDataToFirestore({
            isCageOn: false, cageOnTime: null, timeInChastity: 0,
            isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
            hasSessionEverBeenActive: newHasSessionEverBeenActive,
        });

        setShowRestoreSessionPrompt(false);
        setLoadedSessionData(null);
    }, [saveDataToFirestore, chastityHistory, sexualEventsLog, savedSubmissivesName, setHasSessionEverBeenActive]);


    let pageTitleText = "ChastityOS"; 
    const navItemNames = {
        tracker: "Chastity Tracker",
        logEvent: "Sexual Event Log",
        fullReport: "Full Report",
        settings: "Settings",
        privacy: "Privacy & Analytics", 
        feedback: "Submit Beta Feedback"
    };
    if (currentPage === 'tracker' && showRestoreSessionPrompt) {
        pageTitleText = "Restore Previous Session";
    } else if (navItemNames[currentPage]) {
        pageTitleText = navItemNames[currentPage];
    }

    if (firebaseInitializationError) {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8 text-white">
                <div className="w-full max-w-xl bg-red-800 p-6 rounded-lg shadow-lg border border-red-700 text-center">
                    <h1 className="text-3xl font-bold text-red-200 mb-4">Application Error</h1>
                    <p className="text-red-100 mb-2">Failed to initialize Firebase services.</p>
                    <p className="text-red-100 mb-4">Please ensure your Firebase configuration (API key, etc.) is correct in the environment variables.</p>
                    <p className="text-xs text-red-300 bg-red-900 p-2 rounded">Error details: {firebaseInitializationError}</p>
                </div>
            </div>
        );
    }

    if (isLoading && !isAuthReady) { 
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
                <div className="text-purple-300 text-xl">Initializing ChastityOS Authentication...</div>
            </div>
        );
    }
     if (isLoading && isAuthReady && dataLoadedForUser.current !== userId) { 
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
                <div className="text-purple-300 text-xl">Loading User Data...</div>
            </div>
        );
    }


    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
                <h1 className="text-4xl font-bold text-purple-400 mb-4 tracking-wider">ChastityOS</h1>
                {savedSubmissivesName && <p className="text-lg text-purple-200 mb-6">For: <span className="font-semibold">{savedSubmissivesName}</span></p>}
                <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <h2 className="text-2xl font-bold text-purple-300 mb-4">{pageTitleText}</h2>

                <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page content...</div>}>
                    {currentPage === 'tracker' && (
                        <TrackerPage
                            isAuthReady={isAuthReady} isCageOn={isCageOn} cageOnTime={cageOnTime} timeInChastity={timeInChastity} timeCageOff={timeCageOff}
                            totalChastityTime={totalChastityTime} totalTimeCageOff={totalTimeCageOff} chastityHistory={chastityHistory}
                            handleToggleCage={handleToggleCage} showReasonModal={showReasonModal}
                            reasonForRemoval={reasonForRemoval} setReasonForRemoval={setReasonForRemoval} handleConfirmRemoval={handleConfirmRemoval} handleCancelRemoval={handleCancelRemoval}
                            isPaused={isPaused} handleInitiatePause={handleInitiatePause} handleResumeSession={handleResumeSession}
                            showPauseReasonModal={showPauseReasonModal} handleCancelPauseModal={handleCancelPauseModal} reasonForPauseInput={reasonForPauseInput} setReasonForPauseInput={setReasonForPauseInput}
                            handleConfirmPause={handleConfirmPause} accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession} pauseStartTime={pauseStartTime}
                            livePauseDuration={livePauseDuration} pauseCooldownMessage={pauseCooldownMessage}
                            showRestoreSessionPrompt={showRestoreSessionPrompt} handleConfirmRestoreSession={handleConfirmRestoreSession} handleDiscardAndStartNew={handleDiscardAndStartNew} loadedSessionData={loadedSessionData}
                            goalDurationSeconds={goalDurationSeconds}
                            keyholderName={keyholderName}
                            isKeyholderModeUnlocked={isKeyholderModeUnlocked} 
                            requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
                        />
                    )}
                    {currentPage === 'fullReport' && (
                        <FullReportPage
                            savedSubmissivesName={savedSubmissivesName} userId={userId}
                            isCageOn={isCageOn} cageOnTime={cageOnTime} timeInChastity={timeInChastity} timeCageOff={timeCageOff}
                            totalChastityTime={totalChastityTime} totalTimeCageOff={totalTimeCageOff}
                            chastityHistory={chastityHistory} sexualEventsLog={sexualEventsLog} isLoadingEvents={isLoadingEvents}
                            isPaused={isPaused} accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
                            overallTotalPauseTime={overallTotalPauseTime}
                            keyholderName={keyholderName}
                        />
                    )}
                    {currentPage === 'logEvent' && (
                        <LogEventPage
                            isAuthReady={isAuthReady}
                            newEventDate={newEventDate} setNewEventDate={setNewEventDate}
                            newEventTime={newEventTime} setNewEventTime={setNewEventTime}
                            selectedEventTypes={selectedEventTypes} handleEventTypeChange={handleEventTypeChange}
                            otherEventTypeChecked={otherEventTypeChecked} handleOtherEventTypeCheckChange={handleOtherEventTypeCheckChange}
                            otherEventTypeDetail={otherEventTypeDetail} setOtherEventTypeDetail={setOtherEventTypeDetail}
                            newEventNotes={newEventNotes} setNewEventNotes={setNewEventNotes}
                            newEventDurationHours={newEventDurationHours} setNewEventDurationHours={setNewEventDurationHours}
                            newEventDurationMinutes={newEventDurationMinutes} setNewEventDurationMinutes={setNewEventDurationMinutes}
                            newEventSelfOrgasmAmount={newEventSelfOrgasmAmount} setNewEventSelfOrgasmAmount={setNewEventSelfOrgasmAmount}
                            newEventPartnerOrgasmAmount={newEventPartnerOrgasmAmount} setNewEventPartnerOrgasmAmount={setNewEventPartnerOrgasmAmount}
                            handleLogNewEvent={handleLogNewEvent} eventLogMessage={eventLogMessage}
                            isLoadingEvents={isLoadingEvents} sexualEventsLog={sexualEventsLog}
                            savedSubmissivesName={savedSubmissivesName} keyholderName={keyholderName}
                        />
                    )}
                    {currentPage === 'settings' && (
                        <SettingsPage
                            isAuthReady={isAuthReady}
                            eventLogMessage={eventLogMessage} 
                            handleExportTrackerCSV={handleExportTrackerCSV}
                            handleExportEventLogCSV={handleExportEventLogCSV}
                            handleResetAllData={handleResetAllData} confirmReset={confirmReset}
                            nameMessage={nameMessage} handleExportTextReport={handleExportTextReport}
                            userId={userId} showUserIdInSettings={showUserIdInSettings} handleToggleUserIdVisibility={handleToggleUserIdVisibility}
                            savedSubmissivesName={savedSubmissivesName} submissivesNameInput={submissivesNameInput}
                            handleSubmissivesNameInputChange={handleSubmissivesNameInputChange} handleSetSubmissivesName={handleSetSubmissivesName}
                            restoreUserIdInput={restoreUserIdInput} handleRestoreUserIdInputChange={handleRestoreUserIdInputChange}
                            handleInitiateRestoreFromId={handleInitiateRestoreFromId} showRestoreFromIdPrompt={showRestoreFromIdPrompt}
                            handleConfirmRestoreFromId={handleConfirmRestoreFromId} handleCancelRestoreFromId={handleCancelRestoreFromId}
                            restoreFromIdMessage={restoreFromIdMessage}
                            setCurrentPage={setCurrentPage} 

                            currentGoalDurationSeconds={goalDurationSeconds}
                            handleSetGoalDuration={handleSetGoalDuration}

                            keyholderName={keyholderName}
                            handleSetKeyholder={handleSetKeyholder}
                            handleClearKeyholder={handleClearKeyholder}
                            handleUnlockKeyholderControls={handleUnlockKeyholderControls}
                            isKeyholderModeUnlocked={isKeyholderModeUnlocked}
                            handleLockKeyholderControls={handleLockKeyholderControls}
                            requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
                            handleSetRequiredDuration={handleSetRequiredDuration}
                            keyholderMessage={keyholderMessage}
                            setKeyholderMessage={setKeyholderMessage} 
                        />
                    )}
                    {currentPage === 'privacy' && ( <PrivacyPage onBack={() => setCurrentPage('settings')} /> )}
                    {currentPage === 'feedback' && ( <FeedbackForm userId={userId} /> )}
                </Suspense>
            </div>
            <FooterNav userId={userId} />
        </div>
    );
};

export default App;
