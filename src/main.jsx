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

  // --- Application State ---
  const [isCageOn, setIsCageOn] = useState(false);
  const [cageOnTime, setCageOnTime] = useState(null); // JS Date, set from Firestore Timestamp
  const [chastityHistory, setChastityHistory] = useState([]);
  const [currentChastitySession, setCurrentChastitySession] = useState(null); // Holds current session details from Firestore

  // Durations and totals (in seconds)
  // const [cageDuration, setCageDuration] = useState(0); // REMOVED - Live raw duration for current cage-on time was unused
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

  // State for TrackerPage's unlock reason prompt
  const [unlockReasonInput, setUnlockReasonInput] = useState("");
  const [showUnlockReasonPrompt, setShowUnlockReasonPrompt] = useState(false);


  // --- Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        console.log("User signed in:", currentUser.uid);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
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
        setIsPaused(data.isPaused || false);
        setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
        
        if (data.isCageOn && data.cageOnTime) {
            setCurrentChastitySession({ 
                startTime: data.cageOnTime, 
                isPaused: data.isPaused || false,
                pauseStartTime: data.pauseStartTime || null, 
                accumulatedPauseTime: data.accumulatedPauseTimeThisSession || 0,
            });
            setCageOnTime(data.cageOnTime.toDate()); 
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
      let calculatedTotalChastityTime = 0; 
      let calculatedOverallPauseTime = 0;
      let calculatedTotalTimeCageOff = 0;
      let lastPeriodEndTime = null;

      querySnapshot.forEach((docSnap) => {
        const entry = { id: docSnap.id, ...docSnap.data() };
        if (entry.startTime) entry.startTime = entry.startTime.toDate();
        if (entry.endTime) entry.endTime = entry.endTime.toDate();
        
        history.push(entry);

        const sessionDuration = entry.duration || 0; 
        const sessionPause = entry.totalPauseDurationSeconds || 0;
        calculatedTotalChastityTime += (sessionDuration - sessionPause); 
        calculatedOverallPauseTime += sessionPause;

        if(lastPeriodEndTime && entry.startTime) { 
            calculatedTotalTimeCageOff += Math.floor((entry.startTime.getTime() - lastPeriodEndTime.getTime()) / 1000);
        }
        lastPeriodEndTime = entry.endTime;
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
                const startTimeDate = currentChastitySession.startTime.toDate(); 
                
                let currentRawSessionSeconds = Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);
                let effectiveDurationSeconds = currentRawSessionSeconds;
                
                if (currentChastitySession.isPaused && currentChastitySession.pauseStartTime) {
                    const pauseStartTimeDate = currentChastitySession.pauseStartTime.toDate(); 
                    const currentPauseDuration = Math.floor((now.getTime() - pauseStartTimeDate.getTime()) / 1000);
                    effectiveDurationSeconds -= (currentChastitySession.accumulatedPauseTime + currentPauseDuration);
                } else {
                    effectiveDurationSeconds -= currentChastitySession.accumulatedPauseTime;
                }

                setTimeInChastity(Math.max(0, effectiveDurationSeconds)); 
                // setCageDuration(Math.max(0, currentRawSessionSeconds)); // REMOVED - setCageDuration call
                setTimeCageOff(0);
            }, 1000);
        } else if (!isCageOn) { 
            const lastSession = chastityHistory.length > 0 ? chastityHistory[chastityHistory.length - 1] : null;
            if (lastSession && lastSession.endTime) { 
                 intervalId = setInterval(() => {
                    const now = new Date();
                    const endTimeDate = lastSession.endTime; 
                    setTimeCageOff(Math.floor((now.getTime() - endTimeDate.getTime()) / 1000));
                    setTimeInChastity(0); 
                    // setCageDuration(0); // REMOVED - setCageDuration call
                }, 1000);
            } else { 
                 setTimeCageOff(0); 
                 setTimeInChastity(0);
                 // setCageDuration(0); // REMOVED - setCageDuration call
            }
        } else { 
            setTimeInChastity(0);
            setTimeCageOff(0);
            // setCageDuration(0); // REMOVED - setCageDuration call
        }
    }
    return () => clearInterval(intervalId);
  }, [isCageOn, currentChastitySession, chastityHistory, isAuthReady, userId]);


  // --- Action Handlers ---
  const handleToggleCage = async (reason = "") => { 
    if (!userId) return;
    const newCageStatus = !isCageOn;
    const nowTimestamp = Timestamp.now(); 
    const statusDocRef = doc(db, `users/${userId}/status`, 'chastity');
    
    try {
        if (newCageStatus) { 
            await setDoc(statusDocRef, { 
                isCageOn: true, 
                cageOnTime: nowTimestamp,
                isPaused: false,
                pauseStartTime: null,
                accumulatedPauseTimeThisSession: 0 
            }, { merge: true });
            setShowUnlockReasonPrompt(false); 
        } else { 
            const currentStatusSnap = await getDoc(statusDocRef);
            let sessionStartTime = null;
            let sessionAccumulatedPause = 0;
            let sessionIsPaused = false;
            let sessionPauseStartTime = null;

            if (currentStatusSnap.exists()) {
                const currentData = currentStatusSnap.data();
                sessionStartTime = currentData.cageOnTime; 
                sessionAccumulatedPause = currentData.accumulatedPauseTimeThisSession || 0;
                sessionIsPaused = currentData.isPaused || false;
                sessionPauseStartTime = currentData.pauseStartTime; 
            }
            
            let currentSessionRawDuration = 0;
            if (sessionStartTime) {
                currentSessionRawDuration = Math.floor((nowTimestamp.toDate().getTime() - sessionStartTime.toDate().getTime()) / 1000);
            }

            if (sessionIsPaused && sessionPauseStartTime) {
                sessionAccumulatedPause += Math.floor((nowTimestamp.toDate().getTime() - sessionPauseStartTime.toDate().getTime()) / 1000);
            }
            
            const historyEntry = {
                startTime: sessionStartTime, 
                endTime: nowTimestamp,       
                duration: currentSessionRawDuration, 
                reasonForRemoval: reason || "N/A", 
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
            setShowUnlockReasonPrompt(false); 
            setUnlockReasonInput(""); 
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
    
    // Props for TrackerPage
    isCageOn,
    cageOnTime, 
    chastityHistory,
    currentSessionInChastitySeconds: timeInChastity, 
    currentSessionCageOffSeconds: timeCageOff,       
    overallTotalChastitySeconds: totalChastityTime,  
    overallTotalCageOffSeconds: totalTimeCageOff,    
    handleToggleCage, 
    unlockReasonInput,
    setUnlockReasonInput,
    showUnlockReasonPrompt,
    setShowUnlockReasonPrompt,
    
    // Props for LogEventPage 
    sexualEventsLog,
    isLoadingEvents,
    handleLogNewEvent, 
    savedSubmissivesName,
    
    // Props for FullReportPage
    timeInChastity, 
    isPaused,
    accumulatedPauseTimeThisSession,
    overallTotalPauseTime,
    
    // Props for SettingsPage
    handleSetSubmissivesName,
    
    // Placeholder props 
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

    // Props for LogEventPage form (these should ideally be managed locally in LogEventPage)
    newEventDate: new Date().toISOString().split('T')[0],
    setNewEventDate: () => {}, 
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

createRoot(document.getElementById('root')).render(<Main />);
