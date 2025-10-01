import { useState, useCallback, useEffect, useRef } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * @typedef {Object} PauseEvent
 * @property {string} id
 * @property {Date} startTime
 * @property {Date} [endTime]
 * @property {string} reason
 * @property {number} [duration]
 */

/**
 * @typedef {Object} PauseResumeState
 * @property {boolean} isPaused
 * @property {Date|null} pauseStartTime
 * @property {number} totalPauseTime
 * @property {PauseEvent[]} pauseEvents
 * @property {Date|null} cooldownEndTime
 */

/**
 * @typedef {Object} PauseResumeOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {boolean} sessionActive
 * @property {Function} [onStateChange]
 */

/**
 * Hook for managing session pause/resume functionality
 * @param {PauseResumeOptions} options
 * @returns {Object}
 */
export const usePauseResume = ({
  userId,
  isAuthReady,
  sessionActive,
  onStateChange,
}) => {
  const [pauseState, setPauseState] = useState({
    isPaused: false,
    pauseStartTime: null,
    totalPauseTime: 0,
    pauseEvents: [],
    cooldownEndTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pauseTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  const saveStateToFirestore = useCallback(
    async (newState) => {
      if (!userId || !isAuthReady) {
        return;
      }

      try {
        const userDocRef = doc(db, "users", userId);
        await setDoc(
          userDocRef,
          { pauseResumeState: newState },
          { merge: true },
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save pause state",
        );
      }
    },
    [userId, isAuthReady],
  );

  const pauseSession = useCallback(
    async (reason = "Manual pause") => {
      if (!sessionActive || pauseState.isPaused) {
        setError("Cannot pause: session not active or already paused");
        return;
      }

      // Check cooldown
      if (
        pauseState.cooldownEndTime &&
        new Date() < pauseState.cooldownEndTime
      ) {
        const remainingTime = Math.ceil(
          (pauseState.cooldownEndTime.getTime() - new Date().getTime()) / 1000,
        );
        setError(
          `Pause is on cooldown. Try again in ${remainingTime} seconds.`,
        );
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const pauseStartTime = new Date();
        const newPauseEvent = {
          id: crypto.randomUUID(),
          startTime: pauseStartTime,
          reason,
        };

        const newState = {
          ...pauseState,
          isPaused: true,
          pauseStartTime,
          pauseEvents: [...pauseState.pauseEvents, newPauseEvent],
        };

        setPauseState(newState);
        await saveStateToFirestore(newState);
        if (onStateChange) onStateChange(newState);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to pause session",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [sessionActive, pauseState, saveStateToFirestore, onStateChange],
  );

  const resumeSession = useCallback(async () => {
    if (!pauseState.isPaused || !pauseState.pauseStartTime) {
      setError("Cannot resume: session not paused");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resumeTime = new Date();
      const pauseDuration = Math.floor(
        (resumeTime.getTime() - pauseState.pauseStartTime.getTime()) / 1000,
      );

      // Update the last pause event with end time and duration
      const updatedPauseEvents = [...pauseState.pauseEvents];
      const lastEventIndex = updatedPauseEvents.length - 1;
      if (lastEventIndex >= 0) {
        updatedPauseEvents[lastEventIndex] = {
          ...updatedPauseEvents[lastEventIndex],
          endTime: resumeTime,
          duration: pauseDuration,
        };
      }

      // Set cooldown (12 hours from now)
      const cooldownEndTime = new Date(
        resumeTime.getTime() + 12 * 60 * 60 * 1000,
      );

      const newState = {
        ...pauseState,
        isPaused: false,
        pauseStartTime: null,
        totalPauseTime: pauseState.totalPauseTime + pauseDuration,
        pauseEvents: updatedPauseEvents,
        cooldownEndTime,
      };

      setPauseState(newState);
      await saveStateToFirestore(newState);
      if (onStateChange) onStateChange(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume session");
    } finally {
      setIsLoading(false);
    }
  }, [pauseState, saveStateToFirestore, onStateChange]);

  const getCurrentPauseDuration = useCallback(() => {
    if (!pauseState.isPaused || !pauseState.pauseStartTime) {
      return 0;
    }
    return Math.floor(
      (new Date().getTime() - pauseState.pauseStartTime.getTime()) / 1000,
    );
  }, [pauseState.isPaused, pauseState.pauseStartTime]);

  // Timer to update current pause duration
  useEffect(() => {
    if (pauseState.isPaused && pauseState.pauseStartTime) {
      pauseTimerRef.current = setInterval(() => {
        // Force re-render to update current pause duration in UI
        setPauseState((prev) => ({ ...prev }));
      }, 1000);
    } else {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    }

    return () => {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
      }
    };
  }, [pauseState.isPaused, pauseState.pauseStartTime]);

  // Cooldown timer
  useEffect(() => {
    if (pauseState.cooldownEndTime && pauseState.cooldownEndTime > new Date()) {
      const timeUntilCooldownEnd =
        pauseState.cooldownEndTime.getTime() - new Date().getTime();

      cooldownTimerRef.current = setTimeout(() => {
        setPauseState((prev) => ({ ...prev, cooldownEndTime: null }));
      }, timeUntilCooldownEnd);
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [pauseState.cooldownEndTime]);

  return {
    pauseState,
    isLoading,
    error,
    pauseSession,
    resumeSession,
    getCurrentPauseDuration,
    canPause:
      sessionActive &&
      !pauseState.isPaused &&
      (!pauseState.cooldownEndTime || new Date() >= pauseState.cooldownEndTime),
    canResume: pauseState.isPaused,
  };
};
