import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, doc, getDoc, setDoc, Timestamp, setLogLevel,
    collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc
} from 'firebase/firestore';

// Import utility functions
import { formatTime, formatElapsedTime, EVENT_TYPES } from './utils'; // Assuming utils.js is in the same src directory

// Firebase Config - using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Optional
};

// It's good practice to ensure critical config values are present
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

// --- Lazy Load Page Components ---
// IMPORTANT: Ensure these files exist (e.g., in a 'src/pages/' directory)
// and contain the respective component code with a default export.
const TrackerPage = lazy(() => import('./pages/TrackerPage')); 
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// --- Main App Component ---
const App = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial data load
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

  const getDocRef = useCallback(() => { 
    if (!userId) return null;
    return doc(db, "artifacts", appIdForFirestore, "users", userId); 
  }, [userId]); 

  const getEventsCollectionRef = useCallback(() => { 
    if (!userId || !db || !appIdForFirestore || userId.trim() === '' || appIdForFirestore.trim() === '') { 
        console.error("App.js: getEventsCollectionRef - Returning null due to missing/invalid userId, db, or appIdForFirestore.", { userId, dbExists: !!db, appIdForFirestore });
        return null;
    }
    try {
        const ref = collection(db, "artifacts", appIdForFirestore, "users", userId, "sexualEventsLog"); 
        return ref;
    } catch (error) {
        console.error("App.js: getEventsCollectionRef - Error creating collection reference:", error);
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
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("App.js: Initial sign-in error:", error);
                setIsAuthReady(false); 
                setUserId(null);
                setIsLoading(false); 
            }
        } else {
            if (userId) console.log("App.js: User signed out or auth state changed to no user.");
            setUserId(null);
            setIsAuthReady(false);
        }
      }
    });
    return () => unsubscribe();
  }, []); 

  // Effect to calculate overall totals when chastityHistory changes
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


  useEffect(() => { 
    if (!isAuthReady || !userId) {
      if(isLoading && !isAuthReady && !auth.currentUser) setIsLoading(false); 
      return;
    }
    const loadTrackerData = async () => {
      setIsLoading(true); 
      console.log("App.js: loadTrackerData - Attempting to load data for userId:", userId);
      const docRef = getDocRef();
      if (!docRef) { 
          console.log("App.js: loadTrackerData - No docRef, setting default initial state (isLoading false).");
          setIsLoading(false); 
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
          const data = docSnap.data();
          console.log("App.js: loadTrackerData - Raw data from Firestore:", JSON.stringify(data, null, 2)); 
          
          const loadedHistory = (data.chastityHistory || []).map(item => {
            const startTime = item.startTime?.toDate();
            const endTime = item.endTime?.toDate();
            return {
              ...item,
              startTime: startTime && !isNaN(startTime.getTime()) ? startTime : null,
              endTime: endTime && !isNaN(endTime.getTime()) ? endTime : null,
              totalPauseDurationSeconds: item.totalPauseDurationSeconds || 0, 
              pauseEvents: (item.pauseEvents || []).map(p => { 
                  const pStartTime = p.startTime?.toDate();
                  const pEndTime = p.endTime?.toDate();
                  return {
                      ...p, 
                      startTime: pStartTime && !isNaN(pStartTime.getTime()) ? pStartTime : null, 
                      endTime: pEndTime && !isNaN(pEndTime.getTime()) ? pEndTime : null
                  };
              })
            };
          });
          setChastityHistory(loadedHistory);
          setTotalTimeCageOff(data.totalTimeCageOff || 0); 
          const currentName = data.submissivesName || data.userAlias || '';
          setSavedSubmissivesName(currentName); 
          setSubmissivesNameInput(currentName); 
          const loadedLastPauseEndTime = data.lastPauseEndTime?.toDate();
          setLastPauseEndTime(loadedLastPauseEndTime && !isNaN(loadedLastPauseEndTime.getTime()) ? loadedLastPauseEndTime : null);
          console.log("App.js: loadTrackerData - Loaded lastPauseEndTime from Firestore:", loadedLastPauseEndTime);

          const activeSessionIsCageOnLoaded = data.isCageOn || false;
          const activeSessionCageOnTimeLoaded = data.cageOnTime?.toDate();

          if (activeSessionIsCageOnLoaded && activeSessionCageOnTimeLoaded && !isNaN(activeSessionCageOnTimeLoaded.getTime())) {
            console.log("App.js: loadTrackerData - Active session found in Firestore. Preparing restore prompt.");
            const loadedPauseStartTimeFromData = data.pauseStartTime?.toDate();
            setLoadedSessionData({ 
                isCageOn: true,
                cageOnTime: activeSessionCageOnTimeLoaded,
                timeInChastity: data.timeInChastity || 0,
                isPaused: data.isPaused || false, 
                pauseStartTime: loadedPauseStartTimeFromData && !isNaN(loadedPauseStartTimeFromData.getTime()) ? loadedPauseStartTimeFromData : null,
                accumulatedPauseTimeThisSession: data.accumulatedPauseTimeThisSession || 0,
                currentSessionPauseEvents: (data.currentSessionPauseEvents || []).map(p => ({
                    ...p,
                    startTime: p.startTime?.toDate(),
                    endTime: p.endTime?.toDate()
                })),
            });
            
            // Set UI to a paused neutral state while prompt is shown
            setIsCageOn(true); 
            setCageOnTime(activeSessionCageOnTimeLoaded); 
            setTimeInChastity(data.timeInChastity || 0); 
            setIsPaused(true); 
            setPauseStartTime(new Date()); 
            setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
            setCurrentSessionPauseEvents(data.currentSessionPauseEvents || []);
            setHasSessionEverBeenActive(true); 
            setShowRestoreSessionPrompt(true);
            console.log("App.js: loadTrackerData - Showing restore prompt. App is in a 'paused neutral state'.");
          } else {
            if (activeSessionIsCageOnLoaded && (!activeSessionCageOnTimeLoaded || isNaN(activeSessionCageOnTimeLoaded.getTime()))) {
                console.warn("App.js: loadTrackerData - Inconsistent state from Firestore (isCageOn true, but cageOnTime invalid). Forcing Cage Off.");
            } else {
                console.log("App.js: loadTrackerData - No active/valid session in Firestore. Initializing to Cage Off. hasSessionEverBeenActive will depend on history.");
            }
            setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0);
            setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
            setLivePauseDuration(0);
            if (loadedHistory.length > 0) {
                const lastPeriod = loadedHistory[loadedHistory.length - 1];
                const lastSessionEndTime = lastPeriod.endTime; 
                setTimeCageOff(Math.max(0, Math.floor((new Date().getTime() - (lastSessionEndTime ? lastSessionEndTime.getTime() : new Date().getTime())) / 1000)));
                setHasSessionEverBeenActive(true);
            } else { 
                setTimeCageOff(0); 
                setHasSessionEverBeenActive(false);
            }
          }
        } else { 
           console.log("App.js: loadTrackerData - No document found, initializing all to default 'off' state.");
           setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
           setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
           setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
           setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
           setPauseCooldownMessage(''); setLivePauseDuration(0);
           setHasSessionEverBeenActive(false);
        }
      } catch (error) { 
          console.error("Error loading tracker data:", error); 
          setIsCageOn(false); setCageOnTime(null); setTimeInChastity(0); setTimeCageOff(0);
          setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]);
          setLastPauseEndTime(null); setChastityHistory([]); setSavedSubmissivesName(''); setSubmissivesNameInput('');
          setTotalChastityTime(0); setTotalTimeCageOff(0); setOverallTotalPauseTime(0);
          setPauseCooldownMessage(''); setLivePauseDuration(0);
          setHasSessionEverBeenActive(false);
      } 
      finally { setIsLoading(false); }
    };
    loadTrackerData();
  }, [isAuthReady, userId, getDocRef]); 

  const fetchEvents = useCallback(async () => { 
    if (!isAuthReady || !userId) return;
    setIsLoadingEvents(true);
    const eventsColRef = getEventsCollectionRef();
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
      const firestoreReadyData = { ...dataToSave };
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
      if (firestoreReadyData.hasOwnProperty('userAlias')) delete firestoreReadyData.userAlias;
      
      // console.log("App.js: saveDataToFirestore: Attempting to set document with data:", JSON.stringify(firestoreReadyData, null, 2));
      await setDoc(docRef, firestoreReadyData, { merge: true });
      // console.log("App.js: saveDataToFirestore: Data saved successfully.");
    } catch (error) { console.error("Error saving main data to Firestore:", error); }
  }, [userId, getDocRef, isAuthReady, savedSubmissivesName]); 
  
  useEffect(() => { 
    // console.log("Timer Effect (timeInChastity): isCageOn =", isCageOn, "isPaused =", isPaused, "(type:", typeof isPaused + ")", "cageOnTime =", cageOnTime, "isAuthReady =", isAuthReady);
    if (isCageOn && isPaused === false && isAuthReady) { 
      if (cageOnTime && cageOnTime instanceof Date && !isNaN(cageOnTime.getTime())) {
          const now = new Date();
          const initialElapsed = Math.max(0, Math.floor((now.getTime() - cageOnTime.getTime()) / 1000));
          if (timeInChastity === 0 || (cageOnTime && cageOnTime.getTime() !== (tempStartTime?.getTime() || 0))) { 
            // console.log("Timer Effect (timeInChastity): Setting initialElapsed =", initialElapsed);
            setTimeInChastity(initialElapsed);
          }
      }
      // console.log("Timer Effect (timeInChastity): Starting setInterval. Current timeInChastity value before interval starts:", timeInChastity);
      timerInChastityRef.current = setInterval(() => {
        setTimeInChastity(prevTime => {
            // console.log("Timer Tick (timeInChastity): prevTime =", prevTime, "newTime =", prevTime + 1, "isPaused in App scope:", isPaused); 
            return prevTime + 1;
        });
      }, 1000);
    } else {
      if (timerInChastityRef.current) {
        // console.log("Timer Effect (timeInChastity): Clearing interval because isCageOn is", isCageOn, "or isPaused is", isPaused, "or isAuthReady is", isAuthReady);
        clearInterval(timerInChastityRef.current);
      }
    }
    return () => { 
      if (timerInChastityRef.current) {
        // console.log("Timer Effect Cleanup (timeInChastity): Clearing interval");
        clearInterval(timerInChastityRef.current);
      }
    };
  }, [isCageOn, isPaused, cageOnTime, isAuthReady, timeInChastity, tempStartTime]); 

  useEffect(() => { 
    // console.log("Timer Effect (timeCageOff): isCageOn =", isCageOn, "isAuthReady =", isAuthReady, "hasSessionEverBeenActive=", hasSessionEverBeenActive);
    if (!isCageOn && isAuthReady && hasSessionEverBeenActive) { 
      // console.log("Timer Effect (timeCageOff): Starting setInterval. Current timeCageOff value before interval starts:", timeCageOff);
      timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
    } else { 
      if (timerCageOffRef.current) {
        // console.log("Timer Effect (timeCageOff): Clearing interval because isCageOn is", isCageOn, "or isAuthReady is", isAuthReady, "or hasSessionEverBeenActive is", hasSessionEverBeenActive);
        clearInterval(timerCageOffRef.current);
      }
    }
    return () => { 
      if (timerCageOffRef.current) {
        // console.log("Timer Effect Cleanup (timeCageOff): Clearing interval");
        clearInterval(timerCageOffRef.current);
      }
    };
  }, [isCageOn, isAuthReady, hasSessionEverBeenActive]); 

  // Effect for live pause duration display
  useEffect(() => {
    if (isPaused && pauseStartTime) {
        // console.log("App.js: Starting livePauseDuration interval. Pause Start Time:", pauseStartTime);
        setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000)); 
        pauseDisplayTimerRef.current = setInterval(() => {
            setLivePauseDuration(prev => {
                 // console.log("Timer Tick (livePauseDuration): prev =", prev, "new =", prev + 1); 
                 return prev + 1;
            });
        }, 1000);
    } else {
        if (pauseDisplayTimerRef.current) {
            // console.log("App.js: Clearing livePauseDuration interval.");
            clearInterval(pauseDisplayTimerRef.current);
        }
        setLivePauseDuration(0); 
    }
    return () => {
        if (pauseDisplayTimerRef.current) {
            // console.log("App.js: Cleanup - Clearing livePauseDuration interval.");
            clearInterval(pauseDisplayTimerRef.current);
        }
    };
  }, [isPaused, pauseStartTime]);

  // --- Pause Feature Handlers ---
  const handleInitiatePause = useCallback(() => {
    console.log("App.js: handleInitiatePause called. LastPauseEndTime:", lastPauseEndTime, "Current Time:", new Date());
    setPauseCooldownMessage(''); 
    if (lastPauseEndTime) {
        const twelveHoursInMillis = 12 * 60 * 60 * 1000;
        const timeSinceLastPauseEnd = new Date().getTime() - lastPauseEndTime.getTime();
        console.log("App.js: handleInitiatePause - Time since last pause end (ms):", timeSinceLastPauseEnd, "Cooldown (ms):", twelveHoursInMillis);
        if (timeSinceLastPauseEnd < twelveHoursInMillis) {
            const remainingTime = twelveHoursInMillis - timeSinceLastPauseEnd;
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const cooldownMsg = `You can pause again in approximately ${hours}h ${minutes}m.`;
            console.warn("App.js: handleInitiatePause - Pause cooldown active.", cooldownMsg);
            setPauseCooldownMessage(cooldownMsg); 
            setTimeout(() => setPauseCooldownMessage(''), 5000);
            return;
        }
    }
    setShowPauseReasonModal(true);
  }, [lastPauseEndTime]);

  const handleConfirmPause = useCallback(async () => {
    console.log("App.js: handleConfirmPause called. Reason:", reasonForPauseInput);
    if (!isCageOn) {
        console.warn("App.js: handleConfirmPause - Cannot pause, cage is not on.");
        setShowPauseReasonModal(false);
        setReasonForPauseInput('');
        return;
    }
    const now = new Date();
    const newPauseEvent = {
        id: crypto.randomUUID(),
        startTime: now,
        reason: reasonForPauseInput.trim() || "No reason provided",
        endTime: null, 
        duration: null 
    };

    console.log("App.js: handleConfirmPause - Setting isPaused to true, pauseStartTime to:", now);
    setIsPaused(true);
    setPauseStartTime(now);
    setCurrentSessionPauseEvents(prev => [...prev, newPauseEvent]);
    
    setShowPauseReasonModal(false);
    setReasonForPauseInput('');

    const dataToSave = { 
        isPaused: true, 
        pauseStartTime: now, 
        accumulatedPauseTimeThisSession, 
        currentSessionPauseEvents: [...currentSessionPauseEvents, newPauseEvent],
        lastPauseEndTime 
    };
    // console.log("App.js: handleConfirmPause - Data to save:", dataToSave);
    await saveDataToFirestore(dataToSave);
    console.log("App.js: handleConfirmPause - Session paused. Firestore updated.");
  }, [isCageOn, reasonForPauseInput, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore, lastPauseEndTime]);

  const handleCancelPauseModal = useCallback(() => {
    console.log("App.js: handleCancelPauseModal called");
    setShowPauseReasonModal(false);
    setReasonForPauseInput('');
  }, []);

  const handleResumeSession = useCallback(async () => {
    console.log("App.js: handleResumeSession called. Current isPaused:", isPaused, "Current pauseStartTime:", pauseStartTime);
    if (!isPaused || !pauseStartTime) {
        console.warn("App.js: handleResumeSession - Not paused or no pause start time. Aborting resume.");
        setIsPaused(false); 
        setPauseStartTime(null);
        setLivePauseDuration(0); 
        return;
    }
    const endTime = new Date();
    const currentPauseDuration = Math.floor((endTime.getTime() - pauseStartTime.getTime()) / 1000);
    const newAccumulatedPauseTime = accumulatedPauseTimeThisSession + currentPauseDuration;

    const updatedSessionPauses = currentSessionPauseEvents.map((event, index) => {
        if (index === currentSessionPauseEvents.length - 1 && !event.endTime) { 
            return { ...event, endTime, duration: currentPauseDuration };
        }
        return event;
    });
    console.log("App.js: handleResumeSession - Setting isPaused to false. New accumulated pause:", newAccumulatedPauseTime);
    setAccumulatedPauseTimeThisSession(newAccumulatedPauseTime);
    setIsPaused(false);
    setPauseStartTime(null);
    setCurrentSessionPauseEvents(updatedSessionPauses);
    setLivePauseDuration(0); 
    setLastPauseEndTime(endTime); 

    const dataToSave = { 
        isPaused: false, 
        pauseStartTime: null, 
        accumulatedPauseTimeThisSession: newAccumulatedPauseTime,
        currentSessionPauseEvents: updatedSessionPauses,
        lastPauseEndTime: endTime 
    };
    // console.log("App.js: handleResumeSession - Data to save:", dataToSave);
    await saveDataToFirestore(dataToSave);
    console.log("App.js: handleResumeSession - Session resumed. Firestore updated.");
  }, [isPaused, pauseStartTime, accumulatedPauseTimeThisSession, currentSessionPauseEvents, saveDataToFirestore]);


  // --- Original Handlers ---
  const handleToggleCage = useCallback(() => { 
    console.log("App.js: handleToggleCage called. Current isCageOn:", isCageOn, "isAuthReady:", isAuthReady, "isPaused:", isPaused);
    if (!isAuthReady) {
        console.warn("App.js: handleToggleCage - Auth not ready, returning.");
        return;
    }
    if (isPaused) {
        setNameMessage("Please resume the session before turning the cage off.");
        setTimeout(() => setNameMessage(''), 3000);
        console.warn("App.js: handleToggleCage - Attempted to toggle cage while paused.");
        return;
    }

    const currentTime = new Date();
    if (confirmReset) { setConfirmReset(false); if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current); }
    
    if (!isCageOn) { 
      console.log("App.js: handleToggleCage - Cage is OFF, attempting to turn ON.");
      const newTotalOff = totalTimeCageOff + timeCageOff; 
      setTotalTimeCageOff(newTotalOff); 
      setCageOnTime(currentTime); 
      console.log("App.js: handleToggleCage - Setting cageOnTime to:", currentTime); 
      setIsCageOn(true);
      setTimeInChastity(0); 
      setTimeCageOff(0);
      setAccumulatedPauseTimeThisSession(0);
      setCurrentSessionPauseEvents([]);
      setPauseStartTime(null);
      setIsPaused(false); 
      setLastPauseEndTime(null); 
      setHasSessionEverBeenActive(true);
      console.log("App.js: handleToggleCage - Setting lastPauseEndTime to null & hasSessionEverBeenActive to true for new session."); 
      const dataToSave = { 
          isCageOn: true, cageOnTime: currentTime, totalTimeCageOff: newTotalOff, 
          timeInChastity: 0, 
          chastityHistory, totalChastityTime, submissivesName: savedSubmissivesName,
          isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
          lastPauseEndTime: null 
      };
      // console.log("App.js: handleToggleCage - Data to save for Cage ON:", dataToSave);
      saveDataToFirestore(dataToSave).then(() => {
          console.log("App.js: handleToggleCage - saveDataToFirestore for Cage ON successful.");
      }).catch(err => {
          console.error("App.js: handleToggleCage - saveDataToFirestore for Cage ON failed:", err);
      });
    } else { 
      console.log("App.js: handleToggleCage - Cage is ON, attempting to turn OFF. Showing modal. Current cageOnTime:", cageOnTime);
      setTempEndTime(currentTime); 
      setTempStartTime(cageOnTime); 
      console.log("App.js: handleToggleCage - Setting tempStartTime to:", cageOnTime); 
      setShowReasonModal(true); 
      console.log("App.js: handleToggleCage - ShowReasonModal set to true for removal.");
    }
  }, [isAuthReady, isCageOn, totalTimeCageOff, timeCageOff, cageOnTime, confirmReset, saveDataToFirestore, chastityHistory, totalChastityTime, savedSubmissivesName, resetTimeoutRef, isPaused, setNameMessage, setHasSessionEverBeenActive]);

  const handleConfirmRemoval = useCallback(() => { 
    console.log("App.js: handleConfirmRemoval - Called. State before changes: isCageOn=", isCageOn, "isPaused=", isPaused, "accumulatedPauseTimeThisSession=", accumulatedPauseTimeThisSession); 
    if (!isAuthReady) {
        console.warn("App.js: handleConfirmRemoval - Auth not ready.");
        return;
    }
    if (tempStartTime && tempEndTime) {
      let currentAccumulatedPause = accumulatedPauseTimeThisSession;
      let finalPauseEvents = currentSessionPauseEvents;

      if (isPaused && pauseStartTime) {
          console.log("App.js: handleConfirmRemoval - Session was paused, finalizing current pause.");
          const currentPauseDuration = Math.floor((tempEndTime.getTime() - pauseStartTime.getTime()) / 1000);
          currentAccumulatedPause += currentPauseDuration;
          finalPauseEvents = currentSessionPauseEvents.map((event, index) => {
              if (index === currentSessionPauseEvents.length - 1 && !event.endTime) {
                  return { ...event, endTime: tempEndTime, duration: currentPauseDuration };
              }
              return event;
          });
          console.log("App.js: handleConfirmRemoval - Finalized current pause. Duration:", currentPauseDuration, "New accumulated:", currentAccumulatedPause);
      }
      
      const rawDurationSeconds = Math.max(0, Math.floor((tempEndTime.getTime() - tempStartTime.getTime()) / 1000));
      const effectiveDurationSeconds = rawDurationSeconds - currentAccumulatedPause;
      console.log("App.js: handleConfirmRemoval - Raw duration:", rawDurationSeconds, "Final accumulated pause:", currentAccumulatedPause, "Effective duration:", effectiveDurationSeconds); 
      
      const newHistoryEntry = { 
        id: crypto.randomUUID(), periodNumber: chastityHistory.length + 1, 
        startTime: tempStartTime, endTime: tempEndTime, 
        duration: rawDurationSeconds, 
        reasonForRemoval: reasonForRemoval.trim() || 'No reason provided',
        totalPauseDurationSeconds: currentAccumulatedPause, 
        pauseEvents: finalPauseEvents 
      };
      const updatedHistoryState = [...chastityHistory, newHistoryEntry];
      
      console.log("App.js: handleConfirmRemoval - Setting main states: isCageOn=false, isPaused=false, resetting session timers/pauses.");
      setChastityHistory(updatedHistoryState); 
      
      setIsCageOn(false); 
      console.log("App.js: handleConfirmRemoval - setIsCageOn(false) called.");
      setCageOnTime(null);
      console.log("App.js: handleConfirmRemoval - setCageOnTime(null) called.");
      setTimeInChastity(0); 
      setTimeCageOff(0); 
      setIsPaused(false);
      setPauseStartTime(null);
      setAccumulatedPauseTimeThisSession(0);
      setCurrentSessionPauseEvents([]);
      setHasSessionEverBeenActive(true); // A session just ended

      const dataToSave = { 
          isCageOn: false, cageOnTime: null, timeInChastity: 0,
          chastityHistory: updatedHistoryState, 
          totalTimeCageOff, submissivesName: savedSubmissivesName,
          isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
          lastPauseEndTime 
      };
      console.log("App.js: handleConfirmRemoval - Data to save:", dataToSave);
      saveDataToFirestore(dataToSave);
    } else {
        console.warn("App.js: handleConfirmRemoval - tempStartTime or tempEndTime is missing. tempStartTime:", tempStartTime, "tempEndTime:", tempEndTime); 
    }
    setReasonForRemoval(''); 
    setTempEndTime(null); 
    setTempStartTime(null); 
    setShowReasonModal(false);
    console.log("App.js: handleConfirmRemoval - Modal should be closed now."); 
  }, [isAuthReady, tempStartTime, tempEndTime, chastityHistory, reasonForRemoval, saveDataToFirestore, totalTimeCageOff, savedSubmissivesName, accumulatedPauseTimeThisSession, currentSessionPauseEvents, lastPauseEndTime, isPaused, pauseStartTime, setHasSessionEverBeenActive]);

  const handleCancelRemoval = useCallback(() => { 
    console.log("App.js: handleCancelRemoval called."); 
    setReasonForRemoval(''); 
    setTempEndTime(null); 
    setTempStartTime(null); 
    setShowReasonModal(false);
    console.log("App.js: handleCancelRemoval - Modal should be closed now."); 
  }, []);
  
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
        try {
            if (timerInChastityRef.current) clearInterval(timerInChastityRef.current); 
            if (timerCageOffRef.current) clearInterval(timerCageOffRef.current); 
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            
            setCageOnTime(null); setIsCageOn(false); setTimeInChastity(0); setTimeCageOff(0); setChastityHistory([]);
            setTotalChastityTime(0); setTotalTimeCageOff(0); setSavedSubmissivesName(''); setSubmissivesNameInput('');
            setIsPaused(false); setPauseStartTime(null); setAccumulatedPauseTimeThisSession(0); setCurrentSessionPauseEvents([]); 
            setLastPauseEndTime(null); 
            setPauseCooldownMessage('');
            setHasSessionEverBeenActive(false);
            
            setConfirmReset(false); setShowReasonModal(false); 
            saveDataToFirestore({ 
                cageOnTime: null, isCageOn: false, timeInChastity: 0, chastityHistory: [], 
                totalChastityTime: 0, totalTimeCageOff: 0, submissivesName: '',
                isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0, currentSessionPauseEvents: [],
                lastPauseEndTime: null 
            });
            clearAllEvents(); 
            setNameMessage("All data reset. Submissive's Name cleared."); 
            setTimeout(() => setNameMessage(''), 4000);
            setCurrentPage('tracker'); 
        } catch (error) {
            console.error("App.js: handleResetAllData - Error during reset process:", error);
            setNameMessage("Error during reset. Check console.");
            setTimeout(() => setNameMessage(''), 4000);
        }
      } else { 
        setConfirmReset(true); 
        resetTimeoutRef.current = setTimeout(() => {
            setConfirmReset(false);
        }, 3000); 
      }
  }, [isAuthReady, confirmReset, saveDataToFirestore, clearAllEvents, setCurrentPage, setNameMessage, setConfirmReset, resetTimeoutRef]);
  
  const handleSubmissivesNameInputChange = useCallback((event) => { 
    setSubmissivesNameInput(event.target.value); 
  }, []);

  const handleSetSubmissivesName = useCallback(async () => {
      if (!isAuthReady || !userId) { setNameMessage("Cannot set name: User not authenticated."); setTimeout(() => setNameMessage(''), 3000); return; }
      if (savedSubmissivesName) { setNameMessage("Name is already set. Perform a 'Reset All Data' in Settings to change it."); setTimeout(() => setNameMessage(''), 4000); return; }
      const trimmedName = submissivesNameInput.trim();
      if (!trimmedName) { setNameMessage("Name cannot be empty."); setTimeout(() => setNameMessage(''), 3000); return; }
      setSavedSubmissivesName(trimmedName);
      await saveDataToFirestore({ submissivesName: trimmedName, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime });
      setNameMessage("Submissive's Name set successfully!"); setTimeout(() => setNameMessage(''), 3000);
  }, [isAuthReady, userId, savedSubmissivesName, submissivesNameInput, saveDataToFirestore, isCageOn, cageOnTime, timeInChastity, chastityHistory, totalChastityTime, totalTimeCageOff, lastPauseEndTime]);
  
  const handleToggleUserIdVisibility = useCallback(() => { 
    setShowUserIdInSettings(prev => !prev);
  }, []);

  // Event Log Handlers
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
    
    const selfOrgasmAmount = selectedEventTypes.includes("Orgasm (Self)") && newEventSelfOrgasmAmount 
                             ? parseInt(newEventSelfOrgasmAmount, 10) || null : null;
    const partnerOrgasmAmount = selectedEventTypes.includes("Orgasm (Partner)") && newEventPartnerOrgasmAmount
                                ? parseInt(newEventPartnerOrgasmAmount, 10) || null : null;

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
  
  const handleExportTrackerCSV = useCallback(() => { /* ... */ }, [isAuthReady, chastityHistory, totalChastityTime, totalTimeCageOff]);
  const handleExportEventLogCSV = useCallback(() => { /* ... */ }, [isAuthReady, sexualEventsLog, savedSubmissivesName]);
  const handleExportTextReport = useCallback(() => { /* ... */ }, [isAuthReady, savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff, totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, overallTotalPauseTime]);

  // --- Restore Session Handlers ---
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
        setHasSessionEverBeenActive(true); // User chose to engage with a session

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
            totalTimeCageOff 
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
        lastPauseEndTime 
    });

    setShowRestoreSessionPrompt(false);
    setLoadedSessionData(null);
    console.log("App.js: Discarded old session, starting fresh in Cage Off state. No timers running.");
  }, [saveDataToFirestore, chastityHistory, totalChastityTime, totalTimeCageOff, savedSubmissivesName, lastPauseEndTime, setHasSessionEverBeenActive]);


  // Main Render
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        <h1 className="text-4xl font-bold text-purple-400 mb-4 tracking-wider">ChastityOS</h1>
        {savedSubmissivesName && <p className="text-lg text-purple-200 mb-6">For: <span className="font-semibold">{savedSubmissivesName}</span></p>}

        <nav className="mb-6 flex justify-center space-x-1 sm:space-x-2">
            {[{id: 'tracker', name: 'Chastity Tracker'}, {id: 'logEvent', name: 'Log Event'}, {id: 'fullReport', name: 'Full Report'}, {id: 'settings', name: 'Settings'}].map((page) => ( 
            <button type="button" key={page.id} onClick={() => setCurrentPage(page.id)}
                className={`py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${currentPage === page.id ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-700 text-purple-300 hover:bg-purple-500 hover:text-white'}`}>
                {page.name}
            </button>
            ))}
        </nav>
        
        {/* Page Titles Rendered Here */}
        {currentPage === 'tracker' && !showRestoreSessionPrompt && <h2 className="text-2xl font-bold text-purple-300 mb-4">Chastity Tracker</h2>}
        {currentPage === 'fullReport' && <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">Full Report</h2>}
        {currentPage === 'logEvent' && <h2 className="text-2xl font-bold text-purple-300 mb-4">Sexual Event Log</h2>}
        {currentPage === 'settings' && <h2 className="text-2xl font-bold text-purple-300 mb-6">Settings</h2>}


        <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
            {currentPage === 'tracker' && (
                <TrackerPage
                    isAuthReady={isAuthReady}
                    isCageOn={isCageOn}
                    cageOnTime={cageOnTime}
                    timeInChastity={timeInChastity}
                    timeCageOff={timeCageOff}
                    totalChastityTime={totalChastityTime}
                    totalTimeCageOff={totalTimeCageOff}
                    chastityHistory={chastityHistory}
                    handleToggleCage={handleToggleCage}
                    showReasonModal={showReasonModal}
                    setShowReasonModal={setShowReasonModal}
                    reasonForRemoval={reasonForRemoval}
                    setReasonForRemoval={setReasonForRemoval}
                    handleConfirmRemoval={handleConfirmRemoval}
                    handleCancelRemoval={handleCancelRemoval}
                    // Pause feature props
                    isPaused={isPaused}
                    handleInitiatePause={handleInitiatePause}
                    handleResumeSession={handleResumeSession}
                    showPauseReasonModal={showPauseReasonModal}
                    handleCancelPauseModal={handleCancelPauseModal}
                    reasonForPauseInput={reasonForPauseInput}
                    setReasonForPauseInput={setReasonForPauseInput}
                    handleConfirmPause={handleConfirmPause}
                    accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
                    pauseStartTime={pauseStartTime}
                    livePauseDuration={livePauseDuration} 
                    pauseCooldownMessage={pauseCooldownMessage}
                    // Restore session prompt props
                    showRestoreSessionPrompt={showRestoreSessionPrompt}
                    handleConfirmRestoreSession={handleConfirmRestoreSession}
                    handleDiscardAndStartNew={handleDiscardAndStartNew}
                    loadedSessionData={loadedSessionData}
                />
            )}

            {currentPage === 'fullReport' && (
                <FullReportPage
                    savedSubmissivesName={savedSubmissivesName}
                    userId={userId}
                    isCageOn={isCageOn}
                    cageOnTime={cageOnTime}
                    timeInChastity={timeInChastity}
                    timeCageOff={timeCageOff}
                    totalChastityTime={totalChastityTime}
                    totalTimeCageOff={totalTimeCageOff}
                    chastityHistory={chastityHistory}
                    sexualEventsLog={sexualEventsLog}
                    isLoadingEvents={isLoadingEvents}
                    isPaused={isPaused} 
                    accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession} 
                    overallTotalPauseTime={overallTotalPauseTime}
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
                    handleLogNewEvent={handleLogNewEvent}
                    eventLogMessage={eventLogMessage}
                    isLoadingEvents={isLoadingEvents}
                    sexualEventsLog={sexualEventsLog}
                    savedSubmissivesName={savedSubmissivesName} 
                />
            )}

            {currentPage === 'settings' && (
                <SettingsPage
                    isAuthReady={isAuthReady}
                    eventLogMessage={eventLogMessage} 
                    handleExportTrackerCSV={handleExportTrackerCSV}
                    chastityHistory={chastityHistory}
                    handleExportEventLogCSV={handleExportEventLogCSV}
                    sexualEventsLog={sexualEventsLog}
                    handleResetAllData={handleResetAllData}
                    confirmReset={confirmReset}
                    nameMessage={nameMessage}
                    handleExportTextReport={handleExportTextReport}
                    userId={userId} 
                    showUserIdInSettings={showUserIdInSettings} 
                    handleToggleUserIdVisibility={handleToggleUserIdVisibility} 
                    savedSubmissivesName={savedSubmissivesName}
                    submissivesNameInput={submissivesNameInput}
                    handleSubmissivesNameInputChange={handleSubmissivesNameInputChange}
                    handleSetSubmissivesName={handleSetSubmissivesName}
                />
            )}
        </Suspense>
      </div>
      <footer className="mt-8 text-center text-xs text-gray-500">
        Copyright 2025 F4tDaddy Productions
      </footer>
    </div>
  );
};

export default App;
