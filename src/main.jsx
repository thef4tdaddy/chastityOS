import React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInAnonymously // For anonymous sign-in
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    onSnapshot, 
    setDoc, 
    collection, 
    query, 
    orderBy, 
    addDoc,
    getDoc,
    Timestamp, // Import Timestamp
    // Add other Firestore functions as needed: getDocs, updateDoc, deleteDoc, writeBatch
} from 'firebase/firestore';

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp); // Initialize Firestore

// Get the GA Measurement ID from Vite environment variables
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Exporting Main to satisfy eslint-plugin-react-refresh
export const Main = () => {
  // --- Authentication State ---
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  // const [user, setUser] = useState(null); // ESLint: 'user' is assigned a value but never used. For now, we'll rely on userId. If full user object is needed later, uncomment and use.

  // --- Application State ---
  const [isCageOn, setIsCageOn] = useState(false);
  const [cageOnTime, setCageOnTime] = useState(null); // Firestore Timestamp (when set) or JS Date (when read)
  const [chastityHistory, setChastityHistory] = useState([]);
  const [currentChastitySession, setCurrentChastitySession] = useState(null); 

  // Durations and totals (in seconds)
  const [cageDuration, setCageDuration] = useState(0); // Live raw duration for current cage-on time
  const [sexualEventsLog, setSexualEventsLog] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [savedSubmissivesName, setSavedSubmissivesName] = useState('');
  
  const [timeInChastity, setTimeInChastity] = useState(0); // Live effective duration for current session
  const [timeCageOff, setTimeCageOff] = useState(0);       // Live duration since last unlock
  const [totalChastityTime, setTotalChastityTime] = useState(0); // Overall total effective chastity time from history
  const [totalTimeCageOff, setTotalTimeCageOff] = useState(0); // Overall total time cage was off (calculated from history)
  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
  const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0);


  // --- Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // setUser(currentUser); // Set the full user object if needed elsewhere
      if (currentUser) {
        setUserId(currentUser.uid);
        console.log("User signed in:", currentUser.uid);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          // setUser(userCredential.user); // Set the full user object if needed
          setUserId(userCredential.user.uid);
          console.log("Signed in anonymously:", userCredential.user.uid);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
        }
      }
      setIsAuthReady(true); 
    });
    return () => unsubscribe();
  }, []);

  // --- Data Fetching and Realtime Listeners ---
  useEffect(() => {
    if (!userId) return; 

    // Listener for User Settings
    const userSettingsDocRef = doc(db, `users/${userId}/settings`, 'profile');
    const unsubscribeSettings = onSnapshot(userSettingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSavedSubmissivesName(docSnap.data().submissivesName || '');
      } else {
        setSavedSubmissivesName(''); 
      }
    }, (error) => console.error("Error fetching user settings:", error));

    // Listener for Chastity Status
    const chastityStatusDocRef = doc(db, `users/${userId}/status`, 'chastity');
    const unsubscribeStatus = onSnapshot(chastityStatusDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsCageOn(data.isCageOn || false);
        // cageOnTime from status is used to initialize currentChastitySession's startTime
        // setCageOnTime(data.cageOnTime ? data.cageOnTime.toDate() : null); // This state might be redundant if currentChastitySession holds the start time
        setIsPaused(data.isPaused || false);
        setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
        
        if (data.isCageOn && data.cageOnTime) {
            setCurrentChastitySession({
                startTime: data.cageOnTime, // Firestore Timestamp
                isPaused: data.isPaused || false,
                pauseStartTime: data.pauseStartTime || null, // Firestore Timestamp
                accumulatedPauseTime: data.accumulatedPauseTimeThisSession || 0,
            });
            setCageOnTime(data.cageOnTime.toDate()); // Keep a JS Date version for convenience if needed by other logic directly
        } else {
            setCurrentChastitySession(null);
            setCageOnTime(null);
        }
      } else {
        setIsCageOn(false);
        setCageOnTime(null);
        setIsPaused(false);
        setAccumulatedPauseTimeThisSession(0);
        setCurrentChastitySession(null);
      }
    }, (error) => console.error("Error fetching chastity status:", error));

    // Listener for Chastity History
    const chastityHistoryCollRef = collection(db, `users/${userId}/chastityHistory`);
    const qHistory = query(chastityHistoryCollRef, orderBy("startTime", "asc")); 
    const unsubscribeHistory = onSnapshot(qHistory, (querySnapshot) => {
      const history = [];
      let calculatedTotalChastityTime = 0; // Effective chastity time
      let calculatedOverallPauseTime = 0;
      let calculatedTotalTimeCageOff = 0;
      let lastEndTime = null;

      querySnapshot.forEach((docSnap) => {
        const entry = { id: docSnap.id, ...docSnap.data() };
        if (entry.startTime) entry.startTime = entry.startTime.toDate();
        if (entry.endTime) entry.endTime = entry.endTime.toDate();
        
        history.push(entry);

        const sessionDuration = entry.duration || 0;
        const sessionPause = entry.totalPauseDurationSeconds || 0;
        calculatedTotalChastityTime += (sessionDuration - sessionPause);
        calculatedOverallPauseTime += sessionPause;

        if(lastEndTime && entry.startTime) {
            calculatedTotalTimeCageOff += Math.floor((entry.startTime - lastEndTime) / 1000);
        }
        lastEndTime = entry.endTime;
      });

      setChastityHistory(history);
      setTotalChastityTime(calculatedTotalChastityTime); 
      setOverallTotalPauseTime(calculatedOverallPauseTime);
      setTotalTimeCageOff(calculatedTotalTimeCageOff);
    }, (error) => console.error("Error fetching chastity history:", error));

    // Listener for Sexual Events Log
    const eventsCollRef = collection(db, `users/${userId}/sexualEventsLog`);
    const qEvents = query(eventsCollRef, orderBy("eventTimestamp", "desc"));
    setIsLoadingEvents(true);
    const unsubscribeEvents = onSnapshot(qEvents, (querySnapshot) => {
      const events = [];
      querySnapshot.forEach((docSnap) => {
        const event = { id: docSnap.id, ...docSnap.data() };
        if (event.eventTimestamp) event.eventTimestamp = event.eventTimestamp.toDate();
        events.push(event);
      });
      setSexualEventsLog(events);
      setIsLoadingEvents(false);
    }, (error) => {
      console.error("Error fetching sexual events log:", error);
      setIsLoadingEvents(false);
    });

    return () => { 
      unsubscribeSettings();
      unsubscribeStatus();
      unsubscribeHistory();
      unsubscribeEvents();
    };
  }, [userId]);


  // --- Timer logic for current session durations ---
   useEffect(() => {
    let intervalId;
    if (isAuthReady && userId) { 
        if (isCageOn && currentChastitySession && currentChastitySession.startTime) {
            intervalId = setInterval(() => {
                const now = new Date();
                // Ensure currentChastitySession.startTime is a Firestore Timestamp before calling toDate()
                const startTimeDate = currentChastitySession.startTime.toDate ? 
                                      currentChastitySession.startTime.toDate() : 
                                      new Date(currentChastitySession.startTime); // Fallback if it's already a Date or string
                
                let currentRawSessionSeconds = Math.floor((now - startTimeDate) / 1000);
                
                let effectiveDurationSeconds = currentRawSessionSeconds;
                let currentPauseDuration = 0;

                if (currentChastitySession.isPaused && currentChastitySession.pauseStartTime) {
                    const pauseStartTimeDate = currentChastitySession.pauseStartTime.toDate ?
                                               currentChastitySession.pauseStartTime.toDate() :
                                               new Date(currentChastitySession.pauseStartTime);
                    currentPauseDuration = Math.floor((now - pauseStartTimeDate) / 1000);
                    effectiveDurationSeconds -= (currentChastitySession.accumulatedPauseTime + currentPauseDuration);
                } else {
                    effectiveDurationSeconds -= currentChastitySession.accumulatedPauseTime;
                }

                setTimeInChastity(Math.max(0, effectiveDurationSeconds)); 
                setCageDuration(Math.max(0, currentRawSessionSeconds)); 
                setTimeCageOff(0);
            }, 1000);
        } else if (!isCageOn) {
            const lastSession = chastityHistory.length > 0 ? chastityHistory[chastityHistory.length - 1] : null;
            if (lastSession && lastSession.endTime) {
                 intervalId = setInterval(() => {
                    const now = new Date();
                    const endTimeDate = lastSession.endTime; 
                    setTimeCageOff(Math.floor((now - endTimeDate) / 1000));
                    setTimeInChastity(0); 
                    setCageDuration(0); 
                }, 1000);
            } else if (chastityHistory.length === 0) { // No history, cage is off (initial state)
                 setTimeCageOff(0); // Or could be time since app load if desired
                 setTimeInChastity(0);
                 setCageDuration(0);
            }
        } else {
            setTimeInChastity(0);
            setTimeCageOff(0);
            setCageDuration(0);
        }
    }
    return () => clearInterval(intervalId);
  }, [isCageOn, currentChastitySession, chastityHistory, isAuthReady, userId]);


  // --- Action Handlers ---
  const handleToggleCage = async (reasonForRemoval = "") => {
    if (!userId) return;
    const newCageStatus = !isCageOn;
    const nowTimestamp = Timestamp.now(); 
    const statusDocRef = doc(db, `users/${userId}/status`, 'chastity');
    
    try {
        if (newCageStatus) { // Turning cage ON
            await setDoc(statusDocRef, { 
                isCageOn: true, 
                cageOnTime: nowTimestamp,
                isPaused: false,
                pauseStartTime: null,
                accumulatedPauseTimeThisSession: 0 
            }, { merge: true });
             // setCurrentChastitySession will be updated by the onSnapshot listener for statusDocRef
        } else { // Turning cage OFF
            const currentStatusSnap = await getDoc(statusDocRef);
            let sessionStartTime = null;
            let sessionAccumulatedPause = 0;
            let sessionIsPaused = false;
            let sessionPauseStartTime = null;

            if (currentStatusSnap.exists()) {
                const currentData = currentStatusSnap.data();
                sessionStartTime = currentData.cageOnTime; // Firestore Timestamp
                sessionAccumulatedPause = currentData.accumulatedPauseTimeThisSession || 0;
                sessionIsPaused = currentData.isPaused || false;
                sessionPauseStartTime = currentData.pauseStartTime; // Firestore Timestamp
            }
            
            let currentSessionRawDuration = 0;
            if (sessionStartTime) {
                currentSessionRawDuration = Math.floor((nowTimestamp.toDate() - sessionStartTime.toDate()) / 1000);
            }

            if (sessionIsPaused && sessionPauseStartTime) {
                // If it was paused when unlocked, add the final pause duration to accumulated
                sessionAccumulatedPause += Math.floor((nowTimestamp.toDate() - sessionPauseStartTime.toDate()) / 1000);
            }
            
            const historyEntry = {
                startTime: sessionStartTime, // Firestore Timestamp
                endTime: nowTimestamp,       // Firestore Timestamp
                duration: currentSessionRawDuration, 
                reasonForRemoval: reasonForRemoval || "N/A",
                totalPauseDurationSeconds: sessionAccumulatedPause,
                periodNumber: chastityHistory.length + 1 
            };
            await addDoc(collection(db, `users/${userId}/chastityHistory`), historyEntry);
            
            await setDoc(statusDocRef, { 
                isCageOn: false, 
                cageOnTime: null, 
                lastUnlockTime: nowTimestamp,
                isPaused: false,
                pauseStartTime: null,
                accumulatedPauseTimeThisSession: 0
            }, { merge: true });
            // setCurrentChastitySession will be set to null by the onSnapshot listener
        }
    } catch (error) {
        console.error("Error toggling cage status:", error);
    }
  };

  const handleLogNewEvent = async (eventData) => {
    if (!userId) return;
    try {
      const { date, time, types, otherDetail, notes, durationHours, durationMinutes, selfOrgasmAmount, partnerOrgasmAmount } = eventData;
      const combinedTimestamp = Timestamp.fromDate(new Date(`${date}T${time}`));
      let durationSeconds = 0;
      if (durationHours || durationMinutes) {
        durationSeconds = (parseInt(durationHours, 10) || 0) * 3600 + (parseInt(durationMinutes, 10) || 0) * 60;
      }

      await addDoc(collection(db, `users/${userId}/sexualEventsLog`), {
        eventTimestamp: combinedTimestamp,
        types: types || [],
        otherTypeDetail: otherDetail || "",
        notes: notes || "",
        durationSeconds: durationSeconds,
        selfOrgasmAmount: parseInt(selfOrgasmAmount, 10) || 0,
        partnerOrgasmAmount: parseInt(partnerOrgasmAmount, 10) || 0,
      });
      console.log("Event logged successfully");
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  const handleSetSubmissivesName = async (name) => {
    if (!userId || !name.trim()) return;
    const settingsDocRef = doc(db, `users/${userId}/settings`, 'profile');
    try {
      await setDoc(settingsDocRef, { submissivesName: name.trim() }, { merge: true });
      console.log("Submissive's name updated.");
    } catch (error) {
      console.error("Error setting submissive's name:", error);
    }
  };


  if (!isAuthReady) {
    return <div className="text-center p-8 text-purple-300">Initializing authentication...</div>;
  }

  const appProps = {
    isAuthReady,
    userId,
    GA_MEASUREMENT_ID: gaMeasurementId,
    // TrackerPage props
    isCageOn,
    cageOnTime, // JS Date from state, originally from Firestore Timestamp
    chastityHistory,
    chastityDuration: timeInChastity, // Live effective duration for current session
    cageDuration: cageDuration,      // Live raw duration for current session
    handleToggleCage, 
    currentChastitySession, 
    // LogEventPage props
    sexualEventsLog,
    isLoadingEvents,
    handleLogNewEvent, 
    savedSubmissivesName,
    // FullReportPage props
    timeInChastity, 
    timeCageOff,    
    totalChastityTime, // Overall total effective chastity time
    totalTimeCageOff,  // Overall total time cage was off
    overallTotalPauseTime,
    isPaused,
    accumulatedPauseTimeThisSession,
    // SettingsPage props
    handleSetSubmissivesName,
    
    // Placeholder for props that are not yet fully managed here
    eventLogMessage: "Sample event log message", 
    handleExportTrackerCSV: () => console.log("Export Tracker CSV clicked"),
    handleExportEventLogCSV: () => console.log("Export Event Log CSV clicked"),
    handleResetAllData: () => console.log("Reset All Data clicked"),
    confirmReset: false, 
    nameMessage: "Sample name message",
    handleExportTextReport: () => console.log("Export Text Report clicked"),
    showUserIdInSettings: false, 
    handleToggleUserIdVisibility: () => console.log("Toggle User ID Visibility clicked"),
    submissivesNameInput: "", 
    handleSubmissivesNameInputChange: () => console.log("Submissive Name Input Change"),
    restoreUserIdInput: "",
    handleRestoreUserIdInputChange: () => console.log("Restore User ID Input Change"), 
    handleInitiateRestoreFromId: () => console.log("Initiate Restore From ID clicked"),
    showRestoreFromIdPrompt: false,
    handleConfirmRestoreFromId: () => console.log("Confirm Restore From ID clicked"),
    handleCancelRestoreFromId: () => console.log("Cancel Restore From ID clicked"),
    restoreFromIdMessage: "Sample restore message",

    // Props for LogEventPage form (can be managed locally in LogEventPage or here)
    newEventDate: new Date().toISOString().split('T')[0],
    setNewEventDate: () => {}, // These would be part of local state in LogEventPage ideally
    newEventTime: new Date().toTimeString().split(' ')[0].substring(0,5),
    setNewEventTime: () => {},
    selectedEventTypes: [],
    handleEventTypeChange: () => {},
    otherEventTypeChecked: false,
    handleOtherEventTypeCheckChange: () => {},
    otherEventTypeDetail: "",
    setOtherEventTypeDetail: () => {},
    newEventNotes: "",
    setNewEventNotes: () => {},
    newEventDurationHours: "",
    setNewEventDurationHours: () => {},
    newEventDurationMinutes: "",
    setNewEventDurationMinutes: () => {},
    newEventSelfOrgasmAmount: "",
    setNewEventSelfOrgasmAmount: () => {},
    newEventPartnerOrgasmAmount: "",
    setNewEventPartnerOrgasmAmount: () => {},
  };

  return (
    <StrictMode>
      <App {...appProps} />
    </StrictMode>
  );
};

// The ESLint warning "Fast refresh only works when a file has exports" for `Main`
// is acceptable here as `Main` is the root component for this entry file.
// If this becomes an issue or for stricter linting, `Main` could be moved,
// but exporting it here should satisfy the linter.
createRoot(document.getElementById('root')).render(<Main />);
