import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, updateDoc, onSnapshot, serverTimestamp, collection, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { logEvent } from '../../utils/logging';
import { formatElapsedTime } from '../../utils';

// Timer states
export const TimerState = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
};

// Timer types
export const TimerType = {
  SESSION: 'session',
  TASK: 'task',
  PUNISHMENT: 'punishment',
  COUNTDOWN: 'countdown',
  STOPWATCH: 'stopwatch'
};

// Sync status
export const SyncStatus = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  DESYNC: 'desync',
  ERROR: 'error'
};

export const useLiveTimer = (userId, sessionId = null, relationshipId = null) => {
  const [timerState, setTimerState] = useState({
    id: null,
    type: TimerType.SESSION,
    state: TimerState.STOPPED,
    startTime: null,
    endTime: null,
    duration: 0,
    elapsed: 0,
    remaining: 0,
    progress: 0,
    isPaused: false,
    pausedAt: null,
    pausedDuration: 0
  });

  const [syncStatus, setSyncStatus] = useState(SyncStatus.SYNCED);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [timerEvents, setTimerEvents] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncConflicts, setSyncConflicts] = useState([]);

  // Refs for managing intervals and real-time updates
  const timerIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const lastServerTimeRef = useRef(null);
  const clockSkewRef = useRef(0);

  // Calculate clock skew with server
  const calculateClockSkew = useCallback(async () => {
    try {
      const clientTime = Date.now();
      // In a real implementation, this would ping the server for accurate time
      // For now, we'll simulate server time
      const serverTime = clientTime; // Simulate no skew
      clockSkewRef.current = serverTime - clientTime;
    } catch (error) {
      console.error('Error calculating clock skew:', error);
      clockSkewRef.current = 0;
    }
  }, []);

  // Get synchronized time
  const getSyncTime = useCallback(() => {
    return new Date(Date.now() + clockSkewRef.current);
  }, []);

  // Initialize live timer
  const initializeLiveTimer = useCallback(async () => {
    if (!userId) return;

    try {
      // Calculate clock skew
      await calculateClockSkew();

      // Set up timer listeners
      setupTimerListeners();

      // Start sync monitoring
      startSyncMonitoring();

      // Log initialization
      await logEvent(userId, 'LIVE_TIMER_INITIALIZED', {
        sessionId,
        relationshipId
      });
    } catch (error) {
      console.error('Error initializing live timer:', error);
      setSyncStatus(SyncStatus.ERROR);
    }
  }, [userId, sessionId, relationshipId, calculateClockSkew]);

  // Setup timer listeners for real-time sync
  const setupTimerListeners = useCallback(() => {
    if (!sessionId) return;

    // Listen to timer updates
    const timerRef = doc(db, 'sessions', sessionId, 'timer');
    const timerUnsubscribe = onSnapshot(timerRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        handleTimerUpdate(data);
      }
    });

    // Listen to timer events
    const eventsRef = collection(db, 'sessions', sessionId, 'timerEvents');
    const eventsQuery = query(eventsRef, orderBy('timestamp', 'desc'), limit(50));
    const eventsUnsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const events = [];
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });
      setTimerEvents(events);
    });

    // Listen to connected users if in a relationship
    let usersUnsubscribe = null;
    if (relationshipId) {
      const usersRef = collection(db, 'relationships', relationshipId, 'connectedUsers');
      usersUnsubscribe = onSnapshot(usersRef, (snapshot) => {
        const users = [];
        snapshot.forEach(doc => {
          users.push({
            id: doc.id,
            ...doc.data(),
            lastSeen: doc.data().lastSeen?.toDate() || new Date()
          });
        });
        setConnectedUsers(users);
      });
    }

    // Store unsubscribe functions
    unsubscribeRef.current = () => {
      timerUnsubscribe();
      eventsUnsubscribe();
      if (usersUnsubscribe) usersUnsubscribe();
    };
  }, [sessionId, relationshipId]);

  // Handle incoming timer updates
  const handleTimerUpdate = useCallback((serverData) => {
    try {
      const serverTime = getSyncTime();
      const serverStartTime = serverData.startTime?.toDate();
      const serverEndTime = serverData.endTime?.toDate();
      const serverPausedAt = serverData.pausedAt?.toDate();

      // Check for conflicts
      if (lastServerTimeRef.current && serverData.lastUpdated) {
        const serverLastUpdated = serverData.lastUpdated.toDate();
        if (serverLastUpdated < lastServerTimeRef.current) {
          // Potential conflict - server data is older
          setSyncConflicts(prev => [...prev, {
            id: Date.now().toString(),
            type: 'timestamp_conflict',
            localTime: lastServerTimeRef.current,
            serverTime: serverLastUpdated,
            timestamp: new Date()
          }]);
        }
      }

      lastServerTimeRef.current = serverData.lastUpdated?.toDate() || new Date();

      // Update timer state from server
      const newState = {
        id: serverData.id || timerState.id,
        type: serverData.type || TimerType.SESSION,
        state: serverData.state || TimerState.STOPPED,
        startTime: serverStartTime,
        endTime: serverEndTime,
        duration: serverData.duration || 0,
        isPaused: serverData.isPaused || false,
        pausedAt: serverPausedAt,
        pausedDuration: serverData.pausedDuration || 0
      };

      // Calculate current values
      if (newState.state === TimerState.RUNNING && newState.startTime) {
        const elapsed = calculateElapsed(newState.startTime, newState.pausedDuration, serverTime);
        newState.elapsed = elapsed;
        
        if (newState.duration > 0) {
          newState.remaining = Math.max(0, newState.duration - elapsed);
          newState.progress = Math.min(1, elapsed / newState.duration);
          
          // Check if timer completed
          if (newState.remaining <= 0 && newState.state === TimerState.RUNNING) {
            newState.state = TimerState.COMPLETED;
          }
        } else {
          newState.remaining = 0;
          newState.progress = 0;
        }
      }

      setTimerState(newState);
      setSyncStatus(SyncStatus.SYNCED);
      setLastSyncTime(serverTime);
    } catch (error) {
      console.error('Error handling timer update:', error);
      setSyncStatus(SyncStatus.ERROR);
    }
  }, [timerState.id, getSyncTime]);

  // Calculate elapsed time accounting for pauses
  const calculateElapsed = useCallback((startTime, pausedDuration, currentTime = null) => {
    if (!startTime) return 0;
    
    const now = currentTime || getSyncTime();
    const totalRunTime = now.getTime() - startTime.getTime();
    return Math.max(0, Math.floor((totalRunTime - pausedDuration) / 1000));
  }, [getSyncTime]);

  // Start sync monitoring
  const startSyncMonitoring = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(() => {
      // Update local timer display
      if (timerState.state === TimerState.RUNNING && timerState.startTime) {
        const currentTime = getSyncTime();
        const elapsed = calculateElapsed(timerState.startTime, timerState.pausedDuration, currentTime);
        
        setTimerState(prev => {
          const newState = { ...prev, elapsed };
          
          if (prev.duration > 0) {
            newState.remaining = Math.max(0, prev.duration - elapsed);
            newState.progress = Math.min(1, elapsed / prev.duration);
            
            // Auto-complete timer if time reached
            if (newState.remaining <= 0 && prev.state === TimerState.RUNNING) {
              completeTimer();
            }
          }
          
          return newState;
        });
      }

      // Check sync status
      if (lastSyncTime && (Date.now() - lastSyncTime.getTime()) > 10000) {
        setSyncStatus(SyncStatus.DESYNC);
      }
    }, 1000); // Update every second
  }, [timerState, getSyncTime, calculateElapsed, lastSyncTime]);

  // Initialize on mount
  useEffect(() => {
    initializeLiveTimer();

    return () => {
      // Cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [initializeLiveTimer]);

  // Sync timer to server
  const syncToServer = useCallback(async (timerData) => {
    if (!sessionId) return;

    try {
      setSyncStatus(SyncStatus.SYNCING);
      
      const timerRef = doc(db, 'sessions', sessionId, 'timer');
      await updateDoc(timerRef, {
        ...timerData,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: userId,
        syncTime: getSyncTime()
      }, { merge: true });

      setLastSyncTime(getSyncTime());
      setSyncStatus(SyncStatus.SYNCED);
    } catch (error) {
      console.error('Error syncing timer to server:', error);
      setSyncStatus(SyncStatus.ERROR);
    }
  }, [sessionId, userId, getSyncTime]);

  // Log timer event
  const logTimerEvent = useCallback(async (eventType, eventData = {}) => {
    if (!sessionId) return;

    try {
      const eventsRef = collection(db, 'sessions', sessionId, 'timerEvents');
      const event = {
        type: eventType,
        userId,
        timestamp: serverTimestamp(),
        timerState: {
          state: timerState.state,
          elapsed: timerState.elapsed,
          remaining: timerState.remaining
        },
        data: eventData
      };

      await addDoc(eventsRef, event);

      // Log to user's general event log
      await logEvent(userId, 'TIMER_EVENT', {
        eventType,
        sessionId,
        ...eventData
      });
    } catch (error) {
      console.error('Error logging timer event:', error);
    }
  }, [sessionId, userId, timerState]);

  // Start timer
  const startTimer = useCallback(async (duration = 0, timerType = TimerType.SESSION) => {
    const startTime = getSyncTime();
    const newTimerState = {
      id: sessionId || Date.now().toString(),
      type: timerType,
      state: TimerState.RUNNING,
      startTime,
      endTime: duration > 0 ? new Date(startTime.getTime() + duration * 1000) : null,
      duration,
      elapsed: 0,
      remaining: duration,
      progress: 0,
      isPaused: false,
      pausedAt: null,
      pausedDuration: 0
    };

    setTimerState(newTimerState);
    await syncToServer(newTimerState);
    await logTimerEvent('timer_started', { duration, type: timerType });
  }, [sessionId, getSyncTime, syncToServer, logTimerEvent]);

  // Stop timer
  const stopTimer = useCallback(async () => {
    const stopTime = getSyncTime();
    const finalElapsed = calculateElapsed(timerState.startTime, timerState.pausedDuration, stopTime);
    
    const stoppedState = {
      ...timerState,
      state: TimerState.STOPPED,
      elapsed: finalElapsed,
      remaining: Math.max(0, timerState.duration - finalElapsed),
      endTime: stopTime
    };

    setTimerState(stoppedState);
    await syncToServer(stoppedState);
    await logTimerEvent('timer_stopped', { finalElapsed });
  }, [timerState, getSyncTime, calculateElapsed, syncToServer, logTimerEvent]);

  // Pause timer
  const pauseTimer = useCallback(async () => {
    if (timerState.state !== TimerState.RUNNING) return;

    const pauseTime = getSyncTime();
    const pausedState = {
      ...timerState,
      state: TimerState.PAUSED,
      isPaused: true,
      pausedAt: pauseTime
    };

    setTimerState(pausedState);
    await syncToServer(pausedState);
    await logTimerEvent('timer_paused', { pausedAt: pauseTime });
  }, [timerState, getSyncTime, syncToServer, logTimerEvent]);

  // Resume timer
  const resumeTimer = useCallback(async () => {
    if (timerState.state !== TimerState.PAUSED || !timerState.pausedAt) return;

    const resumeTime = getSyncTime();
    const additionalPausedDuration = resumeTime.getTime() - timerState.pausedAt.getTime();
    
    const resumedState = {
      ...timerState,
      state: TimerState.RUNNING,
      isPaused: false,
      pausedAt: null,
      pausedDuration: timerState.pausedDuration + additionalPausedDuration
    };

    setTimerState(resumedState);
    await syncToServer(resumedState);
    await logTimerEvent('timer_resumed', { 
      pauseDuration: additionalPausedDuration,
      totalPausedDuration: resumedState.pausedDuration 
    });
  }, [timerState, getSyncTime, syncToServer, logTimerEvent]);

  // Complete timer
  const completeTimer = useCallback(async () => {
    const completeTime = getSyncTime();
    const finalElapsed = timerState.duration || calculateElapsed(timerState.startTime, timerState.pausedDuration, completeTime);
    
    const completedState = {
      ...timerState,
      state: TimerState.COMPLETED,
      elapsed: finalElapsed,
      remaining: 0,
      progress: 1,
      endTime: completeTime
    };

    setTimerState(completedState);
    await syncToServer(completedState);
    await logTimerEvent('timer_completed', { finalElapsed });
  }, [timerState, getSyncTime, calculateElapsed, syncToServer, logTimerEvent]);

  // Add time to timer
  const addTime = useCallback(async (seconds) => {
    if (timerState.state === TimerState.STOPPED || timerState.state === TimerState.COMPLETED) return;

    const newDuration = timerState.duration + seconds;
    const newEndTime = timerState.startTime ? 
      new Date(timerState.startTime.getTime() + newDuration * 1000) : null;
    
    const updatedState = {
      ...timerState,
      duration: newDuration,
      endTime: newEndTime,
      remaining: Math.max(0, newDuration - timerState.elapsed)
    };

    setTimerState(updatedState);
    await syncToServer(updatedState);
    await logTimerEvent('time_added', { addedSeconds: seconds, newDuration });
  }, [timerState, syncToServer, logTimerEvent]);

  // Remove time from timer
  const removeTime = useCallback(async (seconds) => {
    if (timerState.state === TimerState.STOPPED || timerState.state === TimerState.COMPLETED) return;

    const newDuration = Math.max(0, timerState.duration - seconds);
    const newEndTime = timerState.startTime ? 
      new Date(timerState.startTime.getTime() + newDuration * 1000) : null;
    
    const updatedState = {
      ...timerState,
      duration: newDuration,
      endTime: newEndTime,
      remaining: Math.max(0, newDuration - timerState.elapsed)
    };

    // Check if timer should complete immediately
    if (updatedState.remaining <= 0 && timerState.state === TimerState.RUNNING) {
      await completeTimer();
      return;
    }

    setTimerState(updatedState);
    await syncToServer(updatedState);
    await logTimerEvent('time_removed', { removedSeconds: seconds, newDuration });
  }, [timerState, syncToServer, logTimerEvent, completeTimer]);

  // Force sync with server
  const forceSync = useCallback(async () => {
    if (!sessionId) return;

    try {
      setSyncStatus(SyncStatus.SYNCING);
      await syncToServer(timerState);
      await logTimerEvent('force_sync');
    } catch (error) {
      console.error('Error forcing sync:', error);
      setSyncStatus(SyncStatus.ERROR);
    }
  }, [sessionId, timerState, syncToServer, logTimerEvent]);

  // Resolve sync conflict
  const resolveSyncConflict = useCallback(async (conflictId, resolution) => {
    setSyncConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    if (resolution === 'use_server') {
      // Force refresh from server
      await forceSync();
    } else if (resolution === 'use_local') {
      // Force push local state to server
      await syncToServer(timerState);
    }
    
    await logTimerEvent('conflict_resolved', { conflictId, resolution });
  }, [forceSync, syncToServer, timerState, logTimerEvent]);

  // Computed values
  const isRunning = timerState.state === TimerState.RUNNING;
  const isPaused = timerState.state === TimerState.PAUSED;
  const isCompleted = timerState.state === TimerState.COMPLETED;
  const isSynced = syncStatus === SyncStatus.SYNCED;
  const hasConflicts = syncConflicts.length > 0;

  // Format display values
  const formattedElapsed = useMemo(() => formatElapsedTime(timerState.elapsed), [timerState.elapsed]);
  const formattedRemaining = useMemo(() => formatElapsedTime(timerState.remaining), [timerState.remaining]);
  const formattedDuration = useMemo(() => formatElapsedTime(timerState.duration), [timerState.duration]);

  // Connected users info
  const connectedUsersCount = connectedUsers.length;
  const keyholderOnline = useMemo(() => {
    return connectedUsers.some(user => user.role === 'keyholder' && user.isOnline);
  }, [connectedUsers]);

  return {
    // Timer state
    timerState,
    syncStatus,
    connectedUsers,
    timerEvents: timerEvents.slice(0, 10), // Recent events
    lastSyncTime,
    syncConflicts,

    // Timer controls
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    completeTimer,
    addTime,
    removeTime,

    // Sync controls
    forceSync,
    resolveSyncConflict,

    // Computed values
    isRunning,
    isPaused,
    isCompleted,
    isSynced,
    hasConflicts,
    formattedElapsed,
    formattedRemaining,
    formattedDuration,
    connectedUsersCount,
    keyholderOnline,

    // Progress values
    progress: timerState.progress,
    elapsed: timerState.elapsed,
    remaining: timerState.remaining,
    duration: timerState.duration
  };
};