import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, doc, getDoc, setDoc, Timestamp, setLogLevel,
    collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc
} from 'firebase/firestore';

// Import utility functions
import { formatTime, formatElapsedTime, EVENT_TYPES } from './utils'; 
// Import the logo
import appLogo from './assets/logo.png'; // Ensure this path is correct

// Firebase Config - using environment variables
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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
setLogLevel('debug'); 

// --- Google Analytics Measurement ID ---
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// --- Lazy Load Page Components ---
const TrackerPage = lazy(() => import('./pages/TrackerPage')); 
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// --- Main App Component ---
const App = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  // const [isLoading, setIsLoading] = useState(true); // Removed as it's not used to gate UI
  const [currentPage, setCurrentPage] = useState('tracker'); 
  const [showUserIdInSettings, setShowUserIdInSettings] = useState(false); 

  // Tracker Page State
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

  // Settings Page State
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTimeoutRef = useRef(null);
  const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
  const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);
  const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');


  // Submissive's Name states
  const [submissivesNameInput, setSubmissivesNameInput] = useState('');
  const [savedSubmissivesName, setSavedSubmissivesName] = useState('');
  const [nameMessage, setNameMessage] = useState('');

  // Event Log State
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

  // Pause Feature State
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
  
  // Restore Session Prompt State
  const [showRestoreSessionPrompt, setShowRestoreSessionPrompt] = useState(false);
  const [loadedSessionData, setLoadedSessionData] = useState(null);
  const [hasSessionEverBeenActive, setHasSessionEverBeenActive] = useState(false);


  const timerInChastityRef = useRef(null);
  const timerCageOffRef = useRef(null);

  // --- Google Analytics Initialization ---
  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      if (typeof window.gtag === 'function') {
        window.gtag('config', GA_MEASUREMENT_ID, {
          send_page_view: false 
        });
        console.log("Google Analytics configured with ID:", GA_MEASUREMENT_ID);
      } else {
        console.warn("gtag.js not found. Ensure it's loaded in index.html before the app script.");
      }
    } else {
      console.warn("Google Analytics Measurement ID (VITE_GA_MEASUREMENT_ID) is not set in .env file.");
    }
  }, []); // Runs once on component mount

  // --- Google Analytics Page View Tracking ---
  useEffect(() => {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function' && isAuthReady) { 
      const pagePath = `/${currentPage}`;
      const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1').trim(); 
      
      console.log(`GA: Tracking page_view for ${pageTitle} (${pagePath})`);
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_path: pagePath,
        user_id: userId 
      });
    }
  }, [currentPage, isAuthReady, userId]); 


  const getDocRef = useCallback((targetUserId = userId) => { 
    if (!targetUserId) return null;
    return doc(db, "artifacts", appIdForFirestore, "users", targetUserId); 
  }, [userId]); 

  const getEventsCollectionRef = useCallback((targetUserId = userId) => { 
    if (!targetUserId || !db || !appIdForFirestore || targetUserId.trim() === '' || appIdForFirestore.trim() === '') { 
        console.error("App.js: getEventsCollectionRef - Returning null due to missing/invalid targetUserId, db, or appIdForFirestore.", { targetUserId, dbExists: !!db, appIdForFirestore });
        return null;
    }
    try {
        const ref = collection(db, "artifacts", appIdForFirestore, "users", targetUserId, "sexualEventsLog"); 
        return ref;
    } catch (error) {
        console.error("App.js: getEventsCollectionRef - Error creating collection reference:", error);
        return null;
    }
  }, [userId]); 
  
  useEffect(() => { 
    /* global __initial_auth_token */ 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true); 
      } else {
        if (!userId && !isAuthReady) { 
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("App.js: Initial sign-in error:", error);
                setIsAuthReady(false); 
                setUserId(null);
            }
        } else {
            if (userId) console.log("App.js: User signed out or auth state changed to no user.");
            setUserId(null);
            setIsAuthReady(false);
        }
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
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

  const applyLoadedData = useCallback((data, isRestoringFromOtherUser = false) => {
    console.log("App.js: applyLoadedData called. isRestoringFromOtherUser:", isRestoringFromOtherUser, "Data:", data);
    const loadedHist = (data.chastityHistory || []).map(item => {
        const startTime = item.startTime?.toDate();
        const endTime = item.endTime?.toDate();
        return {
          ...item,
          startTime: startTime && !isNaN(startTime.getTime()) ? startTime : null,
          endTime: endTime && !isNaN(endTime.getTime()) ? endTime : null,
          totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0, 
          pauseEvents: (item.pauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate(), endTime: p.endTime?.toDate() }))
        };
      });
      setChastityHistory(loadedHist);
      setTotalTimeCageOff(data.totalTimeCageOff || 0); 
      const cName = data.submissivesName || data.userAlias || '';
      setSavedSubmissivesName(cName); 
      setSubmissivesNameInput(cName); 
      const lPauseEndTime = data.lastPauseEndTime?.toDate();
      setLastPauseEndTime(lPauseEndTime && !isNaN(lPauseEndTime.getTime()) ? lPauseEndTime : null);
      
      let newHasActive = data.hasSessionEverBeenActive || false;
      if (isRestoringFromOtherUser) {
          newHasActive = true; 
      } else if (!newHasActive && loadedHist.length > 0) {
          newHasActive = true; 
      }
      setHasSessionEverBeenActive(newHasActive);
      console.log("App.js: applyLoadedData - Setting hasSessionEverBeenActive to:", newHasActive);


    if (isRestoringFromOtherUser) { 
        console.log("App.js: applyLoadedData - Restoring from other user's data.");
        const loadedCageOn = data.isCageOn || false;
        const loadedCageOnTime = data.cageOnTime?.toDate();
        const loadedPauseStart = data.pauseStartTime?.toDate();
        setIsCageOn(loadedCageOn);
        setCageOnTime(loadedCageOn && loadedCageOnTime && !isNaN(loadedCageOnTime.getTime()) ? loadedCageOnTime : null);
        setTimeInChastity(loadedCageOn ? (data.timeInChastity || 0) : 0);
        setIsPaused(loadedCageOn ? (data.isPaused || false) : false);
        setPauseStartTime(loadedCageOn && (data.isPaused || false) && loadedPauseStart && !isNaN(loadedPauseStart.getTime()) ? loadedPauseStart : null);
        setAccumulatedPauseTimeThisSession(loadedCageOn ? (data.accumulatedPauseTimeThisSession || 0) : 0);
        setCurrentSessionPauseEvents(loadedCageOn ? (data.currentSessionPauseEvents || []) : []);
    } else {
        const activeSessionIsCageOnLoaded = data.isCageOn || false;
        const activeSessionCageOnTimeLoaded = data.cageOnTime?.toDate();

        if (activeSessionIsCageOnLoaded && activeSessionCageOnTimeLoaded && !isNaN(activeSessionCageOnTimeLoaded.getTime())) {
            console.log("App.js: applyLoadedData - Active session found for current user. Preparing restore prompt.");
            const loadedPauseStartTimeFromData = data.pauseStartTime?.toDate();
            setLoadedSessionData({ 
                isCageOn: true, cageOnTime: activeSessionCageOnTimeLoaded, timeInChastity: data.timeInChastity || 0,
                isPaused: data.isPaused || false, 
                pauseStartTime: loadedPauseStartTimeFromData && !isNaN(loadedPauseStartTimeFromData.getTime()) ? loadedPauseStartTimeFromData : null,
                accumulatedPauseTimeThisSession: data.accumulatedPauseTimeThisSession || 0,
                currentSessionPauseEvents: (data.currentSessionPauseEvents || []).map(p => ({ ...p, startTime: p.startTime?.toDate(), endTime: p.endTime?.toDate() })),
            });
            setIsCageOn(true); setCageOnTime(activeSessionCageOnTimeLoaded); setTimeInChastity(data.timeInChastity || 0); 
            setIsPaused(true); setPauseStartTime(new Date()); 
            setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
            setCurrentSessionPauseEvents(data.currentSessionPauseEvents || []);
            setShowRestoreSessionPrompt(true);
        } else {
            console.log("App.js: applyLoadedData - No active session for current user. Setting to neutral off state.");
            setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0);
            setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
            setLivePauseDuration(0);
            
            if (newHasActive) { 
                if (loadedHist.length > 0) {
                    const lastPeriod = loadedHist[loadedHist.length - 1];
                    const lastSessionEndTime = lastPeriod.endTime; 
                    setTimeCageOff(Math.max(0, Math.floor((new Date().getTime() - (lastSessionEndTime ? lastSessionEndTime.getTime() : new Date().getTime())) / 1000)));
                } else { setTimeCageOff(0); }
            } else {
                 setTimeCageOff(0); 
            }
        }
    }
  }, [setHasSessionEverBeenActive]); 

  useEffect(() => { 
    if (!isAuthReady || !userId) {
      return;
    }
    const loadInitialData = async () => {
      console.log("App.js: loadInitialData - Attempting to load data for userId:", userId);
      const docRef = getDocRef(); 
      if (!docRef) { 
          console.log("App.js: loadInitialData - No docRef, setting default initial state.");
          setHasSessionEverBeenActive(false);
          setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
          setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
          setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
          setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
          return; 
      }
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          applyLoadedData(docSnap.data(), false); 
        } else { 
           console.log("App.js: loadInitialData - No document found, initializing all to default 'off' state.");
           setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
           setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
           setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
           setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
           setPauseCooldownMessage(''); setLivePauseDuration(0);
           setHasSessionEverBeenActive(false);
        }
      } catch (error) { 
          console.error("Error loading initial tracker data:", error); 
          setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
          setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
          setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
          setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
          setPauseCooldownMessage(''); setLivePauseDuration(0);
          setHasSessionEverBeenActive(false);
      } 
    };
    loadInitialData();
  }, [isAuthReady, userId, getDocRef, applyLoadedData]); 

  const fetchEvents = useCallback(async (targetUserId = userId) => { 
    if (!isAuthReady || !targetUserId) return;
    setIsLoadingEvents(true);
    const eventsColRef = getEventsCollectionRef(targetUserId);
    if (!eventsColRef) { 
        setEventLogMessage("Error: Could not get event log reference.");
        setTimeout(() => setEventLogMessage(''), 3000);
        setIsLoadingEvents(false); 
        return; 
    }
    try {
        const q = query(eventsColRef, orderBy("eventTimestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => {
            const eventData = doc.data();
            const eventTS = eventData.eventTimestamp?.toDate();
            return { 
                id: doc.id, 
                ...eventData, 
                eventTimestamp: eventTS && !isNaN(eventTS.getTime()) ? eventTS : new Date() 
            };
        });
        setSexualEventsLog(events); 
    } catch (error) { 
        console.error("App.js: fetchEvents - Error fetching events:", error);
        setEventLogMessage("Failed to load events.");
        setTimeout(() => setEventLogMessage(''), 3000);
    } 
    finally { 
        setIsLoadingEvents(false); 
    }
  }, [isAuthReady, userId, getEventsCollectionRef]); 

  useEffect(() => { 
    if ((currentPage === 'logEvent' || currentPage === 'fullReport') && isAuthReady) { 
        fetchEvents(); 
    } 
  }, [currentPage, fetchEvents, isAuthReady]);

  const saveDataToFirestore = useCallback(async (dataToSave) => { 
    if (!isAuthReady || !userId) {
        console.warn("saveDataToFirestore: Auth not ready or no userId. Aborting save.");
        return;
    }
    const docRef = getDocRef(); 
    if (!docRef) {
        console.error("saveDataToFirestore: Could not get document reference. Aborting save.");
        return;
    }
    try {
      const firestoreReadyData = { ...dataToSave, hasSessionEverBeenActive }; 
      const toTimestampIfDate = (date) => {
          if (date instanceof Date && !isNaN(date.getTime())) return Timestamp.fromDate(date);
          if (typeof date === 'string') { 
              const parsedDate = new Date(date);
              if (!isNaN(parsedDate.getTime())) return Timestamp.fromDate(parsedDate);
          }
          return null; 
      };

      firestoreReadyData.cageOnTime = toTimestampIfDate(firestoreReadyData.cageOnTime);
      if (firestoreReadyData.chastityHistory) {
        firestoreReadyData.chastityHistory = firestoreReadyData.chastityHistory.map(item => ({
          ...item,
          startTime: toTimestampIfDate(item.startTime),
          endTime: toTimestampIfDate(item.endTime),
          pauses: (item.pauses || []).map(p => ({
              ...p,
              startTime: toTimestampIfDate(p.startTime),
              endTime: toTimestampIfDate(p.endTime),
          }))
        }));
      }
      firestoreReadyData.pauseStartTime = toTimestampIfDate(firestoreReadyData.pauseStartTime);
      firestoreReadyData.lastPauseEndTime = toTimestampIfDate(firestoreReadyData.lastPauseEndTime); 
      if (firestoreReadyData.currentSessionPauseEvents) {
          firestoreReadyData.currentSessionPauseEvents = firestoreReadyData.currentSessionPauseEvents.map(p => ({
              ...p,
              startTime: toTimestampIfDate(p.startTime),
              endTime: toTimestampIfDate(p.endTime)
          }));
      }
      
      if (typeof firestoreReadyData.submissivesName === 'undefined') firestoreReadyData.submissivesName = savedSubmissivesName; 
      if (Object.prototype.hasOwnProperty.call(firestoreReadyData, 'userAlias')) delete firestoreReadyData.userAlias;
      
      await setDoc(docRef, firestoreReadyData, { merge: true });
    } catch (error) { console.error("Error saving main data to Firestore:", error); }
  }, [userId, getDocRef, isAuthReady, savedSubmissivesName, hasSessionEverBeenActive]); 
  
  useEffect(() => { 
    if (isCageOn && isPaused === false && isAuthReady) { 
      if (cageOnTime && cageOnTime instanceof Date && !isNaN(cageOnTime.getTime())) {
          const now = new Date();
          const initialElapsed = Math.max(0, Math.floor((now.getTime() - cageOnTime.getTime()) / 1000));
          if (timeInChastity === 0 || (cageOnTime && cageOnTime.getTime() !== (tempStartTime?.getTime() || 0))) { 
            setTimeInChastity(initialElapsed);
          }
      }
      timerInChastityRef.current = setInterval(() => {
        setTimeInChastity(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (timerInChastityRef.current) {
        clearInterval(timerInChastityRef.current);
      }
    }
    return () => { 
      if (timerInChastityRef.current) {
        clearInterval(timerInChastityRef.current);
      }
    };
  }, [isCageOn, isPaused, cageOnTime, isAuthReady, timeInChastity, tempStartTime]); 

  useEffect(() => { 
    if (!isCageOn && isAuthReady && hasSessionEverBeenActive) { 
      timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
    } else { 
      if (timerCageOffRef.current) {
        clearInterval(timerCageOffRef.current);
      }
    }
    return () => { 
      if (timerCageOffRef.current) {
        clearInterval(timerCageOffRef.current);
      }
    };
  }, [isCageOn, isAuthReady, hasSessionEverBeenActive]); 

  useEffect(() => {
    if (isPaused && pauseStartTime) {
        setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000)); 
        pauseDisplayTimerRef.current = setInterval(() => {
            setLivePauseDuration(prev => prev + 1);
        }, 1000);
    } else {
        if (pauseDisplayTimerRef.current) {
            clearInterval(pauseDisplayTimerRef.current);
        }
        setLivePauseDuration(0); 
    }
    return () => {
        if (pauseDisplayTimerRef.current) {
            clearInterval(pauseDisplayTimerRef.current);
        }
    };
  }, [isPaused, pauseStartTime]);

  const handleInitiatePause = useCallback(() => {
    console.log("App.js: handleInitiatePause called. LastPauseEndTime:", lastPauseEndTime);
    setPauseCooldownMessage(''); 
    if (lastPauseEndTime) {
        const twelveHoursInMillis = 12 * 60 * 60 * 1000;
        const timeSinceLastPauseEnd = new Date().getTime() - lastPauseEndTime.getTime();
        if (timeSinceLastPauseEnd < twelveHoursInMillis) {
            const remainingTime = twelveHoursInMillis - timeSinceLastPauseEnd;
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const cooldownMsg = `You can pause again in approximately ${hours}h ${minutes}m.`;
            setPauseCooldownMessage(cooldownMsg); 
            setTimeout(() => setPauseCooldownMessage(''), 5000);
            return;
        }
    }
    setShowPauseReasonModal(true);
  }, [lastPauseEndTime]);

  const handleConfirmPause = useCallback(async () => {
    if (!isCageOn) { setShowPauseReasonModal(false); setReasonForPauseInput(''); return; }
    const now = new Date();
    const newPauseEvent = { id: crypto.randomUUID(), startTime: now, reason: reasonForPauseInput.trim() || "No reason provided", endTime: null, duration: null };
    setIsPaused(true);
    setPauseStartTime(now);
    setCurrentSessionPauseEvents(prev => [...prev, newPauseEvent]);
    setShowPauseReasonModal(false); setReasonForPauseInput('');
    await saveDataToFirestore({ isPaused: true, pauseStartTime: now, accumulatedPauseTimeThisSession, currentSessionPauseEvents: [...currentSessionPauseEvents, newPauseEvent], lastPauseEndTime });
  }, [isCageOn, reasonForPauseInput, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore, lastPauseEndTime]);

  const handleCancelPauseModal = useCallback(() => { setShowPauseReasonModal(false); setReasonForPauseInput(''); }, []);

  const handleResumeSession = useCallback(async () => {
    if (!isPaused || !pauseStartTime) { setIsPaused(false); setPauseStartTime(null); setLivePauseDuration(0); return; }
    const endTime = new Date();
    const currentPauseDuration = Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000);
    const newAccumulatedPauseTime = accumulatedPauseTimeThisSession + currentPauseDuration;
    const updatedSessionPauses = currentSessionPauseEvents.map((event, index) => (index === currentSessionPauseEvents.length - 1 && !event.endTime) ? { ...event, endTime, duration: currentPauseDuration } : event);
    setAccumulatedPauseTimeThisSession(newAccumulatedPauseTime);
    setIsPaused(false); setPauseStartTime(null); setCurrentSessionPauseEvents(updatedSessionPauses);
    setLivePauseDuration(0); setLastPauseEndTime(endTime); 
    await saveDataToFirestore({ isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: newAccumulatedPauseTime, currentSessionPauseEvents: updatedSessionPauses, lastPauseEndTime: endTime });
  }, [isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore]);

  const handleToggleCage = useCallback(() => { 
    if (!isAuthReady || isPaused) return;
    const currentTime = new Date();
    if (confirmReset) { setConfirmReset(false); if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current); }
    if (!isCageOn) { 
      const newTotalOff = totalTimeCageOff + timeCageOff; 
      setTotalTimeCageOff(newTotalOff); 
      setCageOnTime(currentTime); 
      setIsCageOn(true); setTimeInChastity(0); setTimeCageOff(0);
      setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
      setPauseStartTime(null); setIsPaused(false); setLastPauseEndTime(null); 
      setHasSessionEverBeenActive(true);
      saveDataToFirestore({ isCageOn: true, cageOnTime: currentTime, totalTimeCageOff: newTotalOff, timeInChastity: 0, chastityHistory, totalChastityTime, submissivesName: savedSubmissivesName, isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime: null, hasSessionEverBeenActive: true });
    } else { 
      setTempEndTime(currentTime); setTempStartTime(cageOnTime); 
      setShowReasonModal(true); 
    }
  }, [isAuthReady, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, confirmReset, saveDataToFirestore, chastityHistory, totalChastityTime, savedSubmissivesName, resetTimeoutRef, isPaused, setHasSessionEverBeenActive]);

  const handleConfirmRemoval = useCallback(() => { 
    if (!isAuthReady) return;
    if (tempStartTime && tempEndTime) {
      let currentAccumulatedPause = accumulatedPauseTimeThisSession;
      let finalPauseEvents = currentSessionPauseEvents;
      if (isPaused && pauseStartTime) {
          const currentPauseDuration = Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000);
          currentAccumulatedPause += currentPauseDuration;
          finalPauseEvents = currentSessionPauseEvents.map((event, index) => (index === currentSessionPauseEvents.length - 1 && !event.endTime) ? { ...event, endTime: tempEndTime, duration: currentPauseDuration } : event);
      }
      const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));
      const newHistoryEntry = { id: crypto.randomUUID(), periodNumber: chastityHistory.length + 1, startTime: tempStartTime, endTime: tempEndTime, duration: rawDurationSeconds, reasonForRemoval: reasonForRemoval.trim() || 'No reason provided', totalPauseDurationSeconds: currentAccumulatedPause, pauseEvents: finalPauseEvents };
      const updatedHistoryState = [...chastityHistory, newHistoryEntry];
      setChastityHistory(updatedHistoryState); 
      setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0); 
      setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
      setHasSessionEverBeenActive(true); 
      saveDataToFirestore({ isCageOn: false, cageOnTime: null, timeInChastity: 0, chastityHistory: updatedHistoryState, totalTimeCageOff, submissivesName: savedSubmissivesName, isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime, hasSessionEverBeenActive: true });
    }
    setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false);
  }, [isAuthReady, tempStartTime, tempEndTime, chastityHistory, reasonForRemoval, saveDataToFirestore, totalTimeCageOff, savedSubmissivesName, accumulatedPauseTimeThisSession, currentSessionPauseEvents, lastPauseEndTime, isPaused, pauseStartTime, setHasSessionEverBeenActive]);

  const handleCancelRemoval = useCallback(() => { setReasonForRemoval(''); setTempEndTime(null); setTempStartTime(null); setShowReasonModal(false); }, []);
  
  const clearAllEvents = useCallback(async () => { 
    if (!isAuthReady || !userId) return;
    const eventsColRef = getEventsCollectionRef();
    if (!eventsColRef) return;
    try {
        const q = query(eventsColRef); 
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, eventsColRef.path, docSnapshot.id)));
        await Promise.all(deletePromises);
        setSexualEventsLog([]); 
    } catch (error) { 
        console.error("App.js: clearAllEvents - Error clearing sexual events:", error); 
    }
  }, [isAuthReady, userId, getEventsCollectionRef]); 

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
        setHasSessionEverBeenActive(false);
        setConfirmReset(false); setShowReasonModal(false); 
        saveDataToFirestore({ cageOnTime: null, isCageOn: false, timeInChastity: 0, chastityHistory: [], totalChastityTime: 0, totalTimeCageOff: 0, submissivesName: '', isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [], lastPauseEndTime: null, hasSessionEverBeenActive: false });
        clearAllEvents(); 
        setNameMessage("All data reset. Submissive's Name cleared."); 
        setTimeout(() => setNameMessage(''), 4000);
        setCurrentPage('tracker'); 
      } else { 
        setConfirmReset(true); 
        resetTimeoutRef.current = setTimeout(() => { setConfirmReset(false); }, 3000); 
      }
  }, [isAuthReady, confirmReset, saveDataToFirestore, clearAllEvents, setCurrentPage, setNameMessage, setConfirmReset, resetTimeoutRef, setHasSessionEverBeenActive]);
  
  const handleSubmissivesNameInputChange = useCallback((event) => { setSubmissivesNameInput(event.target.value); }, []);
  const handleSetSubmissivesName = useCallback(async () => { 
    if (!isAuthReady || !userId) { setNameMessage("Cannot set name: User not authenticated."); setTimeout(() => setNameMessage(''), 3000); return; }
    if (savedSubmissivesName) { setNameMessage("Name is already set. Perform a 'Reset All Data' in Settings to change it."); setTimeout(() => setNameMessage(''), 4000); return; }
    const trimmedName = submissivesNameInput.trim();
    if (!trimmedName) { setNameMessage("Name cannot be empty."); setTimeout(() => setNameMessage(''), 3000); return; }
    setSavedSubmissivesName(trimmedName);
    await saveDataToFirestore({ submissivesName: trimmedName, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime, hasSessionEverBeenActive });
    setNameMessage("Submissive's Name set successfully!"); setTimeout(() => setNameMessage(''), 3000);
  }, [isAuthReady, userId, savedSubmissivesName, submissivesNameInput, saveDataToFirestore, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime, hasSessionEverBeenActive]);
  
  const handleToggleUserIdVisibility = useCallback(() => { setShowUserIdInSettings(prev => !prev); }, []);
  const handleEventTypeChange = useCallback((type) => { setSelectedEventTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]); }, []);
  const handleOtherEventTypeCheckChange = useCallback((e) => { setOtherEventTypeChecked(e.target.checked); if (!e.target.checked) { setOtherEventTypeDetail(''); } }, []);
  const handleLogNewEvent = useCallback(async (e) => { 
    e.preventDefault();
    if (!isAuthReady || !userId) { 
        setEventLogMessage("Authentication required or User ID missing.");
        setTimeout(() => setEventLogMessage(''), 3000); 
        return; 
    }
    const finalEventTypes = [...selectedEventTypes];
    let finalOtherDetail = null;
    if (otherEventTypeChecked && otherEventTypeDetail.trim()) {
        finalOtherDetail = otherEventTypeDetail.trim();
    }
    if (finalEventTypes.length === 0 && !finalOtherDetail) {
        setEventLogMessage("Please select at least one event type or specify 'Other'.");
        setTimeout(() => setEventLogMessage(''), 3000);
        return;
    }
    const eventsColRef = getEventsCollectionRef(); 
    if (!eventsColRef) {
        setEventLogMessage("Error: Event log reference could not be created. Check console.");
        setTimeout(() => setEventLogMessage(''), 3000);
        return;
    }
    const dateTimeString = `${newEventDate}T${newEventTime}`;
    const eventTimestamp = new Date(dateTimeString);
    if (isNaN(eventTimestamp.getTime())) { 
        setEventLogMessage("Invalid date/time.");
        setTimeout(() => setEventLogMessage(''), 3000); 
        return; 
    }
    const durationHours = parseInt(newEventDurationHours, 10) || 0;
    const durationMinutes = parseInt(newEventDurationMinutes, 10) || 0;
    const durationSeconds = (durationHours * 3600) + (durationMinutes * 60);
    const selfOrgasmAmount = selectedEventTypes.includes("Orgasm (Self)") && newEventSelfOrgasmAmount ? parseInt(newEventSelfOrgasmAmount, 10) || null : null;
    const partnerOrgasmAmount = selectedEventTypes.includes("Orgasm (Partner)") && newEventPartnerOrgasmAmount ? parseInt(newEventPartnerOrgasmAmount, 10) || null : null;
    const newEventData = { 
        eventTimestamp: Timestamp.fromDate(eventTimestamp), 
        loggedAt: serverTimestamp(), 
        types: finalEventTypes, 
        otherTypeDetail: finalOtherDetail, 
        notes: newEventNotes.trim(),
        durationSeconds: durationSeconds > 0 ? durationSeconds : null,
        selfOrgasmAmount: selfOrgasmAmount,
        partnerOrgasmAmount: partnerOrgasmAmount
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
        console.error("App.js: handleLogNewEvent - Error logging event to Firestore:", error); 
        setEventLogMessage("Failed to log event. Check console for details."); 
    }
    setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, userId, selectedEventTypes, otherEventTypeChecked, otherEventTypeDetail, newEventDate, newEventTime, newEventDurationHours, newEventDurationMinutes, newEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, newEventNotes, getEventsCollectionRef, fetchEvents, setEventLogMessage, setNewEventDate, setNewEventTime, setSelectedEventTypes, setOtherEventTypeChecked, setOtherEventTypeDetail, setNewEventNotes, setNewEventDurationHours, setNewEventDurationMinutes, setNewEventSelfOrgasmAmount, setNewEventPartnerOrgasmAmount ]);
  
  const handleExportTrackerCSV = useCallback(() => { 
    if (!isAuthReady || chastityHistory.length === 0) {
        setEventLogMessage("No tracker history to export.");
        setTimeout(() => setEventLogMessage(''), 3000);
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Period #,Start Time,End Time,Raw Duration (HH:MM:SS),Total Pause Duration (HH:MM:SS),Effective Chastity Duration (HH:MM:SS),Reason for Removal,Pause Events\n";

    chastityHistory.forEach(p => {
        const rawDurationFormatted = formatElapsedTime(p.duration);
        const pauseDurationFormatted = formatElapsedTime(p.totalPauseDurationSeconds || 0);
        const effectiveDuration = Math.max(0, p.duration - (p.totalPauseDurationSeconds || 0));
        const effectiveDurationFormatted = formatElapsedTime(effectiveDuration);
        
        let pauseEventsString = "";
        if (p.pauseEvents && p.pauseEvents.length > 0) {
            pauseEventsString = p.pauseEvents.map(pe => 
                `[Paused: ${formatTime(pe.startTime, true, true)} to ${formatTime(pe.endTime, true, true)} (${formatElapsedTime(pe.duration || 0)}) Reason: ${pe.reason || 'N/A'}]`
            ).join('; ');
        }
        
        const row = [
            p.periodNumber,
            formatTime(p.startTime, true, true), 
            formatTime(p.endTime, true, true),   
            rawDurationFormatted,
            pauseDurationFormatted,
            effectiveDurationFormatted,
            `"${(p.reasonForRemoval || '').replace(/"/g, '""')}"`, 
            `"${pauseEventsString.replace(/"/g, '""')}"` 
        ].join(",");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "chastity_tracker_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setEventLogMessage("Tracker history exported successfully!");
    setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, chastityHistory]);

  const handleExportEventLogCSV = useCallback(() => { 
    if (!isAuthReady || sexualEventsLog.length === 0) {
        setEventLogMessage("No events to export.");
        setTimeout(() => setEventLogMessage(''), 3000);
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date & Time,Type(s),Other Detail,Duration (HH:MM:SS),Orgasm (Self) Count,Orgasm (Partner) Count,Notes\n";

    sexualEventsLog.slice().reverse().forEach(event => { 
        const typesString = (event.types || []).join('; ');
        const durationFormatted = event.durationSeconds ? formatElapsedTime(event.durationSeconds) : '';
        const row = [
            formatTime(event.eventTimestamp, true, true), 
            `"${typesString.replace(/"/g, '""')}"`,
            `"${(event.otherTypeDetail || '').replace(/"/g, '""')}"`,
            durationFormatted,
            event.selfOrgasmAmount || '',
            event.partnerOrgasmAmount || '',
            `"${(event.notes || '').replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sexual_events_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setEventLogMessage("Event log exported successfully!");
    setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, sexualEventsLog]);

  const handleExportTextReport = useCallback(() => {
    if (!isAuthReady) {
        setEventLogMessage("Authentication not ready.");
        setTimeout(() => setEventLogMessage(''), 3000);
        return;
    }

    let reportContent = `ChastityOS Report\n`;
    reportContent += `Generated: ${formatTime(new Date(), true, true)}\n`;
    reportContent += `Submissive's Name: ${savedSubmissivesName || '(Not Set)'}\n`;
    reportContent += `User ID: ${userId || 'N/A'}\n`;
    reportContent += `--------------------------------------\n\n`;

    reportContent += `CURRENT STATUS:\n`;
    reportContent += `Cage Status: ${isCageOn ? (isPaused ? 'ON (Paused)' : 'ON') : 'OFF'}\n`;
    if (isCageOn && cageOnTime) {
        reportContent += `Current Cage On Since: ${formatTime(cageOnTime, true, true)}\n`;
        const effectiveSessionTime = timeInChastity - accumulatedPauseTimeThisSession;
        reportContent += `Effective Session In Chastity: ${formatElapsedTime(effectiveSessionTime)}\n`;
        if (isPaused && pauseStartTime) {
            reportContent += `Currently Paused For: ${formatElapsedTime(livePauseDuration)}\n`;
        }
        if(accumulatedPauseTimeThisSession > 0) {
            reportContent += `Total Time Paused This Session: ${formatElapsedTime(isPaused && pauseStartTime ? accumulatedPauseTimeThisSession + livePauseDuration : accumulatedPauseTimeThisSession)}\n`;
        }
    } else {
        reportContent += `Current Session Cage Off: ${formatElapsedTime(timeCageOff)}\n`;
    }
    reportContent += `\nTOTALS:\n`;
    reportContent += `Total Time In Chastity (Effective): ${formatElapsedTime(totalChastityTime)}\n`;
    reportContent += `Total Time Cage Off: ${formatElapsedTime(totalTimeCageOff)}\n`;
    reportContent += `Overall Total Paused Time (All Sessions): ${formatElapsedTime(overallTotalPauseTime)}\n`;
    reportContent += `--------------------------------------\n\n`;

    reportContent += `CHASTITY HISTORY (Most Recent First):\n`;
    if (chastityHistory.length > 0) {
        chastityHistory.slice().reverse().forEach(p => {
            const effectiveDuration = p.duration - (p.totalPauseDurationSeconds || 0);
            reportContent += `Period #${p.periodNumber}:\n`;
            reportContent += `  Start Time: ${formatTime(p.startTime, true, true)}\n`;
            reportContent += `  End Time:   ${formatTime(p.endTime, true, true)}\n`;
            reportContent += `  Raw Duration: ${formatElapsedTime(p.duration)}\n`;
            reportContent += `  Total Pause Duration: ${formatElapsedTime(p.totalPauseDurationSeconds || 0)}\n`;
            reportContent += `  Effective Chastity Duration: ${formatElapsedTime(effectiveDuration)}\n`;
            reportContent += `  Reason for Removal: ${p.reasonForRemoval || 'N/A'}\n`;
            if (p.pauseEvents && p.pauseEvents.length > 0) {
                reportContent += `  Pause Events:\n`;
                p.pauseEvents.forEach(pe => {
                    reportContent += `    - Paused: ${formatTime(pe.startTime, true, true)} to ${formatTime(pe.endTime, true, true)} (${formatElapsedTime(pe.duration || 0)}) Reason: ${pe.reason || 'N/A'}\n`;
                });
            }
            reportContent += `\n`;
        });
    } else {
        reportContent += `No chastity history.\n\n`;
    }
    reportContent += `--------------------------------------\n\n`;

    reportContent += `SEXUAL EVENTS LOG (Most Recent First):\n`;
    if (sexualEventsLog.length > 0) {
        sexualEventsLog.forEach(event => { 
            const typesString = (event.types || []).map(type => type === "Orgasm (Self)" && savedSubmissivesName ? `Orgasm (${savedSubmissivesName})` : type).join(', ');
            const otherDetailString = event.otherTypeDetail ? `, Other: ${event.otherTypeDetail}` : '';
            const fullTypeString = `${typesString}${otherDetailString}` || 'N/A';
            
            let orgasmCounts = [];
            if (event.selfOrgasmAmount) orgasmCounts.push(`Self: ${event.selfOrgasmAmount}`);
            if (event.partnerOrgasmAmount) orgasmCounts.push(`Partner: ${event.partnerOrgasmAmount}`);
            const orgasmString = orgasmCounts.length > 0 ? orgasmCounts.join(', ') : 'N/A';

            reportContent += `Date & Time: ${formatTime(event.eventTimestamp, true, true)}\n`;
            reportContent += `  Type(s): ${fullTypeString}\n`;
            reportContent += `  Duration: ${event.durationSeconds ? formatElapsedTime(event.durationSeconds) : 'N/A'}\n`;
            reportContent += `  Orgasm Count(s): ${orgasmString}\n`;
            reportContent += `  Notes: ${event.notes || 'N/A'}\n\n`;
        });
    } else {
        reportContent += `No sexual events logged.\n`;
    }
    reportContent += `--------------------------------------\nEnd of Report`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `ChastityOS_Report_${new Date().toISOString().slice(0,10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setEventLogMessage("Text report exported successfully!");
    setTimeout(() => setEventLogMessage(''), 3000);
  }, [isAuthReady, savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, overallTotalPauseTime, isPaused, accumulatedPauseTimeThisSession, livePauseDuration, pauseStartTime]);

  // --- Restore Data from User ID Handlers ---
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
    console.log("App.js: handleConfirmRestoreFromId - Attempting to restore from User ID:", restoreUserIdInput);
    if (!restoreUserIdInput.trim() || !userId) { 
        setRestoreFromIdMessage("Invalid input or current user not identified.");
        setTimeout(() => setRestoreFromIdMessage(''), 3000);
        setShowRestoreFromIdPrompt(false);
        return;
    }

    const targetDocRef = doc(db, "artifacts", appIdForFirestore, "users", restoreUserIdInput.trim());
    try {
        const docSnap = await getDoc(targetDocRef);
        if (docSnap.exists()) {
            const dataToRestore = docSnap.data();
            console.log("App.js: handleConfirmRestoreFromId - Data found for target User ID:", dataToRestore);
            
            applyLoadedData(dataToRestore, true); // Use applyLoadedData here
            
            const dataForCurrentUser = { ...dataToRestore, hasSessionEverBeenActive: true };
            await saveDataToFirestore(dataForCurrentUser); 
            
            setRestoreFromIdMessage("Data successfully restored and saved for the current user.");
            setRestoreUserIdInput('');
            setCurrentPage('tracker'); 
            if (isAuthReady && userId) { 
                fetchEvents(userId); 
            }

        } else {
            console.log("App.js: handleConfirmRestoreFromId - No data found for User ID:", restoreUserIdInput.trim());
            setRestoreFromIdMessage("No data found for the provided User ID.");
        }
    } catch (error) {
        console.error("Error restoring data from User ID:", error);
        setRestoreFromIdMessage("Error restoring data. See console.");
    }
    setShowRestoreFromIdPrompt(false);
    setTimeout(() => setRestoreFromIdMessage(''), 4000);
  };

  // --- Restore Session Prompt Handlers (from app load) ---
  const handleConfirmRestoreSession = useCallback(async () => {
    console.log("App.js: handleConfirmRestoreSession called. Loaded data:", loadedSessionData);
    if (loadedSessionData) {
        const loadedCageOnTime = loadedSessionData.cageOnTime instanceof Timestamp 
            ? loadedSessionData.cageOnTime.toDate() 
            : (typeof loadedSessionData.cageOnTime === 'string' ? new Date(loadedSessionData.cageOnTime) : loadedSessionData.cageOnTime);
        
        const loadedPauseStartTime = loadedSessionData.pauseStartTime instanceof Timestamp 
            ? loadedSessionData.pauseStartTime.toDate() 
            : (typeof loadedSessionData.pauseStartTime === 'string' ? new Date(loadedSessionData.pauseStartTime) : loadedSessionData.pauseStartTime);

        setIsCageOn(loadedSessionData.isCageOn);
        setCageOnTime(loadedCageOnTime);
        setTimeInChastity(loadedSessionData.timeInChastity || 0);
        setIsPaused(loadedSessionData.isPaused || false); 
        setPauseStartTime( (loadedSessionData.isPaused && loadedPauseStartTime && !isNaN(loadedPauseStartTime.getTime())) ? loadedPauseStartTime : null); 
        setAccumulatedPauseTimeThisSession(loadedSessionData.accumulatedPauseTimeThisSession || 0);
        setCurrentSessionPauseEvents(loadedSessionData.currentSessionPauseEvents || []);
        setHasSessionEverBeenActive(true); 

        await saveDataToFirestore({
            isCageOn: loadedSessionData.isCageOn,
            cageOnTime: loadedCageOnTime,
            timeInChastity: loadedSessionData.timeInChastity || 0,
            isPaused: loadedSessionData.isPaused || false, 
            pauseStartTime: (loadedSessionData.isPaused && loadedPauseStartTime && !isNaN(loadedPauseStartTime.getTime())) ? loadedPauseStartTime : null,
            accumulatedPauseTimeThisSession: loadedSessionData.accumulatedPauseTimeThisSession || 0,
            currentSessionPauseEvents: loadedSessionData.currentSessionPauseEvents || [],
            lastPauseEndTime, 
            submissivesName: savedSubmissivesName,
            totalTimeCageOff,
            hasSessionEverBeenActive: true
        });
        console.log("App.js: Session restored. isPaused is now:", loadedSessionData.isPaused || false);
    }
    setShowRestoreSessionPrompt(false);
    setLoadedSessionData(null);
  }, [loadedSessionData, saveDataToFirestore, lastPauseEndTime, savedSubmissivesName, totalTimeCageOff, setHasSessionEverBeenActive]);

  const handleDiscardAndStartNew = useCallback(async () => {
    console.log("App.js: handleDiscardAndStartNew called.");
    setIsCageOn(false);
    setCageOnTime(null);
    setTimeInChastity(0);
    setIsPaused(false);
    setPauseStartTime(null);
    setAccumulatedPauseTimeThisSession(0);
    setCurrentSessionPauseEvents([]);
    setTimeCageOff(0); 
    setHasSessionEverBeenActive(false); 
    
    await saveDataToFirestore({
        isCageOn: false,
        cageOnTime: null,
        timeInChastity: 0,
        isPaused: false,
        pauseStartTime: null,
        accumulatedPauseTimeThisSession: 0,
        currentSessionPauseEvents: [],
        chastityHistory, 
        totalChastityTime, 
        totalTimeCageOff, 
        submissivesName: savedSubmissivesName,
        lastPauseEndTime,
        hasSessionEverBeenActive: false 
    });

    setShowRestoreSessionPrompt(false);
    setLoadedSessionData(null);
    console.log("App.js: Discarded old session, starting fresh in Cage Off state. No timers running.");
  }, [saveDataToFirestore, chastityHistory, totalChastityTime, totalTimeCageOff, savedSubmissivesName, lastPauseEndTime, setHasSessionEverBeenActive]);


  // Main Render
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        <div className="flex items-center justify-center mb-4">
          <img src={appLogo} alt="ChastityOS Logo" className="h-12 w-auto mr-4" />
          <div className="flex flex-col items-start">
            <h1 className="text-2xl font-bold text-purple-400 tracking-wider">ChastityOS</h1>
            <p className="text-sm text-purple-200">Your personal chastity and FLR tracking web app</p>
          </div>
        </div>
        
        {savedSubmissivesName && <p className="text-lg text-purple-200 mb-6">For: <span className="font-semibold">{savedSubmissivesName}</span></p>}

        <nav className="mb-6 flex justify-center space-x-1 sm:space-x-2">
            {[{id: 'tracker', name: 'Chastity Tracker'}, {id: 'logEvent', name: 'Log Event'}, {id: 'fullReport', name: 'Full Report'}, {id: 'settings', name: 'Settings'}].map((page) => ( 
            <button type="button" key={page.id} onClick={() => setCurrentPage(page.id)}
                className={`py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${currentPage === page.id ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-700 text-purple-300 hover:bg-purple-500 hover:text-white'}`}>
                {page.name}
            </button>
            ))}
        </nav>
        
        {currentPage === 'tracker' && !showRestoreSessionPrompt && <h2 className="text-2xl font-bold text-purple-300 mb-4">Chastity Tracker</h2>}
        {currentPage === 'fullReport' && <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">Full Report</h2>}
        {currentPage === 'logEvent' && <h2 className="text-2xl font-bold text-purple-300 mb-4">Sexual Event Log</h2>}
        {currentPage === 'settings' && <h2 className="text-2xl font-bold text-purple-300 mb-6">Settings</h2>}

        <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
            {currentPage === 'tracker' && (
                <TrackerPage
                    isAuthReady={isAuthReady} isCageOn={isCageOn} cageOnTime={cageOnTime} timeInChastity={timeInChastity} timeCageOff={timeCageOff}
                    totalChastityTime={totalChastityTime} totalTimeCageOff={totalTimeCageOff} chastityHistory={chastityHistory}
                    handleToggleCage={handleToggleCage} showReasonModal={showReasonModal} setShowReasonModal={setShowReasonModal}
                    reasonForRemoval={reasonForRemoval} setReasonForRemoval={setReasonForRemoval} handleConfirmRemoval={handleConfirmRemoval} handleCancelRemoval={handleCancelRemoval}
                    isPaused={isPaused} handleInitiatePause={handleInitiatePause} handleResumeSession={handleResumeSession}
                    showPauseReasonModal={showPauseReasonModal} handleCancelPauseModal={handleCancelPauseModal} reasonForPauseInput={reasonForPauseInput} setReasonForPauseInput={setReasonForPauseInput}
                    handleConfirmPause={handleConfirmPause} accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession} pauseStartTime={pauseStartTime}
                    livePauseDuration={livePauseDuration} pauseCooldownMessage={pauseCooldownMessage}
                    showRestoreSessionPrompt={showRestoreSessionPrompt} handleConfirmRestoreSession={handleConfirmRestoreSession}
                    handleDiscardAndStartNew={handleDiscardAndStartNew} loadedSessionData={loadedSessionData}
                />
            )}
            {currentPage === 'fullReport' && ( <FullReportPage {...{ savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, isLoadingEvents, isPaused, accumulatedPauseTimeThisSession, overallTotalPauseTime }} /> )}
            {currentPage === 'logEvent' && ( <LogEventPage {...{ isAuthReady, newEventDate, setNewEventDate, newEventTime, setNewEventTime, selectedEventTypes, handleEventTypeChange, otherEventTypeChecked, handleOtherEventTypeCheckChange, otherEventTypeDetail, setOtherEventTypeDetail, newEventNotes, setNewEventNotes, newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, setNewEventDurationMinutes, newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount, handleLogNewEvent, eventLogMessage, isLoadingEvents, sexualEventsLog, savedSubmissivesName }} /> )}
            {currentPage === 'settings' && ( <SettingsPage {...{ isAuthReady, eventLogMessage, handleExportTrackerCSV, chastityHistory, handleExportEventLogCSV, sexualEventsLog, handleResetAllData, confirmReset, nameMessage, handleExportTextReport, userId, showUserIdInSettings, handleToggleUserIdVisibility, savedSubmissivesName, submissivesNameInput, handleSubmissivesNameInputChange, handleSetSubmissivesName, restoreUserIdInput, handleRestoreUserIdInputChange, handleInitiateRestoreFromId, showRestoreFromIdPrompt, handleConfirmRestoreFromId, handleCancelRestoreFromId, restoreFromIdMessage }} /> )}
        </Suspense>
      </div>
      <footer className="mt-8 text-center text-xs text-gray-500">
        Copyright 2025 F4tDaddy Productions v3.4.1
      </footer>
    </div>
  );
};

export default App;
