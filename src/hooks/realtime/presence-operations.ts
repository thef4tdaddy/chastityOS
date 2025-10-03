/**
 * Presence operation helper functions
 */
import React from "react";
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
} from "@/utils/realtime/presence";

// Helper function to create presence update functions
export const createPresenceUpdateFunctions = (
  userId: string,
  presenceState: PresenceState,
  setPresenceState: React.Dispatch<React.SetStateAction<PresenceState>>,
) => {
  const updateOwnPresence = async (
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
  };

  const setOnline = (customMessage?: string) => {
    return updateOwnPresence(PresenceStatus.ONLINE, customMessage);
  };

  const setOffline = (customMessage?: string) => {
    return updateOwnPresence(PresenceStatus.OFFLINE, customMessage);
  };

  const setAway = (customMessage?: string) => {
    return updateOwnPresence(PresenceStatus.AWAY, customMessage);
  };

  const setBusy = (customMessage?: string) => {
    return updateOwnPresence(PresenceStatus.BUSY, customMessage);
  };

  const setInSession = (sessionStartTime?: Date) => {
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
  };

  const updateActivity = (activity: ActivityContext) => {
    return updateOwnPresence(
      presenceState.ownPresence.status,
      presenceState.ownPresence.customMessage,
      activity,
    );
  };

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
  const subscribeToPresence = (
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
      const presenceMap: Record<string, UserPresence> = {};
      for (let i = 0; i < presences.length; i++) {
        const presence = presences[i];
        if (presence) {
          presenceMap[presence.userId] = presence;
        }
      }

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
  };

  return { subscribeToPresence };
};

// Helper function to create query functions
export const createQueryFunctions = (presenceState: PresenceState) => {
  const getUserPresence = (targetUserId: string): UserPresence | null => {
    return presenceState.userPresences[targetUserId] || null;
  };

  const getMultipleUserPresence = (userIds: string[]): UserPresence[] => {
    const result: UserPresence[] = [];
    for (let i = 0; i < userIds.length; i++) {
      const presence = presenceState.userPresences[userIds[i]];
      if (presence) {
        result.push(presence);
      }
    }
    return result;
  };

  const isUserOnline = (targetUserId: string): boolean => {
    const presence = getUserPresence(targetUserId);
    return presence?.status === PresenceStatus.ONLINE;
  };

  const isUserInSession = (targetUserId: string): boolean => {
    const presence = getUserPresence(targetUserId);
    return (
      presence?.status === PresenceStatus.IN_SESSION ||
      presence?.isInChastitySession === true
    );
  };

  const getOnlineCount = (userIds: string[]): number => {
    let count = 0;
    for (let i = 0; i < userIds.length; i++) {
      const presence = presenceState.userPresences[userIds[i]];
      if (
        presence &&
        [
          PresenceStatus.ONLINE,
          PresenceStatus.BUSY,
          PresenceStatus.IN_SESSION,
        ].indexOf(presence.status) !== -1
      ) {
        count++;
      }
    }
    return count;
  };

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

  let onlineUsers = 0;
  let inSessionUsers = 0;

  const userPresenceValues = Object.keys(userPresences).map(
    (key) => userPresences[key],
  );

  for (let i = 0; i < userPresenceValues.length; i++) {
    const p = userPresenceValues[i];
    if (
      [
        PresenceStatus.ONLINE,
        PresenceStatus.BUSY,
        PresenceStatus.IN_SESSION,
      ].indexOf(p.status) !== -1
    ) {
      onlineUsers++;
    }

    if (p.status === PresenceStatus.IN_SESSION || p.isInChastitySession) {
      inSessionUsers++;
    }
  }

  const isActive = Date.now() - lastActivity.getTime() < activityTimeout;

  return {
    totalUsers,
    onlineUsers,
    inSessionUsers,
    lastActivity,
    isActive,
  };
};
