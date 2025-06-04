import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; // signInWithCustomToken removed
import {
    getFirestore, doc, getDoc, setDoc, Timestamp, setLogLevel,
    collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc
} from 'firebase/firestore';

import { formatTime, formatElapsedTime, EVENT_TYPES } from './utils';
import MainNav from './components/MainNav';
import FooterNav from './components/FooterNav';

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
    console.error(
        "Firebase configuration is missing or incomplete. " +
        "Make sure your .env file in the project root is set up correctly with variables prefixed with VITE_ " +
        "(e.g., VITE_FIREBASE_API_KEY='your_key') and that you have restarted your dev server."
    );
}

const appIdForFirestore = firebaseConfig.appId || 'default-chastity-app-id';

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp); // Firebase auth instance
const db = getFirestore(firebaseApp); // Firebase db instance
setLogLevel('debug');

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
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('tracker');
  // ... (all other state variables remain the same as previous App.jsx)
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
  const timerInChastityRef = useRef(null);
  const timerCageOffRef = useRef(null);

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      if (typeof window.gtag === 'function') {
        window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
        console.log("Google Analytics configured with ID:", GA_MEASUREMENT_ID);
      } else {
        console.warn("gtag.js not found.");
      }
    } else {
      console.warn("Google Analytics Measurement ID (VITE_GA_MEASUREMENT_ID) is not set.");
    }
  }, []);

  useEffect(() => {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function' && isAuthReady) {
      const pagePath = `/${currentPage}`;
      const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1').trim();
      window.gtag('event', 'page_view', { page_title: pageTitle, page_path: pagePath, user_id: userId });
    }
  }, [currentPage, isAuthReady, userId]);

  // `db` and `appIdForFirestore` are stable module-level variables, so they don't need to be deps here.
  const getDocRef = useCallback((targetUserId = userId) => {
    if (!targetUserId) return null;
    return doc(db, "artifacts", appIdForFirestore, "users", targetUserId);
  }, [userId]);

  const getEventsCollectionRef = useCallback((targetUserId = userId) => {
    if (!targetUserId || !db || !appIdForFirestore || targetUserId.trim() === '' || appIdForFirestore.trim() === '') {
        console.error("App.js: getEventsCollectionRef - Invalid params.", { targetUserId, dbExists: !!db, appIdForFirestore });
        return null;
    }
    try {
        return collection(db, "artifacts", appIdForFirestore, "users", targetUserId, "sexualEventsLog");
    } catch (error) {
        console.error("App.js: getEventsCollectionRef - Error:", error);
        return null;
    }
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        if (!userId && !isAuthReady) {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.error("App.js: Initial sign-in error:", error);
                setIsAuthReady(false);
                setUserId(null);
                setIsLoading(false);
            }
        } else {
            if (userId) console.log("App.js: User signed out or auth state changed.");
            setUserId(null);
            setIsAuthReady(false);
        }
      }
    });
    return () => unsubscribe();
  }, [userId, isAuthReady, setIsLoading]); // `auth` removed as it's stable

  useEffect(() => {
    // ... (total calculation logic remains the same)
    let totalEffectiveChastity = 0;
    let totalOverallPaused = 0;
    chastityHistory.forEach(period => {
        const effectiveDuration = (period.duration || 0) - (period.totalPauseDurationSeconds || 0);
        totalEffectiveChastity += Math.max(0, effectiveDuration);
        totalOverallPaused += (period.totalPauseDurationSeconds || 0);
    });
    setTotalChastityTime(totalEffectiveChastity);
    setOverallTotalPauseTime(totalOverallPaused);
  }, [chastityHistory]);

  const applyRestoredDataFromOtherUser = useCallback((data) => {
    // ... (logic remains the same)
    const loadedHist = (data.chastityHistory || []).map(item => ({
        ...item,
        startTime: item.startTime?.toDate ? item.startTime.toDate() : null,
        endTime: item.endTime?.toDate ? item.endTime.toDate() : null,
        totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0,
        pauseEvents: (item.pauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate ? p.startTime.toDate() : null, endTime: p.endTime?.toDate ? p.endTime.toDate() : null }))
      }));
    setChastityHistory(loadedHist);
    setTotalTimeCageOff(data.totalTimeCageOff || 0);
    const cName = data.submissivesName || data.userAlias || '';
    setSavedSubmissivesName(cName); setSubmissivesNameInput(cName);
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
    setShowRestoreSessionPrompt(false); setLoadedSessionData(null);
  }, [setHasSessionEverBeenActive]); // setHasSessionEverBeenActive is stable

  useEffect(() => {
    if (!isAuthReady || !userId) {
      // Use auth.currentUser to check status if isAuthReady is false
      if(isLoading && !isAuthReady && auth.currentUser === null) {
        setIsLoading(false);
      }
      return;
    }
    const loadInitialData = async () => {
      setIsLoading(true);
      const docRef = getDocRef();
      if (!docRef) {
          setIsLoading(false); setHasSessionEverBeenActive(false);
          setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
          setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
          setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
          setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
          return;
      }
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Apply general data first
          const loadedHist = (data.chastityHistory || []).map(item => ({
            ...item,
            startTime: item.startTime?.toDate ? item.startTime.toDate() : null,
            endTime: item.endTime?.toDate ? item.endTime.toDate() : null,
            totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0,
            pauseEvents: (item.pauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate ? p.startTime.toDate() : null, endTime: p.endTime?.toDate ? p.endTime.toDate() : null }))
          }));
          setChastityHistory(loadedHist);
          setTotalTimeCageOff(data.totalTimeCageOff || 0);
          const currentName = data.submissivesName || data.userAlias || '';
          setSavedSubmissivesName(currentName); setSubmissivesNameInput(currentName);
          const loadedLastPauseEndTime = data.lastPauseEndTime?.toDate ? data.lastPauseEndTime.toDate() : null;
          setLastPauseEndTime(loadedLastPauseEndTime && !isNaN(loadedLastPauseEndTime.getTime()) ? loadedLastPauseEndTime : null);
          setHasSessionEverBeenActive(data.hasSessionEverBeenActive || false);

           const activeSessionIsCageOnLoaded = data.isCageOn || false;
           const activeSessionCageOnTimeLoaded = data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null;

           if (activeSessionIsCageOnLoaded && activeSessionCageOnTimeLoaded && !isNaN(activeSessionCageOnTimeLoaded.getTime())) {
             const loadedPauseStartTimeFromData = data.pauseStartTime?.toDate ? data.pauseStartTime.toDate() : null;
             setLoadedSessionData({
                 isCageOn: true, cageOnTime: activeSessionCageOnTimeLoaded, timeInChastity: data.timeInChastity || 0,
                 isPaused: data.isPaused || false,
                 pauseStartTime: loadedPauseStartTimeFromData && !isNaN(loadedPauseStartTimeFromData.getTime()) ? loadedPauseStartTimeFromData : null,
                 accumulatedPauseTimeThisSession: data.accumulatedPauseTimeThisSession || 0,
                 currentSessionPauseEvents: (data.currentSessionPauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate? p.startTime.toDate() : null, endTime: p.endTime?.toDate? p.endTime.toDate() : null })),
             });
             // Set UI to a temporary state for the restore prompt
             setIsCageOn(true); setCageOnTime(activeSessionCageOnTimeLoaded); setTimeInChastity(data.timeInChastity || 0);
             setIsPaused(true); setPauseStartTime(new Date()); // This is a temporary UI pause, not the actual loaded pause start time
             setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
             setCurrentSessionPauseEvents((data.currentSessionPauseEvents || []).map(p => ({...p, startTime: p.startTime?.toDate? p.startTime.toDate() : null, endTime: p.endTime?.toDate? p.endTime.toDate() : null})));
             // setHasSessionEverBeenActive(true); // Already set above
             setShowRestoreSessionPrompt(true);
           } else { // No active session to restore, ensure clean state
             setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0);
             setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
             setLivePauseDuration(0); setTimeCageOff(0);
             // setHasSessionEverBeenActive(data.hasSessionEverBeenActive || false); // Already set above
             setShowRestoreSessionPrompt(false);
           }
        } else { // No document found
           setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
           setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
           setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
           setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
           setHasSessionEverBeenActive(false);
        }
      } catch (error) {
          console.error("Error loading initial tracker data:", error);
          // Reset to default off state on error
          setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
          setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
          setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
          setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
          setHasSessionEverBeenActive(false);
      }
      finally { setIsLoading(false); }
    };
    loadInitialData();
  }, [isAuthReady, userId, getDocRef, isLoading, setIsLoading, applyRestoredDataFromOtherUser]); // `auth` removed, setIsLoading added

  // ... (rest of the App.jsx code, including all other useCallback hooks and the return statement, remains identical to the previous version) ...
  // Ensure all other callbacks (handleExportCSV, etc.) have their dependencies correctly listed
  // based on the values they use from the component scope. The ESLint warnings for those
  // might be overly aggressive if the dependencies are indeed used and change.

  const fetchEvents = useCallback(async (targetUserId = userId) => {
    if (!isAuthReady || !targetUserId) return;
    setIsLoadingEvents(true);
    const eventsColRef = getEventsCollectionRef(targetUserId);
    if (!eventsColRef) {
        setEventLogMessage("Error: Could not get event log reference.");
        setTimeout(() => setEventLogMessage(''), 3000); setIsLoadingEvents(false); return;
    }
    try {
        const q = query(eventsColRef, orderBy("eventTimestamp", "desc"));
        const querySnapshot = await getDocs(q);
        setSexualEventsLog(querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), eventTimestamp: d.data().eventTimestamp?.toDate() })));
    } catch (error) {
        console.error("Error fetching events:", error); setEventLogMessage("Failed to load events.");
        setTimeout(() => setEventLogMessage(''), 3000);
    } finally { setIsLoadingEvents(false); }
  }, [isAuthReady, userId, getEventsCollectionRef]); 

  useEffect(() => {
    if ((currentPage === 'logEvent' || currentPage === 'fullReport' || currentPage === 'feedback') && isAuthReady && userId) {
        fetchEvents();
    }
  }, [currentPage, fetchEvents, isAuthReady, userId]);

  const saveDataToFirestore = useCallback(async (dataToSave) => {
    if (!isAuthReady || !userId) return;
    const docRef = getDocRef();
    if (!docRef) return;
    try {
      const firestoreReadyData = { ...dataToSave, hasSessionEverBeenActive };
      const toTS = (d) => d instanceof Date && !isNaN(d) ? Timestamp.fromDate(d) : (typeof d === 'string' && new Date(d) instanceof Date && !isNaN(new Date(d).getTime()) ? Timestamp.fromDate(new Date(d)) : null);
      firestoreReadyData.cageOnTime = toTS(firestoreReadyData.cageOnTime);
      if (firestoreReadyData.chastityHistory) {
        firestoreReadyData.chastityHistory = firestoreReadyData.chastityHistory.map(item => ({
          ...item, startTime: toTS(item.startTime), endTime: toTS(item.endTime),
          pauseEvents: (item.pauseEvents || []).map(p => ({ ...p, startTime: toTS(p.startTime), endTime: toTS(p.endTime) }))
        }));
      }
      firestoreReadyData.pauseStartTime = toTS(firestoreReadyData.pauseStartTime);
      firestoreReadyData.lastPauseEndTime = toTS(firestoreReadyData.lastPauseEndTime);
      if (firestoreReadyData.currentSessionPauseEvents) {
          firestoreReadyData.currentSessionPauseEvents = firestoreReadyData.currentSessionPauseEvents.map(p => ({ ...p, startTime: toTS(p.startTime), endTime: toTS(p.endTime) }));
      }
      if (typeof firestoreReadyData.submissivesName === 'undefined') firestoreReadyData.submissivesName = savedSubmissivesName;
      if (Object.prototype.hasOwnProperty.call(firestoreReadyData, 'userAlias')) {
        delete firestoreReadyData.userAlias;
      }
      await setDoc(docRef, firestoreReadyData, { merge: true });
    } catch (error) { console.error("Error saving main data:", error); }
  }, [userId, getDocRef, isAuthReady, savedSubmissivesName, hasSessionEverBeenActive]);

  useEffect(() => {
    if (isCageOn && !isPaused && isAuthReady && cageOnTime instanceof Date && !isNaN(cageOnTime.getTime())) {
      setTimeInChastity(Math.max(0, Math.floor((new Date().getTime() - cageOnTime.getTime()) / 1000)));
      timerInChastityRef.current = setInterval(() => setTimeInChastity(prev => prev + 1), 1000);
    } else if (timerInChastityRef.current) {
      clearInterval(timerInChastityRef.current);
    }
    return () => { if (timerInChastityRef.current) clearInterval(timerInChastityRef.current); };
  }, [isCageOn, isPaused, cageOnTime, isAuthReady]);

  useEffect(() => {
    if (!isCageOn && isAuthReady && hasSessionEverBeenActive) {
      timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
    } else if (timerCageOffRef.current) {
      clearInterval(timerCageOffRef.current);
    }
    return () => { if (timerCageOffRef.current) clearInterval(timerCageOffRef.current); };
  }, [isCageOn, isAuthReady, hasSessionEverBeenActive]);

  useEffect(() => {
    if (isPaused && pauseStartTime instanceof Date && !isNaN(pauseStartTime.getTime())) {
        setLivePauseDuration(Math.max(0, Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000)));
        pauseDisplayTimerRef.current = setInterval(() => setLivePauseDuration(prev => prev + 1), 1000);
    } else {
        if (pauseDisplayTimerRef.current) clearInterval(pauseDisplayTimerRef.current);
        setLivePauseDuration(0);
    }
    return () => { if (pauseDisplayTimerRef.current) clearInterval(pauseDisplayTimerRef.current); };
  }, [isPaused, pauseStartTime]);

  const handleInitiatePause = useCallback(() => {
    setPauseCooldownMessage('');
    if (lastPauseEndTime instanceof Date && !isNaN(lastPauseEndTime.getTime())) {
        const twelveHours = 12 * 3600 * 1000;
        if (new Date().getTime() - lastPauseEndTime.getTime() < twelveHours) {
            const remaining = twelveHours - (new Date().getTime() - lastPauseEndTime.getTime());
            setPauseCooldownMessage(`Pause available in ${Math.floor(remaining/3600000)}h ${Math.floor((remaining%3600000)/60000)}m.`);
            setTimeout(() => setPauseCooldownMessage(''), 5000); return;
        }
    }
    setShowPauseReasonModal(true);
  }, [lastPauseEndTime]);

  const handleConfirmPause = useCallback(async () => {
    if (!isCageOn) { setShowPauseReasonModal(false); setReasonForPauseInput(''); return; }
    const now = new Date();
    const newPauseEvent = { id: crypto.randomUUID(), startTime: now, reason: reasonForPauseInput.trim() || "N/A", endTime: null, duration: null };
    setIsPaused(true); setPauseStartTime(now);
    const updatedSessionPauses = [...currentSessionPauseEvents, newPauseEvent];
    setCurrentSessionPauseEvents(updatedSessionPauses);
    setShowPauseReasonModal(false); setReasonForPauseInput('');
    await saveDataToFirestore({ isPaused: true, pauseStartTime: now, accumulatedPauseTimeThisSession, currentSessionPauseEvents: updatedSessionPauses, lastPauseEndTime });
  }, [isCageOn, reasonForPauseInput, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore, lastPauseEndTime]);

  const handleCancelPauseModal = useCallback(() => { setShowPauseReasonModal(false); setReasonForPauseInput(''); }, []);

  const handleResumeSession = useCallback(async () => {
    if (!isPaused || !(pauseStartTime instanceof Date) || isNaN(pauseStartTime.getTime())) {
        setIsPaused(false); setPauseStartTime(null); setLivePauseDuration(0); return;
    }
    const endTime = new Date();
    const duration = Math.max(0, Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000));
    const newAccumulated = accumulatedPauseTimeThisSession + duration;
    const updatedPauses = currentSessionPauseEvents.map((ev, i) => i === currentSessionPauseEvents.length -1 ? {...ev, endTime, duration} : ev);
    setAccumulatedPauseTimeThisSession(newAccumulated);
    setIsPaused(false); setPauseStartTime(null); setCurrentSessionPauseEvents(updatedPauses);
    setLivePauseDuration(0); setLastPauseEndTime(endTime);
    await saveDataToFirestore({ isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: newAccumulated, currentSessionPauseEvents: updatedPauses, lastPauseEndTime: endTime });
  }, [isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore]);

  const handleToggleCage = useCallback(() => {
    if (!isAuthReady || isPaused) return;
    const now = new Date();
    if (confirmReset) { setConfirmReset(false); if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current); }
    if (!isCageOn) {
      const newTotalOff = totalTimeCageOff + timeCageOff; setTotalTimeCageOff(newTotalOff);
      setCageOnTime(now); setIsCageOn(true); setTimeInChastity(0); setTimeCageOff(0);
      setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
      setPauseStartTime(null); setIsPaused(false);
      setHasSessionEverBeenActive(true);
      saveDataToFirestore({ isCageOn: true, cageOnTime: now, totalTimeCageOff: newTotalOff, timeInChastity: 0, chastityHistory, totalChastityTime, submissivesName: savedSubmissivesName, isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime, hasSessionEverBeenActive: true });
    } else {
      setTempEndTime(now); setTempStartTime(cageOnTime); setShowReasonModal(true);
    }
  }, [isAuthReady, isPaused, confirmReset, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, saveDataToFirestore, chastityHistory, totalChastityTime, savedSubmissivesName, lastPauseEndTime, setHasSessionEverBeenActive]);

  const handleConfirmRemoval = useCallback(() => {
    if (!isAuthReady || !(tempStartTime instanceof Date) || !(tempEndTime instanceof Date)) return;
    let currentAccPause = accumulatedPauseTimeThisSession; let finalPauses = currentSessionPauseEvents;
    if (isPaused && pauseStartTime instanceof Date && !isNaN(pauseStartTime.getTime())) {
        const pauseEnd = tempEndTime;
        const duration = Math.max(0, Math.floor((pauseEnd.getTime() - pauseStartTime.getTime()) / 1000));
        currentAccPause += duration;
        finalPauses = currentSessionPauseEvents.map((ev, i) => i === currentSessionPauseEvents.length -1 ? {...ev, endTime: pauseEnd, duration} : ev);
    }
    const rawDuration = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));
    const newEntry = { id: crypto.randomUUID(), periodNumber: chastityHistory.length + 1, startTime: tempStartTime, endTime: tempEndTime, duration: rawDuration, reasonForRemoval: reasonForRemoval.trim() || "N/A", totalPauseDurationSeconds: currentAccPause, pauseEvents: finalPauses };
    const updatedHistory = [...chastityHistory, newEntry]; setChastityHistory(updatedHistory);
    setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
    setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
    setHasSessionEverBeenActive(true);
    saveDataToFirestore({ isCageOn: false, cageOnTime: null, timeInChastity: 0, chastityHistory: updatedHistory, totalTimeCageOff, submissivesName: savedSubmissivesName, isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime, hasSessionEverBeenActive: true });
    setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false);
  }, [isAuthReady, tempStartTime, tempEndTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, isPaused, pauseStartTime, chastityHistory, reasonForRemoval, saveDataToFirestore, totalTimeCageOff, savedSubmissivesName, lastPauseEndTime, setHasSessionEverBeenActive]);

  const handleCancelRemoval = useCallback(() => { setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false); }, []);

  const clearAllEvents = useCallback(async () => {
    if (!isAuthReady || !userId) return;
    const eventsColRef = getEventsCollectionRef(); if (!eventsColRef) return;
    try {
        const q = query(eventsColRef); const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d_1 => deleteDoc(doc(db, eventsColRef.path, d_1.id))));
        setSexualEventsLog([]);
    } catch (error) { console.error("Error clearing events:", error); }
  }, [isAuthReady, userId, getEventsCollectionRef]); // `db` is stable

  const handleResetAllData = useCallback(() => {
    if (!isAuthReady) return;
      if (confirmReset) {
        if (timerInChastityRef.current) clearInterval(timerInChastityRef.current);
        if (timerCageOffRef.current) clearInterval(timerCageOffRef.current);
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        setCageOnTime(null); setIsCageOn(false); setTimeInChastity(0); setTimeCageOff(0); setChastityHistory([]);
        setTotalChastityTime(0); setTotalTimeCageOff(0); setSavedSubmissivesName(''); setSubmissivesNameInput('');
        setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
        setLastPauseEndTime(null); setPauseCooldownMessage('');
        setHasSessionEverBeenActive(false); setConfirmReset(false); setShowReasonModal(false);
        saveDataToFirestore({ cageOnTime: null, isCageOn: false, timeInChastity: 0, chastityHistory: [], totalChastityTime: 0, totalTimeCageOff: 0, submissivesName: '', isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime: null, hasSessionEverBeenActive: false });
        clearAllEvents();
        setNameMessage("All data reset. Submissive's Name cleared.");
        setTimeout(() => setNameMessage(''), 4000); setCurrentPage('tracker');
      } else {
        setConfirmReset(true); resetTimeoutRef.current = setTimeout(() => setConfirmReset(false), 3000);
      }
  }, [isAuthReady, confirmReset, saveDataToFirestore, clearAllEvents, setCurrentPage, setNameMessage, setConfirmReset, resetTimeoutRef, setHasSessionEverBeenActive]);

  const handleSubmissivesNameInputChange = useCallback((event) => setSubmissivesNameInput(event.target.value), []);
  const handleSetSubmissivesName = useCallback(async () => {
    if (!isAuthReady || !userId) { setNameMessage("Auth error."); setTimeout(() => setNameMessage(''), 3000); return; }
    if (savedSubmissivesName) { setNameMessage("Name set. Reset data to change."); setTimeout(() => setNameMessage(''), 4000); return; }
    const trimmed = submissivesNameInput.trim();
    if (!trimmed) { setNameMessage("Name cannot be empty."); setTimeout(() => setNameMessage(''), 3000); return; }
    setSavedSubmissivesName(trimmed);
    await saveDataToFirestore({ submissivesName: trimmed, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime, hasSessionEverBeenActive });
    setNameMessage("Name set!"); setTimeout(() => setNameMessage(''), 3000);
  }, [isAuthReady, userId, savedSubmissivesName, submissivesNameInput, saveDataToFirestore, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime, hasSessionEverBeenActive]);

  const handleToggleUserIdVisibility = useCallback(() => setShowUserIdInSettings(prev => !prev), []);
  const handleEventTypeChange = useCallback((type) => setSelectedEventTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]), []);
  const handleOtherEventTypeCheckChange = useCallback((e) => { setOtherEventTypeChecked(e.target.checked); if (!e.target.checked) setOtherEventTypeDetail(''); }, []);

  const handleLogNewEvent = useCallback(async (e) => {
    e.preventDefault();
    if (!isAuthReady || !userId) { setEventLogMessage("Auth error."); setTimeout(() => setEventLogMessage(''), 3000); return; }
    const finalTypes = [...selectedEventTypes];
    let finalOther = otherEventTypeChecked && otherEventTypeDetail.trim() ? otherEventTypeDetail.trim() : null;
    if (finalTypes.length === 0 && !finalOther) { setEventLogMessage("Select type or specify 'Other'."); setTimeout(() => setEventLogMessage(''), 3000); return; }
    const eventsColRef = getEventsCollectionRef(); if (!eventsColRef) { setEventLogMessage("Event log ref error."); setTimeout(() => setEventLogMessage(''), 3000); return; }
    const ts = new Date(`${newEventDate}T${newEventTime}`); if (isNaN(ts.getTime())) { setEventLogMessage("Invalid date/time."); setTimeout(() => setEventLogMessage(''), 3000); return; }
    const durSec = (parseInt(newEventDurationHours,10)||0)*3600 + (parseInt(newEventDurationMinutes,10)||0)*60;
    const selfO = selectedEventTypes.includes("Orgasm (Self)") && newEventSelfOrgasmAmount ? parseInt(newEventSelfOrgasmAmount,10)||null : null;
    const partnerO = selectedEventTypes.includes("Orgasm (Partner)") && newEventPartnerOrgasmAmount ? parseInt(newEventPartnerOrgasmAmount,10)||null : null;
    const newData = { eventTimestamp: Timestamp.fromDate(ts), loggedAt: serverTimestamp(), types: finalTypes, otherTypeDetail: finalOther, notes: newEventNotes.trim(), durationSeconds: durSec > 0 ? durSec : null, selfOrgasmAmount: selfO, partnerOrgasmAmount: partnerO };
    try {
        await addDoc(eventsColRef, newData);
        setEventLogMessage("Event logged!"); setNewEventDate(new Date().toISOString().slice(0,10)); setNewEventTime(new Date().toTimeString().slice(0,5));
        setSelectedEventTypes([]); setOtherEventTypeChecked(false); setOtherEventTypeDetail(''); setNewEventNotes('');
        setNewEventDurationHours(''); setNewEventDurationMinutes(''); setNewEventSelfOrgasmAmount(''); setNewEventPartnerOrgasmAmount('');
        fetchEvents();
    } catch (error) { console.error("Error logging event:", error); setEventLogMessage("Failed to log. See console."); }
    setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, userId, selectedEventTypes, otherEventTypeChecked, otherEventTypeDetail, newEventDate, newEventTime, newEventDurationHours, newEventDurationMinutes, newEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, newEventNotes, getEventsCollectionRef, fetchEvents]);

  const handleExportTrackerCSV = useCallback(() => {
    if (!isAuthReady || chastityHistory.length === 0) { setEventLogMessage("No tracker history."); setTimeout(() => setEventLogMessage(''), 3000); return; }
    let csv = "Period #,Start Time,End Time,Raw Duration (HH:MM:SS),Total Pause (HH:MM:SS),Effective Chastity (HH:MM:SS),Reason,Pause Events\n";
    chastityHistory.forEach(p => {
      const raw = formatElapsedTime(p.duration);
      const pause = formatElapsedTime(p.totalPauseDurationSeconds || 0);
      const effective = formatElapsedTime(Math.max(0, p.duration - (p.totalPauseDurationSeconds || 0)));
      let pausesStr = (p.pauseEvents || []).map(pe => `[${formatTime(pe.startTime,true,true)} to ${formatTime(pe.endTime,true,true)} (${formatElapsedTime(pe.duration||0)}) R: ${pe.reason||'N/A'}]`).join('; ');
      csv += `${p.periodNumber},${formatTime(p.startTime,true,true)},${formatTime(p.endTime,true,true)},${raw},${pause},${effective},"${(p.reasonForRemoval||'').replace(/"/g,'""')}","${pausesStr.replace(/"/g,'""')}"\n`;
    });
    const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
    link.download = "chastity_tracker_history.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setEventLogMessage("Tracker CSV exported!"); setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, chastityHistory]);

  const handleExportEventLogCSV = useCallback(() => {
    if (!isAuthReady || sexualEventsLog.length === 0) { setEventLogMessage("No events to export."); setTimeout(() => setEventLogMessage(''), 3000); return; }
    let csv = "Date & Time,Type(s),Other Detail,Duration (HH:MM:SS),Orgasm (Self),Orgasm (Partner),Notes\n";
    sexualEventsLog.slice().reverse().forEach(ev => {
      csv += `${formatTime(ev.eventTimestamp,true,true)},"${(ev.types||[]).join('; ')}","${ev.otherTypeDetail||''}","${ev.durationSeconds?formatElapsedTime(ev.durationSeconds):''}",${ev.selfOrgasmAmount||''},${ev.partnerOrgasmAmount||''},"${(ev.notes||'').replace(/"/g,'""')}"\n`;
    });
    const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
    link.download = "sexual_events_log.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setEventLogMessage("Event Log CSV exported!"); setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, sexualEventsLog]);

  const handleExportTextReport = useCallback(() => {
    if (!isAuthReady) { setEventLogMessage("Auth not ready."); setTimeout(() => setEventLogMessage(''), 3000); return; }
    let r = `ChastityOS Report\nGenerated: ${formatTime(new Date(),true,true)}\n`;
    r += `Name: ${savedSubmissivesName||'(Not Set)'}\nUID: ${userId||'N/A'}\n--------------------------------------\n\n`;
    r += `CURRENT STATUS:\nCage: ${isCageOn?(isPaused?'ON (Paused)':'ON'):'OFF'}\n`;
    if (isCageOn && cageOnTime) {
      r += `On Since: ${formatTime(cageOnTime,true,true)}\nEffective Session: ${formatElapsedTime(timeInChastity-(accumulatedPauseTimeThisSession||0))}\n`;
      if(isPaused && pauseStartTime) r += `Paused For: ${formatElapsedTime(livePauseDuration)}\n`;
      if((accumulatedPauseTimeThisSession||0)>0) r += `Total Paused This Session: ${formatElapsedTime(isPaused && pauseStartTime ? (accumulatedPauseTimeThisSession||0)+livePauseDuration : (accumulatedPauseTimeThisSession||0))}\n`;
    } else r += `Current Session Off: ${formatElapsedTime(timeCageOff)}\n`;
    r += `\nTOTALS:\nTotal Chastity (Effective): ${formatElapsedTime(totalChastityTime)}\nTotal Off: ${formatElapsedTime(totalTimeCageOff)}\nOverall Paused: ${formatElapsedTime(overallTotalPauseTime)}\n--------------------------------------\n\n`;
    r += `CHASTITY HISTORY (Recent First):\n`;
    if (chastityHistory.length > 0) chastityHistory.slice().reverse().forEach(p => {
      r += `P#${p.periodNumber}: ${formatTime(p.startTime,true,true)} - ${formatTime(p.endTime,true,true)}\n Raw: ${formatElapsedTime(p.duration)} Paused: ${formatElapsedTime(p.totalPauseDurationSeconds||0)} Effective: ${formatElapsedTime(p.duration-(p.totalPauseDurationSeconds||0))}\n Reason: ${p.reasonForRemoval||'N/A'}\n`;
      if(p.pauseEvents && p.pauseEvents.length > 0) p.pauseEvents.forEach(pe => {r += `  - Paused: ${formatTime(pe.startTime,true,true)} to ${formatTime(pe.endTime,true,true)} (${formatElapsedTime(pe.duration||0)}) R: ${pe.reason||'N/A'}\n`;});
      r += '\n';
    }); else r += "No history.\n\n";
    r += `--------------------------------------\n\nSEXUAL EVENTS (Recent First):\n`;
    if (sexualEventsLog.length > 0) sexualEventsLog.forEach(ev => {
      let types = (ev.types||[]).map(t => t==="Orgasm (Self)"&&savedSubmissivesName?`Orgasm (${savedSubmissivesName})`:t).join(', ');
      if(ev.otherTypeDetail) types += (types?', ':'') + `Other: ${ev.otherTypeDetail}`;
      let orgasms = []; if(ev.selfOrgasmAmount) orgasms.push(`Self: ${ev.selfOrgasmAmount}`); if(ev.partnerOrgasmAmount) orgasms.push(`Partner: ${ev.partnerOrgasmAmount}`);
      r += `${formatTime(ev.eventTimestamp,true,true)}\n Types: ${types||'N/A'}\n Duration: ${ev.durationSeconds?formatElapsedTime(ev.durationSeconds):'N/A'}\n Orgasms: ${orgasms.join(', ')||'N/A'}\n Notes: ${ev.notes||'N/A'}\n\n`;
    }); else r += "No events.\n";
    r += `--------------------------------------\nEnd of Report`;
    const blob = new Blob([r],{type:'text/plain;charset=utf-8'}); const link=document.createElement("a");
    link.href=URL.createObjectURL(blob); link.download=`ChastityOS_Report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
    setEventLogMessage("Text report exported!"); setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, overallTotalPauseTime, isPaused, accumulatedPauseTimeThisSession, livePauseDuration, pauseStartTime]);

  const handleRestoreUserIdInputChange = (event) => setRestoreUserIdInput(event.target.value);
  const handleInitiateRestoreFromId = () => {
    if (!restoreUserIdInput.trim()) { setRestoreFromIdMessage("Enter User ID."); setTimeout(() => setRestoreFromIdMessage(''), 3000); return; }
    setShowRestoreFromIdPrompt(true);
  };
  const handleCancelRestoreFromId = () => { setShowRestoreFromIdPrompt(false); setRestoreFromIdMessage(''); };
  const handleConfirmRestoreFromId = async () => {
    if (!restoreUserIdInput.trim() || !userId) { setRestoreFromIdMessage("Invalid input/user."); setTimeout(() => setRestoreFromIdMessage(''), 3000); setShowRestoreFromIdPrompt(false); return; }
    const targetDocRef = doc(db, "artifacts", appIdForFirestore, "users", restoreUserIdInput.trim());
    try {
        const docSnap = await getDoc(targetDocRef);
        if (docSnap.exists()) {
            const dataToRestore = docSnap.data();
            applyRestoredDataFromOtherUser(dataToRestore);
            await saveDataToFirestore({ ...dataToRestore, hasSessionEverBeenActive: dataToRestore.hasSessionEverBeenActive !== undefined ? dataToRestore.hasSessionEverBeenActive : true });
            setRestoreFromIdMessage("Data restored & saved for current user."); setRestoreUserIdInput(''); setCurrentPage('tracker');
            if (isAuthReady && userId) fetchEvents(userId);
        } else { setRestoreFromIdMessage("No data for User ID."); }
    } catch (error) { console.error("Error restoring from ID:", error); setRestoreFromIdMessage("Error. See console."); }
    setShowRestoreFromIdPrompt(false); setTimeout(() => setRestoreFromIdMessage(''), 4000);
  };

  const handleConfirmRestoreSession = useCallback(async () => {
    if (loadedSessionData) {
        const cageOnT = loadedSessionData.cageOnTime instanceof Timestamp ? loadedSessionData.cageOnTime.toDate() : new Date(loadedSessionData.cageOnTime);
        const pauseStartT = loadedSessionData.pauseStartTime instanceof Timestamp ? loadedSessionData.pauseStartTime.toDate() : (loadedSessionData.pauseStartTime ? new Date(loadedSessionData.pauseStartTime) : null);

        setIsCageOn(loadedSessionData.isCageOn);
        setCageOnTime(cageOnT && !isNaN(cageOnT.getTime()) ? cageOnT : null);
        setTimeInChastity(loadedSessionData.timeInChastity||0);
        setIsPaused(loadedSessionData.isPaused||false);
        setPauseStartTime(loadedSessionData.isPaused && pauseStartT && !isNaN(pauseStartT.getTime()) ? pauseStartT : null);
        setAccumulatedPauseTimeThisSession(loadedSessionData.accumulatedPauseTimeThisSession||0);
        setCurrentSessionPauseEvents((loadedSessionData.currentSessionPauseEvents||[]).map(p => ({...p, startTime: p.startTime?.toDate? p.startTime.toDate():null, endTime: p.endTime?.toDate? p.endTime.toDate():null })));
        setHasSessionEverBeenActive(true);
        await saveDataToFirestore({
            // Directly use values from loadedSessionData after conversion
            isCageOn: loadedSessionData.isCageOn,
            cageOnTime: cageOnT && !isNaN(cageOnT.getTime()) ? cageOnT : null,
            timeInChastity: loadedSessionData.timeInChastity || 0,
            isPaused: loadedSessionData.isPaused || false,
            pauseStartTime: (loadedSessionData.isPaused && pauseStartT && !isNaN(pauseStartT.getTime())) ? pauseStartT : null,
            accumulatedPauseTimeThisSession: loadedSessionData.accumulatedPauseTimeThisSession || 0,
            currentSessionPauseEvents: (loadedSessionData.currentSessionPauseEvents||[]).map(p => ({...p, startTime: p.startTime?.toDate? p.startTime.toDate():null, endTime: p.endTime?.toDate? p.endTime.toDate():null })),
            lastPauseEndTime, // from component state
            submissivesName: savedSubmissivesName, // from component state
            totalTimeCageOff, // from component state
            chastityHistory, // from component state
            hasSessionEverBeenActive: true
        });
    }
    setShowRestoreSessionPrompt(false); setLoadedSessionData(null);
  }, [loadedSessionData, saveDataToFirestore, lastPauseEndTime, savedSubmissivesName, totalTimeCageOff, chastityHistory, setHasSessionEverBeenActive]);

  const handleDiscardAndStartNew = useCallback(async () => {
    setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setIsPaused(false); setPauseStartTime(null);
    setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]); setTimeCageOff(0);
    const newHasSessionEverBeenActive = chastityHistory.length > 0 || sexualEventsLog.length > 0;
    setHasSessionEverBeenActive(newHasSessionEverBeenActive);

    await saveDataToFirestore({
        isCageOn: false, cageOnTime: null, timeInChastity: 0, isPaused: false, pauseStartTime: null,
        accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
        chastityHistory, totalChastityTime, totalTimeCageOff, submissivesName: savedSubmissivesName, lastPauseEndTime,
        hasSessionEverBeenActive: newHasSessionEverBeenActive
    });
    setShowRestoreSessionPrompt(false); setLoadedSessionData(null);
  }, [saveDataToFirestore, chastityHistory, sexualEventsLog, totalChastityTime, totalTimeCageOff, savedSubmissivesName, lastPauseEndTime, setHasSessionEverBeenActive]);

  let pageTitleText = "ChastityOS";
  // Determine current page title based on `currentPage`
  const navItemNames = { // To centralize names for titles
    tracker: "Chastity Tracker",
    logEvent: "Sexual Event Log",
    fullReport: "Full Report",
    settings: "Settings",
    privacy: "Privacy & Analytics",
    feedback: "Submit Beta Feedback"
  };
  if (currentPage === 'tracker' && showRestoreSessionPrompt) {
    pageTitleText = "Restore Session"; // Or keep it Chastity Tracker, or make it more specific
  } else if (navItemNames[currentPage]) {
    pageTitleText = navItemNames[currentPage];
  }


  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        <h1 className="text-4xl font-bold text-purple-400 mb-4 tracking-wider">ChastityOS</h1>
        {savedSubmissivesName && <p className="text-lg text-purple-200 mb-6">For: <span className="font-semibold">{savedSubmissivesName}</span></p>}

        <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

        <h2 className="text-2xl font-bold text-purple-300 mb-4">{pageTitleText}</h2>

        <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
            {currentPage === 'tracker' && ( <TrackerPage {...{ isAuthReady, isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory, handleToggleCage, showReasonModal, setShowReasonModal, reasonForRemoval, setReasonForRemoval, handleConfirmRemoval, handleCancelRemoval, isPaused, handleInitiatePause, handleResumeSession, showPauseReasonModal, handleCancelPauseModal, reasonForPauseInput, setReasonForPauseInput, handleConfirmPause, accumulatedPauseTimeThisSession, pauseStartTime, livePauseDuration, pauseCooldownMessage, showRestoreSessionPrompt, handleConfirmRestoreSession, handleDiscardAndStartNew, loadedSessionData }} /> )}
            {currentPage === 'fullReport' && ( <FullReportPage {...{ savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, isLoadingEvents, isPaused, accumulatedPauseTimeThisSession, overallTotalPauseTime }} /> )}
            {currentPage === 'logEvent' && ( <LogEventPage {...{ isAuthReady, newEventDate, setNewEventDate, newEventTime, setNewEventTime, selectedEventTypes, handleEventTypeChange, otherEventTypeChecked, handleOtherEventTypeCheckChange, otherEventTypeDetail, setOtherEventTypeDetail, newEventNotes, setNewEventNotes, newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, setNewEventDurationMinutes, newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount, handleLogNewEvent, eventLogMessage, isLoadingEvents, sexualEventsLog, savedSubmissivesName }} /> )}
            {currentPage === 'settings' && ( <SettingsPage {...{ isAuthReady, eventLogMessage, handleExportTrackerCSV, chastityHistory, handleExportEventLogCSV, sexualEventsLog, handleResetAllData, confirmReset, nameMessage, handleExportTextReport, userId, showUserIdInSettings, handleToggleUserIdVisibility, savedSubmissivesName, submissivesNameInput, handleSubmissivesNameInputChange, handleSetSubmissivesName, restoreUserIdInput, handleRestoreUserIdInputChange, handleInitiateRestoreFromId, showRestoreFromIdPrompt, handleConfirmRestoreFromId, handleCancelRestoreFromId, restoreFromIdMessage, setCurrentPage }} /> )}
            {currentPage === 'privacy' && ( <PrivacyPage onBack={() => setCurrentPage('settings')} /> )}
            {currentPage === 'feedback' && ( <FeedbackForm onBack={() => setCurrentPage('settings')} userId={userId} /> )}
        </Suspense>
      </div>
      <FooterNav userId={userId} />
    </div>
  );
};

export default App;