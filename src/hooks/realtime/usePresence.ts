/**
 * usePresence - Online/Offline Status Hook
 *
 * Track and display online/offline presence for users in relationships
 * with activity indicators and status messages.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PresenceState,
  UserPresence,
  PresenceStatus,
  ActivityContext,
  PresenceSubscription,
} from "../../types/realtime";

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

  // Update own presence status
  const updateOwnPresence = useCallback(
    async (
      status: PresenceStatus,
      customMessage?: string,
      currentActivity?: ActivityContext,
    ): Promise<void> => {
      const updatedPresence: UserPresence = {
        ...presenceState.ownPresence,
        status,
        lastSeen: new Date(),
        customMessage,
        currentActivity,
        deviceType: getDeviceType(),
        platform: navigator.platform,
      };

      setPresenceState((prev) => ({
        ...prev,
        ownPresence: updatedPresence,
        userPresences: {
          ...prev.userPresences,
          [userId]: updatedPresence,
        },
      }));

      // Send presence update to backend/WebSocket
      await sendPresenceUpdate(updatedPresence);
    },
    [userId, presenceState.ownPresence],
  );

  // Set online status
  const setOnline = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.ONLINE, customMessage);
    },
    [updateOwnPresence],
  );

  // Set offline status
  const setOffline = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.OFFLINE, customMessage);
    },
    [updateOwnPresence],
  );

  // Set away status
  const setAway = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.AWAY, customMessage);
    },
    [updateOwnPresence],
  );

  // Set busy status
  const setBusy = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.BUSY, customMessage);
    },
    [updateOwnPresence],
  );

  // Set in-session status
  const setInSession = useCallback(
    (sessionStartTime?: Date) => {
      const presence: UserPresence = {
        ...presenceState.ownPresence,
        status: PresenceStatus.IN_SESSION,
        isInChastitySession: true,
        sessionStartTime: sessionStartTime || new Date(),
      };

      setPresenceState((prev) => ({
        ...prev,
        ownPresence: presence,
        userPresences: {
          ...prev.userPresences,
          [userId]: presence,
        },
      }));

      return sendPresenceUpdate(presence);
    },
    [userId, presenceState.ownPresence],
  );

  // Update activity
  const updateActivity = useCallback(
    (activity: ActivityContext) => {
      lastActivityRef.current = new Date();

      return updateOwnPresence(
        presenceState.ownPresence.status,
        presenceState.ownPresence.customMessage,
        activity,
      );
    },
    [presenceState.ownPresence, updateOwnPresence],
  );

  // Subscribe to user presence
  const subscribeToPresence = useCallback(
    (
      userIds: string[],
      callback: (presences: UserPresence[]) => void,
    ): PresenceSubscription => {
      const subscription: PresenceSubscription = {
        userIds,
        callback,
        isActive: true,
      };

      setPresenceState((prev) => ({
        ...prev,
        subscriptions: [...prev.subscriptions, subscription],
      }));

      // Fetch initial presence data
      fetchUserPresences(userIds).then((presences) => {
        const presenceMap = presences.reduce(
          (acc, presence) => {
            acc[presence.userId] = presence;
            return acc;
          },
          {} as Record<string, UserPresence>,
        );

        setPresenceState((prev) => ({
          ...prev,
          userPresences: {
            ...prev.userPresences,
            ...presenceMap,
          },
        }));

        callback(presences);
      });

      // Return unsubscribe function
      return {
        ...subscription,
        unsubscribe: () => {
          setPresenceState((prev) => ({
            ...prev,
            subscriptions: prev.subscriptions.filter(
              (sub) => sub !== subscription,
            ),
          }));
        },
      } as PresenceSubscription & { unsubscribe: () => void };
    },
    [],
  );

  // Get presence for specific user
  const getUserPresence = useCallback(
    (targetUserId: string): UserPresence | null => {
      return presenceState.userPresences[targetUserId] || null;
    },
    [presenceState.userPresences],
  );

  // Get presence for multiple users
  const getMultipleUserPresence = useCallback(
    (userIds: string[]): UserPresence[] => {
      return userIds
        .map((id) => presenceState.userPresences[id])
        .filter(Boolean);
    },
    [presenceState.userPresences],
  );

  // Check if user is online
  const isUserOnline = useCallback(
    (targetUserId: string): boolean => {
      const presence = getUserPresence(targetUserId);
      return presence?.status === PresenceStatus.ONLINE;
    },
    [getUserPresence],
  );

  // Check if user is in session
  const isUserInSession = useCallback(
    (targetUserId: string): boolean => {
      const presence = getUserPresence(targetUserId);
      return (
        presence?.status === PresenceStatus.IN_SESSION ||
        presence?.isInChastitySession === true
      );
    },
    [getUserPresence],
  );

  // Get online count for a list of users
  const getOnlineCount = useCallback(
    (userIds: string[]): number => {
      return userIds.filter((id) => {
        const presence = presenceState.userPresences[id];
        return (
          presence &&
          [
            PresenceStatus.ONLINE,
            PresenceStatus.BUSY,
            PresenceStatus.IN_SESSION,
          ].includes(presence.status)
        );
      }).length;
    },
    [presenceState.userPresences],
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
  }, []);

  // Initialize presence as online
  useEffect(() => {
    setOnline("Connected");

    // Set offline when component unmounts
    return () => {
      setOffline("Disconnected");
    };
  }, []);

  // Computed values
  const computedValues = useMemo(() => {
    const totalUsers = Object.keys(presenceState.userPresences).length;
    const onlineUsers = Object.values(presenceState.userPresences).filter((p) =>
      [
        PresenceStatus.ONLINE,
        PresenceStatus.BUSY,
        PresenceStatus.IN_SESSION,
      ].includes(p.status),
    ).length;

    const inSessionUsers = Object.values(presenceState.userPresences).filter(
      (p) => p.status === PresenceStatus.IN_SESSION || p.isInChastitySession,
    ).length;

    const lastActivity = lastActivityRef.current;
    const isActive = Date.now() - lastActivity.getTime() < activityTimeout;

    return {
      totalUsers,
      onlineUsers,
      inSessionUsers,
      lastActivity,
      isActive,
    };
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

// Helper functions
function getDeviceType(): "desktop" | "mobile" | "tablet" {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(
      userAgent,
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

async function sendPresenceUpdate(presence: UserPresence): Promise<void> {
  // In real implementation, send to backend/WebSocket

  // Simulate API call
  try {
    // await fetch('/api/presence', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(presence),
    // });
  } catch (error) {
    // Failed to send presence update
  }
}

async function fetchUserPresences(userIds: string[]): Promise<UserPresence[]> {
  // In real implementation, fetch from backend

  // Simulate API response
  return userIds.map((userId) => ({
    userId,
    status: PresenceStatus.OFFLINE,
    lastSeen: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
  }));
}
