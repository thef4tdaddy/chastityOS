/**
 * usePresence - Online/Offline Status Hook
 *
 * Track and display online/offline presence for users in relationships
 * with activity indicators and status messages.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PresenceState,
  UserPresence as _UserPresence,
  PresenceStatus,
  ActivityContext,
  PresenceSubscription as _PresenceSubscription,
} from "../../types/realtime";
import {
  createPresenceUpdateFunctions,
  createSubscriptionFunctions,
  createQueryFunctions,
  calculatePresenceComputedValues,
} from "./presence-operations";

interface UsePresenceOptions {
  userId: string;
  updateInterval?: number; // milliseconds
  activityTimeout?: number; // milliseconds
  autoTrackActivity?: boolean;
}

export const usePresence = (options: UsePresenceOptions) => {
  const {
    userId,
    updateInterval = 30000, // 30 seconds
    activityTimeout = 300000, // 5 minutes
    autoTrackActivity = true,
  } = options;

  // Presence state
  const [presenceState, setPresenceState] = useState<PresenceState>({
    userPresences: {},
    subscriptions: [],
    ownPresence: {
      userId,
      status: PresenceStatus.OFFLINE,
      lastSeen: new Date(),
    },
  });

  // Refs for tracking activity
  const lastActivityRef = useRef<Date>(new Date());
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create operation functions using helpers
  const presenceUpdateFunctions = createPresenceUpdateFunctions(
    userId,
    presenceState,
    setPresenceState,
  );

  const subscriptionFunctions = createSubscriptionFunctions(setPresenceState);
  const queryFunctions = createQueryFunctions(presenceState);

  // Extract individual functions for easier use
  const {
    updateOwnPresence,
    setOnline,
    setOffline,
    setAway,
    setBusy,
    setInSession,
    updateActivity: updateActivityStatus,
  } = presenceUpdateFunctions;

  const { subscribeToPresence } = subscriptionFunctions;
  const {
    getUserPresence,
    getMultipleUserPresence,
    isUserOnline,
    isUserInSession,
    getOnlineCount,
  } = queryFunctions;

  // Update activity
  const updateActivity = useCallback(
    (activity: ActivityContext) => {
      lastActivityRef.current = new Date();
      return updateActivityStatus(activity);
    },
    [updateActivityStatus],
  );

  // Handle activity tracking
  useEffect(() => {
    if (!autoTrackActivity) return;

    const trackActivity = () => {
      lastActivityRef.current = new Date();

      // Reset activity timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Set away status after inactivity
      activityTimeoutRef.current = setTimeout(() => {
        if (presenceState.ownPresence.status === PresenceStatus.ONLINE) {
          setAway("Away due to inactivity");
        }
      }, activityTimeout);
    };

    // Track various activity events
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, trackActivity);
      });

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
    // setAway is from presenceUpdateFunctions which is recreated when presenceState changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrackActivity, presenceState.ownPresence.status, activityTimeout]);

  // Handle presence updates
  useEffect(() => {
    const sendPeriodicUpdate = async () => {
      if (presenceState.ownPresence.status !== PresenceStatus.OFFLINE) {
        // In real implementation, send to backend/WebSocket
        // await sendPresenceUpdate(presenceState.ownPresence);
      }
    };

    presenceIntervalRef.current = setInterval(
      sendPeriodicUpdate,
      updateInterval,
    );

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    };
    // sendPeriodicUpdate uses presenceState.ownPresence which is in deps
    // updateInterval is a config number, not a store action
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [presenceState.ownPresence, updateInterval]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline("Back online");
    };

    const handleOffline = () => {
      setOffline("Connection lost");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAway("Tab inactive");
      } else {
        setOnline("Tab active");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // setOnline, setOffline, setAway are from presenceUpdateFunctions (stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize presence as online
  useEffect(() => {
    setOnline("Connected");

    // Set offline when component unmounts
    return () => {
      setOffline("Disconnected");
    };
    // setOnline, setOffline are from presenceUpdateFunctions (stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Computed values
  const computedValues = useMemo(() => {
    return calculatePresenceComputedValues(
      presenceState.userPresences,
      lastActivityRef.current,
      activityTimeout,
    );
  }, [presenceState.userPresences, activityTimeout]);

  return {
    // Presence state
    ownPresence: presenceState.ownPresence,
    userPresences: presenceState.userPresences,

    // Status management
    setOnline,
    setOffline,
    setAway,
    setBusy,
    setInSession,
    updateActivity,

    // Subscription management
    subscribeToPresence,

    // Presence queries
    getUserPresence,
    getMultipleUserPresence,
    isUserOnline,
    isUserInSession,
    getOnlineCount,

    // Computed values
    ...computedValues,
  };
};
