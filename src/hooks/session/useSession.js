import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {Date} startTime
 * @property {Date} [endTime]
 * @property {boolean} isActive
 * @property {number} [duration]
 * @property {string} [reason]
 */

/**
 * @typedef {Object} SessionState
 * @property {Session|null} currentSession
 * @property {boolean} isSessionActive
 * @property {Date|null} sessionStartTime
 * @property {number} elapsedTime
 */

/**
 * @typedef {Object} SessionOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {Function} [onSessionChange]
 */

/**
 * Hook for managing user sessions
 * @param {SessionOptions} options
 * @returns {Object}
 */
export const useSession = ({ userId, isAuthReady, onSessionChange }) => {
  const [sessionState, setSessionState] = useState({
    currentSession: null,
    isSessionActive: false,
    sessionStartTime: null,
    elapsedTime: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const timerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const saveSessionToFirestore = useCallback(async (sessionData) => {
    if (!userId || !isAuthReady) {
      return;
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { 
        currentSession: sessionData,
        sessionUpdatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
    }
  }, [userId, isAuthReady]);

  const startSession = useCallback(async () => {
    if (sessionState.isSessionActive) {
      setError('Session already active');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startTime = new Date();
      const newSession = {
        id: crypto.randomUUID(),
        startTime,
        isActive: true
      };

      const newState = {
        currentSession: newSession,
        isSessionActive: true,
        sessionStartTime: startTime,
        elapsedTime: 0
      };

      setSessionState(newState);
      await saveSessionToFirestore(newSession);
      if (onSessionChange) onSessionChange(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionState.isSessionActive, saveSessionToFirestore, onSessionChange]);

  const endSession = useCallback(async (reason) => {
    if (!sessionState.isSessionActive || !sessionState.currentSession) {
      setError('No active session to end');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endTime = new Date();
      const duration = sessionState.sessionStartTime 
        ? Math.floor((endTime.getTime() - sessionState.sessionStartTime.getTime()) / 1000)
        : 0;

      const endedSession = {
        ...sessionState.currentSession,
        endTime,
        isActive: false,
        duration,
        reason
      };

      const newState = {
        currentSession: null,
        isSessionActive: false,
        sessionStartTime: null,
        elapsedTime: 0
      };

      setSessionState(newState);
      await saveSessionToFirestore(endedSession);
      if (onSessionChange) onSessionChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setIsLoading(false);
    }
  }, [
    sessionState.isSessionActive, 
    sessionState.currentSession, 
    sessionState.sessionStartTime,
    saveSessionToFirestore, 
    onSessionChange
  ]);

  const updateSession = useCallback(async (updates) => {
    if (!sessionState.currentSession) {
      setError('No active session to update');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedSession = {
        ...sessionState.currentSession,
        ...updates
      };

      setSessionState(prev => ({
        ...prev,
        currentSession: updatedSession
      }));

      await saveSessionToFirestore(updatedSession);
      if (onSessionChange) onSessionChange(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionState.currentSession, saveSessionToFirestore, onSessionChange]);

  // Real-time session listener
  useEffect(() => {
    if (!userId || !isAuthReady) {
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.currentSession) {
            const session = {
              ...data.currentSession,
              startTime: data.currentSession.startTime?.toDate(),
              endTime: data.currentSession.endTime?.toDate()
            };

            setSessionState(prev => ({
              ...prev,
              currentSession: session,
              isSessionActive: session.isActive,
              sessionStartTime: session.startTime
            }));
          } else {
            setSessionState({
              currentSession: null,
              isSessionActive: false,
              sessionStartTime: null,
              elapsedTime: 0
            });
          }
        }
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId, isAuthReady]);

  // Timer for elapsed time
  useEffect(() => {
    if (sessionState.isSessionActive && sessionState.sessionStartTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - sessionState.sessionStartTime.getTime()) / 1000);
        setSessionState(prev => ({
          ...prev,
          elapsedTime: elapsed
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState.isSessionActive, sessionState.sessionStartTime]);

  return {
    sessionState,
    isLoading,
    error,
    startSession,
    endSession,
    updateSession,
    clearError: useCallback(() => setError(null), [])
  };
};