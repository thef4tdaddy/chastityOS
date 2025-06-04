import React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInAnonymously 
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
    Timestamp, 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp); 
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const Main = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  const [isCageOn, setIsCageOn] = useState(false);
  const [cageOnTime, setCageOnTime] = useState(null); 
  const [chastityHistory, setChastityHistory] = useState([]);
  const [currentChastitySession, setCurrentChastitySession] = useState(null); 

  const [sexualEventsLog, setSexualEventsLog] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [savedSubmissivesName, setSavedSubmissivesName] = useState('');
  
  const [timeInChastity, setTimeInChastity] = useState(0); 
  const [timeCageOff, setTimeCageOff] = useState(0);       
  const [totalChastityTime, setTotalChastityTime] = useState(0); 
  const [totalTimeCageOff, setTotalTimeCageOff] = useState(0); 
  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedPauseTimeThisSession, setAccumulatedPauseTimeThisSession] = useState(0);
  const [overallTotalPauseTime, setOverallTotalPauseTime] = useState(0);

  const [unlockReasonInput, setUnlockReasonInput] = useState("");
  const [showUnlockReasonPrompt, setShowUnlockReasonPrompt] = useState(false);

  // State for SettingsPage inputs
  const [settingsSubmissivesNameInput, setSettingsSubmissivesNameInput] = useState("");
  const [settingsRestoreUserIdInput, setSettingsRestoreUserIdInput] = useState("");
  const [settingsNameMessage, setSettingsNameMessage] = useState("");
  const [settingsRestoreFromIdMessage, setSettingsRestoreFromIdMessage] = useState("");
  const [settingsEventLogMessage, setSettingsEventLogMessage] = useState("");
  const [settingsConfirmReset, setSettingsConfirmReset] = useState(false);
  const [settingsShowUserId, setSettingsShowUserId] = useState(false);
  const [settingsShowRestorePrompt, setSettingsShowRestorePrompt] = useState(false); // For the confirmation modal


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUserId(userCredential.user.uid);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
        }
      }
      setIsAuthReady(true); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return; 

    const userSettingsDocRef = doc(db, `users/${userId}/settings`, 'profile');
    const unsubscribeSettings = onSnapshot(userSettingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSavedSubmissivesName(data.submissivesName || '');
        setSettingsSubmissivesNameInput(data.submissivesName || ''); 
      } else {
        setSavedSubmissivesName(''); 
        setSettingsSubmissivesNameInput('');
      }
    }, (error) => console.error("Error fetching user settings:", error));

    const chastityStatusDocRef = doc(db, `users/${userId}/status`, 'chastity');
    const unsubscribeStatus = onSnapshot(chastityStatusDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsCageOn(data.isCageOn || false);
        setIsPaused(data.isPaused || false);
        setAccumulatedPauseTimeThisSession(data.accumulatedPauseTimeThisSession || 0);
        if (data.isCageOn && data.cageOnTime) {
            setCurrentChastitySession({ 
                startTime: data.cageOnTime, isPaused: data.isPaused || false,
                pauseStartTime: data.pauseStartTime || null, 
                accumulatedPauseTime: data.accumulatedPauseTimeThisSession || 0,
            });
            setCageOnTime(data.cageOnTime.toDate()); 
        } else {
            setCurrentChastitySession(null); setCageOnTime(null);
        }
      } else { 
        setIsCageOn(false); setCageOnTime(null); setIsPaused(false);
        setAccumulatedPauseTimeThisSession(0); setCurrentChastitySession(null);
      }
    }, (error) => console.error("Error fetching chastity status:", error));

    const chastityHistoryCollRef = collection(db, `users/${userId}/chastityHistory`);
    const qHistory = query(chastityHistoryCollRef, orderBy("startTime", "asc")); 
    const unsubscribeHistory = onSnapshot(qHistory, (querySnapshot) => {
      const history = []; let calculatedTotalChastityTime = 0; 
      let calculatedOverallPauseTime = 0; let calculatedTotalTimeCageOff = 0;
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
      setChastityHistory(history); setTotalChastityTime(calculatedTotalChastityTime); 
      setOverallTotalPauseTime(calculatedOverallPauseTime); setTotalTimeCageOff(calculatedTotalTimeCageOff);
    }, (error) => console.error("Error fetching chastity history:", error));

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
      setSexualEventsLog(events); setIsLoadingEvents(false);
    }, (error) => { console.error("Error fetching sexual events log:", error); setIsLoadingEvents(false); });

    return () => { 
      unsubscribeSettings(); unsubscribeStatus(); unsubscribeHistory(); unsubscribeEvents();
    };
  }, [userId]);

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
                }, 1000);
            } else { 
                 setTimeCageOff(0); setTimeInChastity(0);
            }
        } else { 
            setTimeInChastity(0); setTimeCageOff(0);
        }
    }
    return () => clearInterval(intervalId);
  }, [isCageOn, currentChastitySession, chastityHistory, isAuthReady, userId]);

  const handleToggleCage = async (reason = "") => { 
    if (!userId) return;
    const newCageStatus = !isCageOn;
    const nowTimestamp = Timestamp.now(); 
    const statusDocRef = doc(db, `users/${userId}/status`, 'chastity');
    try {
        if (newCageStatus) { 
            await setDoc(statusDocRef, { 
                isCageOn: true, cageOnTime: nowTimestamp, isPaused: false,
                pauseStartTime: null, accumulatedPauseTimeThisSession: 0 
            }, { merge: true });
            setShowUnlockReasonPrompt(false); 
        } else { 
            const currentStatusSnap = await getDoc(statusDocRef);
            let sessionStartTime = null; let sessionAccumulatedPause = 0;
            let sessionIsPaused = false; let sessionPauseStartTime = null;
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
                startTime: sessionStartTime, endTime: nowTimestamp, duration: currentSessionRawDuration, 
                reasonForRemoval: reason || "N/A", totalPauseDurationSeconds: sessionAccumulatedPause,
                periodNumber: chastityHistory.length + 1 
            };
            await addDoc(collection(db, `users/${userId}/chastityHistory`), historyEntry);
            await setDoc(statusDocRef, { 
                isCageOn: false, cageOnTime: null, lastUnlockTime: nowTimestamp,
                isPaused: false, pauseStartTime: null, accumulatedPauseTimeThisSession: 0
            }, { merge: true });
            setShowUnlockReasonPrompt(false); setUnlockReasonInput(""); 
        }
    } catch (error) { console.error("Error toggling cage status:", error); }
  };

  const handleLogNewEvent = async (eventData) => {
    if (!userId) return;
    try {
      const { date, time, types, otherDetail, notes, durationHours, durationMinutes, selfOrgasmAmount, partnerOrgasmAmount } = eventData;
      const combinedTimestamp = Timestamp.fromDate(new Date(`${date}T${time}`));
      let durationSeconds = (parseInt(durationHours, 10) || 0) * 3600 + (parseInt(durationMinutes, 10) || 0) * 60;
      await addDoc(collection(db, `users/${userId}/sexualEventsLog`), {
        eventTimestamp: combinedTimestamp, types: types || [], otherTypeDetail: otherDetail || "",
        notes: notes || "", durationSeconds,
        selfOrgasmAmount: parseInt(selfOrgasmAmount, 10) || 0,
        partnerOrgasmAmount: parseInt(partnerOrgasmAmount, 10) || 0,
      });
      console.log("Event logged successfully");
      setSettingsEventLogMessage("Event logged successfully!"); 
    } catch (error) { 
        console.error("Error logging event:", error); 
        setSettingsEventLogMessage("Error logging event: " + error.message); 
    }
  };

  const handleSettingsSubmissivesNameInputChange = (e) => {
    setSettingsSubmissivesNameInput(e.target.value);
  };

  const handleSaveSubmissivesName = async () => {
    if (!userId || !settingsSubmissivesNameInput.trim()) {
        setSettingsNameMessage("Name cannot be empty.");
        return;
    }
    const settingsDocRef = doc(db, `users/${userId}/settings`, 'profile');
    try {
      await setDoc(settingsDocRef, { submissivesName: settingsSubmissivesNameInput.trim() }, { merge: true });
      setSettingsNameMessage("Submissive's name updated successfully!");
    } catch (error) {
      console.error("Error setting submissive's name:", error);
      setSettingsNameMessage("Error updating name.");
    }
  };
  
  const handleSettingsRestoreUserIdInputChange = (e) => {
    setSettingsRestoreUserIdInput(e.target.value);
  };
  
  const handleInitiateRestoreFromId = () => {
      console.log("Initiate Restore From ID clicked for User ID:", settingsRestoreUserIdInput);
      setSettingsRestoreFromIdMessage(`Attempting to restore from ID: ${settingsRestoreUserIdInput}. This feature is not fully implemented.`);
      // Placeholder: In a real implementation, you would set settingsShowRestorePrompt(true) here
      // after some validation or if the input is not empty.
      if (settingsRestoreUserIdInput.trim()) {
        setSettingsShowRestorePrompt(true); // Show the confirmation modal
      } else {
        setSettingsRestoreFromIdMessage("Please enter a User ID to restore from.");
      }
  };

  const handleConfirmRestoreFromId = () => {
      console.log("Confirm Restore From ID clicked for:", settingsRestoreUserIdInput);
      setSettingsRestoreFromIdMessage(`Restore confirmed for ID: ${settingsRestoreUserIdInput}. (Not implemented)`);
      setSettingsShowRestorePrompt(false);
      // Actual restore logic would go here
  };

  const handleCancelRestoreFromId = () => {
      console.log("Cancel Restore From ID clicked");
      setSettingsRestoreFromIdMessage("Restore cancelled.");
      setSettingsShowRestorePrompt(false);
  };
  
  const handlePlaceholder = (message) => () => {
      console.log(`${message} clicked`);
      setSettingsEventLogMessage(`${message} action initiated.`);
  };


  if (!isAuthReady) {
    return <div className="text-center p-8 text-purple-300">Initializing authentication...</div>;
  }

  const appProps = {
    isAuthReady, userId, GA_MEASUREMENT_ID: gaMeasurementId,
    isCageOn, cageOnTime, chastityHistory,
    currentSessionInChastitySeconds: timeInChastity, 
    currentSessionCageOffSeconds: timeCageOff,       
    overallTotalChastitySeconds: totalChastityTime,  
    overallTotalCageOffSeconds: totalTimeCageOff,    
    handleToggleCage, unlockReasonInput, setUnlockReasonInput,
    showUnlockReasonPrompt, setShowUnlockReasonPrompt,
    
    sexualEventsLog, isLoadingEvents, handleLogNewEvent, 
    savedSubmissivesName, 
    
    timeInChastity, isPaused, accumulatedPauseTimeThisSession, overallTotalPauseTime,
    
    settingsSubmissivesNameInput, 
    handleSettingsSubmissivesNameInputChange, 
    handleSaveSubmissivesName, 
    settingsRestoreUserIdInput,
    handleSettingsRestoreUserIdInputChange,
    nameMessage: settingsNameMessage,
    restoreFromIdMessage: settingsRestoreFromIdMessage, 
    eventLogMessage: settingsEventLogMessage,
    confirmReset: settingsConfirmReset,
    setConfirmReset: setSettingsConfirmReset, 
    showUserIdInSettings: settingsShowUserId,
    setShowUserIdInSettings: setSettingsShowUserId, 

    handleExportTrackerCSV: handlePlaceholder("Export Tracker CSV"),
    handleExportEventLogCSV: handlePlaceholder("Export Event Log CSV"),
    handleResetAllData: handlePlaceholder("Reset All Data"),
    handleExportTextReport: handlePlaceholder("Export Text Report"),
    handleToggleUserIdVisibility: () => setSettingsShowUserId(prev => !prev),
    handleInitiateRestoreFromId, // Pass the actual handler
    showRestoreFromIdPrompt: settingsShowRestorePrompt, // Pass state for modal visibility
    handleConfirmRestoreFromId, // Pass the actual handler
    handleCancelRestoreFromId,  // Pass the actual handler
  };

  return (
    <StrictMode>
      <App {...appProps} />
    </StrictMode>
  );
};

createRoot(document.getElementById('root')).render(<Main />);
