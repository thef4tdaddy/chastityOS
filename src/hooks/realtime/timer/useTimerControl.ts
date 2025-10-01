/**
 * Timer Control Hook - Create and control timer lifecycle
 */
import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { LiveTimer, LiveTimerState, TimerType } from "../../../types/realtime";
import {
  updateTimerInState,
  createNewTimer,
  saveTimer,
  createTimerSync,
  startTimerOperation,
  pauseTimerOperation,
  resumeTimerOperation,
  stopTimerOperation,
  extendTimerOperation,
} from "../timer-operations";

interface UseTimerControlParams {
  userId: string;
  relationshipId?: string;
  timerState: LiveTimerState;
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>;
  syncTimer: (timerId: string) => Promise<void>;
  notifySubscribers: (timer: LiveTimer) => void;
}

// Hook manages 6 related timer lifecycle callbacks - splitting would reduce cohesion
// eslint-disable-next-line max-lines-per-function
export const useTimerControl = ({
  userId,
  relationshipId,
  timerState,
  setTimerState,
  syncTimer,
  notifySubscribers,
}: UseTimerControlParams) => {
  // Create a new timer
  const createTimer = useCallback(
    async (
      type: TimerType,
      duration: number,
      title: string,
      options?: {
        description?: string;
        canPause?: boolean;
        canStop?: boolean;
        canExtend?: boolean;
        isKeyholderControlled?: boolean;
        keyholderUserId?: string;
        sessionId?: string;
        taskId?: string;
      },
    ): Promise<LiveTimer> => {
      const timer = createNewTimer({
        userId,
        relationshipId,
        type,
        duration,
        title,
        ...options,
      });

      setTimerState((prev) => ({
        ...prev,
        activeTimers: [...prev.activeTimers, timer],
      }));

      const sync = await createTimerSync(timer.id);
      setTimerState((prev) => ({
        ...prev,
        timerSyncs: [...prev.timerSyncs, sync],
      }));

      await saveTimer(timer);

      return timer;
    },
    [userId, relationshipId, setTimerState],
  );

  // Start a timer
  const startTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      const updatedTimer = await startTimerOperation(
        timer,
        userId,
        syncTimer,
        notifySubscribers,
      );

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));
    },
    [
      timerState.activeTimers,
      userId,
      syncTimer,
      notifySubscribers,
      setTimerState,
    ],
  );

  // Pause a timer
  const pauseTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      const updatedTimer = await pauseTimerOperation(
        timer,
        userId,
        syncTimer,
        notifySubscribers,
      );

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));
    },
    [
      timerState.activeTimers,
      userId,
      syncTimer,
      notifySubscribers,
      setTimerState,
    ],
  );

  // Resume a timer
  const resumeTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      const updatedTimer = await resumeTimerOperation(
        timer,
        userId,
        syncTimer,
        notifySubscribers,
      );

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));
    },
    [
      timerState.activeTimers,
      userId,
      syncTimer,
      notifySubscribers,
      setTimerState,
    ],
  );

  // Stop a timer
  const stopTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      const updatedTimer = await stopTimerOperation(
        timer,
        userId,
        syncTimer,
        notifySubscribers,
      );

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));
    },
    [
      timerState.activeTimers,
      userId,
      syncTimer,
      notifySubscribers,
      setTimerState,
    ],
  );

  // Extend a timer
  const extendTimer = useCallback(
    async (timerId: string, additionalSeconds: number): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      const updatedTimer = await extendTimerOperation(
        timer,
        userId,
        additionalSeconds,
        syncTimer,
        notifySubscribers,
      );

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));
    },
    [
      timerState.activeTimers,
      userId,
      syncTimer,
      notifySubscribers,
      setTimerState,
    ],
  );

  return {
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    extendTimer,
  };
};
