/**
 * usePresence - Online/Offline Status Hook
 *
 * Track and display online/offline presence for users in relationships
 * with activity indicators and status messages.
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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

// Helper to setup activity tracking listeners
const useActivityTracking = (
  autoTrackActivity: boolean,
  presenceStatus: PresenceStatus,
  activityTimeout: number,
  setAway: (statusMessage?: string) => void,
  lastActivityRef: React.MutableRefObject<Date>,
  activityTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>,
) => {
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
        if (presenceStatus === PresenceStatus.ONLINE) {
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
  }, [autoTrackActivity, presenceStatus, activityTimeout]);
};

// Helper to handle periodic presence updates
const usePeriodicPresenceUpdate = (
  ownPresence: { status: PresenceStatus },
  updateInterval: number,
  presenceIntervalRef: React.MutableRefObject<ReturnType<
    typeof setInterval
  > | null>,
) => {
  useEffect(() => {
    const sendPeriodicUpdate = async () => {
      if (ownPresence.status !== PresenceStatus.OFFLINE) {
        // In real implementation, send to backend/WebSocket
        // await sendPresenceUpdate(ownPresence);
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
  }, [ownPresence, updateInterval, presenceIntervalRef]);
};

// Helper to handle online/offline events
const useConnectionEvents = (
  setOnline: (statusMessage?: string) => void,
  setOffline: (statusMessage?: string) => void,
  setAway: (statusMessage?: string) => void,
) => {
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
};

// Helper to initialize presence on mount
const usePresenceInitialization = (
  setOnline: (statusMessage?: string) => void,
  setOffline: (statusMessage?: string) => void,
) => {
  useEffect(() => {
    setOnline("Connected");

    // Set offline when component unmounts
    return () => {
      setOffline("Disconnected");
    };
    // setOnline, setOffline are from presenceUpdateFunctions (stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

// Helper to create initial presence state
const createInitialPresenceState = (userId: string): PresenceState => ({
  userPresences: {},
  subscriptions: [],
  ownPresence: {
    userId,
    status: PresenceStatus.OFFLINE,
    lastSeen: new Date(),
  },
});

// Helper to setup all presence side effects
const usePresenceSideEffects = (
  autoTrackActivity: boolean,
  presenceStatus: PresenceStatus,
  activityTimeout: number,
  ownPresence: { status: PresenceStatus },
  updateInterval: number,
  setOnline: (statusMessage?: string) => void,
  setOffline: (statusMessage?: string) => void,
  setAway: (statusMessage?: string) => void,
  lastActivityRef: React.MutableRefObject<Date>,
  activityTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>,
  presenceIntervalRef: React.MutableRefObject<ReturnType<
    typeof setInterval
  > | null>,
) => {
  useActivityTracking(
    autoTrackActivity,
    presenceStatus,
    activityTimeout,
    setAway,
    lastActivityRef,
    activityTimeoutRef,
  );

  usePeriodicPresenceUpdate(ownPresence, updateInterval, presenceIntervalRef);

  useConnectionEvents(setOnline, setOffline, setAway);

  usePresenceInitialization(setOnline, setOffline);
};

// Helper to create and destructure operation functions
const usePresenceOperations = (
  userId: string,
  presenceState: PresenceState,
  setPresenceState: React.Dispatch<React.SetStateAction<PresenceState>>,
) => {
  const presenceUpdateFunctions = createPresenceUpdateFunctions(
    userId,
    presenceState,
    setPresenceState,
  );

  const subscriptionFunctions = createSubscriptionFunctions(setPresenceState);
  const queryFunctions = createQueryFunctions(presenceState);

  const {
    updateOwnPresence: _updateOwnPresence,
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

  return {
    presenceUpdateFunctions,
    subscriptionFunctions,
    queryFunctions,
    setOnline,
    setOffline,
    setAway,
    setBusy,
    setInSession,
    updateActivityStatus,
    subscribeToPresence,
    getUserPresence,
    getMultipleUserPresence,
    isUserOnline,
    isUserInSession,
    getOnlineCount,
  };
};

// Helper to build return object
const buildPresenceReturn = (
  presenceState: PresenceState,
  presenceUpdateFunctions: ReturnType<typeof createPresenceUpdateFunctions>,
  subscriptionFunctions: ReturnType<typeof createSubscriptionFunctions>,
  queryFunctions: ReturnType<typeof createQueryFunctions>,
  updateActivity: (activity: ActivityContext) => void,
  computedValues: ReturnType<typeof calculatePresenceComputedValues>,
) => {
  const { setOnline, setOffline, setAway, setBusy, setInSession } =
    presenceUpdateFunctions;
  const { subscribeToPresence } = subscriptionFunctions;
  const {
    getUserPresence,
    getMultipleUserPresence,
    isUserOnline,
    isUserInSession,
    getOnlineCount,
  } = queryFunctions;

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

export const usePresence = (options: UsePresenceOptions) => {
  const {
    userId,
    updateInterval = 30000, // 30 seconds
    activityTimeout = 300000, // 5 minutes
    autoTrackActivity = true,
  } = options;

  // Presence state
  const [presenceState, setPresenceState] = useState(() =>
    createInitialPresenceState(userId),
  );

  // Refs for tracking activity
  const lastActivityRef = useRef<Date>(new Date());
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create operation functions using helpers
  const operations = usePresenceOperations(
    userId,
    presenceState,
    setPresenceState,
  );
  const {
    presenceUpdateFunctions,
    subscriptionFunctions,
    queryFunctions,
    setOnline,
    setOffline,
    setAway,
    updateActivityStatus,
  } = operations;

  // Update activity
  const updateActivity = useCallback(
    (activity: ActivityContext) => {
      lastActivityRef.current = new Date();
      return updateActivityStatus(activity);
    },
    [updateActivityStatus],
  );

  // Setup all side effects
  usePresenceSideEffects(
    autoTrackActivity,
    presenceState.ownPresence.status,
    activityTimeout,
    presenceState.ownPresence,
    updateInterval,
    setOnline,
    setOffline,
    setAway,
    lastActivityRef,
    activityTimeoutRef,
    presenceIntervalRef,
  );

  // Computed values
  const computedValues = useMemo(() => {
    return calculatePresenceComputedValues(
      presenceState.userPresences,
      lastActivityRef.current,
      activityTimeout,
    );
  }, [presenceState.userPresences, activityTimeout]);

  return buildPresenceReturn(
    presenceState,
    presenceUpdateFunctions,
    subscriptionFunctions,
    queryFunctions,
    updateActivity,
    computedValues,
  );
};
