/**
 * Presence operation helper functions
 */
import { useCallback } from "react";
import {
  PresenceState,
  UserPresence,
  PresenceStatus,
  ActivityContext,
  PresenceSubscription,
} from "../../types/realtime";
import {
  createPresenceUpdate,
  sendPresenceUpdate,
  fetchUserPresences,
} from "./presenceHelpers";

// Helper function to create presence update functions
export const createPresenceUpdateFunctions = (
  userId: string,
  presenceState: PresenceState,
  setPresenceState: React.Dispatch<React.SetStateAction<PresenceState>>,
) => {
  const updateOwnPresence = useCallback(
    async (
      status: PresenceStatus,
      customMessage?: string,
      currentActivity?: ActivityContext,
    ): Promise<void> => {
      const updatedPresence = createPresenceUpdate(
        presenceState.ownPresence,
        status,
        customMessage,
        currentActivity,
      );

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

  const setOnline = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.ONLINE, customMessage);
    },
    [updateOwnPresence],
  );

  const setOffline = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.OFFLINE, customMessage);
    },
    [updateOwnPresence],
  );

  const setAway = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.AWAY, customMessage);
    },
    [updateOwnPresence],
  );

  const setBusy = useCallback(
    (customMessage?: string) => {
      return updateOwnPresence(PresenceStatus.BUSY, customMessage);
    },
    [updateOwnPresence],
  );

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

  const updateActivity = useCallback(
    (activity: ActivityContext) => {
      return updateOwnPresence(
        presenceState.ownPresence.status,
        presenceState.ownPresence.customMessage,
        activity,
      );
    },
    [presenceState.ownPresence, updateOwnPresence],
  );

  return {
    updateOwnPresence,
    setOnline,
    setOffline,
    setAway,
    setBusy,
    setInSession,
    updateActivity,
  };
};

// Helper function to create subscription functions
export const createSubscriptionFunctions = (
  setPresenceState: React.Dispatch<React.SetStateAction<PresenceState>>,
) => {
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

  return { subscribeToPresence };
};

// Helper function to create query functions
export const createQueryFunctions = (presenceState: PresenceState) => {
  const getUserPresence = useCallback(
    (targetUserId: string): UserPresence | null => {
      return presenceState.userPresences[targetUserId] || null;
    },
    [presenceState.userPresences],
  );

  const getMultipleUserPresence = useCallback(
    (userIds: string[]): UserPresence[] => {
      return userIds
        .map((id) => presenceState.userPresences[id])
        .filter(Boolean);
    },
    [presenceState.userPresences],
  );

  const isUserOnline = useCallback(
    (targetUserId: string): boolean => {
      const presence = getUserPresence(targetUserId);
      return presence?.status === PresenceStatus.ONLINE;
    },
    [getUserPresence],
  );

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

  return {
    getUserPresence,
    getMultipleUserPresence,
    isUserOnline,
    isUserInSession,
    getOnlineCount,
  };
};

// Helper function to calculate computed values
export const calculatePresenceComputedValues = (
  userPresences: Record<string, UserPresence>,
  lastActivity: Date,
  activityTimeout: number,
) => {
  const totalUsers = Object.keys(userPresences).length;
  const onlineUsers = Object.values(userPresences).filter((p) =>
    [
      PresenceStatus.ONLINE,
      PresenceStatus.BUSY,
      PresenceStatus.IN_SESSION,
    ].includes(p.status),
  ).length;

  const inSessionUsers = Object.values(userPresences).filter(
    (p) => p.status === PresenceStatus.IN_SESSION || p.isInChastitySession,
  ).length;

  const isActive = Date.now() - lastActivity.getTime() < activityTimeout;

  return {
    totalUsers,
    onlineUsers,
    inSessionUsers,
    lastActivity,
    isActive,
  };
};
