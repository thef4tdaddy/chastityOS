/**
 * Timer Subscriptions Hook - Manage timer event subscriptions
 */
import { useCallback } from "react";
import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import {
  LiveTimer,
  LiveTimerState,
  TimerSubscription,
} from "../../../types/realtime";
import { createTimerSubscription } from "../timer-operations";

interface UseTimerSubscriptionsParams {
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>;
  subscriptionsRef: MutableRefObject<Map<string, TimerSubscription>>;
}

export const useTimerSubscriptions = ({
  setTimerState,
  subscriptionsRef,
}: UseTimerSubscriptionsParams) => {
  // Subscribe to timer updates
  const subscribeToTimer = useCallback(
    (
      timerId: string,
      callback: (timer: LiveTimer) => void,
      events: string[] = ["start", "pause", "resume", "stop", "update"],
    ): TimerSubscription => {
      return createTimerSubscription(
        timerId,
        callback,
        events,
        setTimerState,
        subscriptionsRef,
      );
    },
    [setTimerState, subscriptionsRef],
  );

  // Notify subscribers
  const notifySubscribers = useCallback(
    (timer: LiveTimer) => {
      subscriptionsRef.current.forEach((subscription) => {
        if (subscription.timerId === timer.id && subscription.isActive) {
          try {
            subscription.callback(timer);
          } catch {
            // Error in subscription callback
          }
        }
      });
    },
    [subscriptionsRef],
  );

  return {
    subscribeToTimer,
    notifySubscribers,
  };
};
