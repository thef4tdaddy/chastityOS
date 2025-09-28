import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, updateDoc, onSnapshot, serverTimestamp, collection, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { logEvent } from '../../utils/logging';

// Presence status types
export const PresenceStatus = {
  ONLINE: 'online',
  AWAY: 'away',
  BUSY: 'busy',
  INVISIBLE: 'invisible',
  OFFLINE: 'offline'
};

// Activity types
export const ActivityType = {
  ACTIVE: 'active',
  IDLE: 'idle',
  IN_SESSION: 'in_session',
  VIEWING: 'viewing',
  TYPING: 'typing'
};

// Default presence settings
const DEFAULT_PRESENCE_SETTINGS = {
  shareStatus: true,
  shareActivity: true,
  shareLocation: false,
  autoAway: true,
  awayTimeoutMinutes: 5,
  showLastSeen: true,
  allowStatusMessages: true
};

export const usePresence = (userId, relationshipId = null) => {
  const [userPresence, setUserPresence] = useState({
    status: PresenceStatus.OFFLINE,
    activity: ActivityType.IDLE,
    statusMessage: '',
    lastSeen: null,
    location: null,
    device: null,
    isTyping: false
  });
  
  const [relationshipPresence, setRelationshipPresence] = useState([]);
  const [presenceSettings, setPresenceSettings] = useState(DEFAULT_PRESENCE_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for managing timers and activity detection
  const presenceUpdateIntervalRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const lastActivityRef = useRef(new Date());
  const unsubscribeRef = useRef(null);

  // Initialize presence system
  const initializePresence = useCallback(async () => {
    if (!userId) return;

    try {
      // Set initial presence
      await updatePresence({
        status: PresenceStatus.ONLINE,
        activity: ActivityType.ACTIVE,
        lastSeen: new Date(),
        device: getDeviceInfo(),
        sessionId: Date.now().toString()
      });

      // Set up presence listeners
      setupPresenceListeners();

      // Start activity monitoring
      startActivityMonitoring();

      // Start heartbeat
      startPresenceHeartbeat();

      setIsInitialized(true);

      // Log presence initialization
      await logEvent(userId, 'PRESENCE_INITIALIZED', {
        initialStatus: PresenceStatus.ONLINE
      });
    } catch (error) {
      console.error('Error initializing presence:', error);
    }
  }, [userId]);

  // Get device information
  const getDeviceInfo = useCallback(() => {
    return {
      type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent.split(' ').pop(),
      platform: navigator.platform,
      timestamp: new Date()
    };
  }, []);

  // Update user presence
  const updatePresence = useCallback(async (presenceData) => {
    if (!userId) return;

    try {
      const presenceUpdate = {
        ...presenceData,
        userId,
        updatedAt: serverTimestamp(),
        timestamp: new Date()
      };

      // Update user's presence document
      const presenceRef = doc(db, 'presence', userId);
      await updateDoc(presenceRef, presenceUpdate, { merge: true });

      // Update local state
      setUserPresence(prev => ({
        ...prev,
        ...presenceData,
        updatedAt: new Date()
      }));

      // If in a relationship, update relationship presence
      if (relationshipId && presenceSettings.shareStatus) {
        const relationshipPresenceRef = doc(db, 'relationships', relationshipId, 'presence', userId);
        await updateDoc(relationshipPresenceRef, {
          ...presenceUpdate,
          relationshipId,
          sharedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [userId, relationshipId, presenceSettings.shareStatus]);

  // Setup presence listeners
  const setupPresenceListeners = useCallback(() => {
    if (!userId) return;

    // Listen to own presence changes
    const userPresenceRef = doc(db, 'presence', userId);
    const userUnsubscribe = onSnapshot(userPresenceRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserPresence(prev => ({
          ...prev,
          ...data,
          lastSeen: data.lastSeen?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null
        }));
      }
    });

    // Listen to relationship presence if in a relationship
    let relationshipUnsubscribe = null;
    if (relationshipId) {
      const relationshipPresenceRef = collection(db, 'relationships', relationshipId, 'presence');
      const relationshipQuery = query(relationshipPresenceRef, where('userId', '!=', userId));
      
      relationshipUnsubscribe = onSnapshot(relationshipQuery, (snapshot) => {
        const presenceList = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          presenceList.push({
            ...data,
            id: doc.id,
            lastSeen: data.lastSeen?.toDate() || null,
            updatedAt: data.updatedAt?.toDate() || null
          });
        });
        setRelationshipPresence(presenceList);
      });
    }

    // Store unsubscribe functions
    unsubscribeRef.current = () => {
      userUnsubscribe();
      if (relationshipUnsubscribe) relationshipUnsubscribe();
    };
  }, [userId, relationshipId]);

  // Start activity monitoring
  const startActivityMonitoring = useCallback(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      lastActivityRef.current = new Date();
      
      if (userPresence.activity === ActivityType.IDLE) {
        updatePresence({
          activity: ActivityType.ACTIVE,
          status: PresenceStatus.ONLINE
        });
      }
      
      // Reset away timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Set new away timeout if auto-away is enabled
      if (presenceSettings.autoAway) {
        activityTimeoutRef.current = setTimeout(() => {
          updatePresence({
            activity: ActivityType.IDLE,
            status: PresenceStatus.AWAY
          });
        }, presenceSettings.awayTimeoutMinutes * 60 * 1000);
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence({
          activity: ActivityType.IDLE,
          status: PresenceStatus.AWAY
        });
      } else {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [userPresence.activity, presenceSettings, updatePresence]);

  // Start presence heartbeat
  const startPresenceHeartbeat = useCallback(() => {
    if (presenceUpdateIntervalRef.current) {
      clearInterval(presenceUpdateIntervalRef.current);
    }

    presenceUpdateIntervalRef.current = setInterval(async () => {
      // Update last seen timestamp
      await updatePresence({
        lastSeen: new Date(),
        heartbeat: Date.now()
      });
    }, 30000); // Every 30 seconds
  }, [updatePresence]);

  // Stop presence heartbeat
  const stopPresenceHeartbeat = useCallback(() => {
    if (presenceUpdateIntervalRef.current) {
      clearInterval(presenceUpdateIntervalRef.current);
      presenceUpdateIntervalRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializePresence();

    // Cleanup on unmount
    return () => {
      // Set offline status before cleanup
      if (userId) {
        updatePresence({
          status: PresenceStatus.OFFLINE,
          activity: ActivityType.IDLE,
          lastSeen: new Date()
        });
      }

      // Clean up listeners and timers
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      stopPresenceHeartbeat();
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [initializePresence, userId, updatePresence, stopPresenceHeartbeat]);

  // Set presence status
  const setStatus = useCallback(async (status) => {
    await updatePresence({ status });
    
    // Log status change
    await logEvent(userId, 'PRESENCE_STATUS_CHANGE', {
      newStatus: status,
      previousStatus: userPresence.status
    });
  }, [updatePresence, userId, userPresence.status]);

  // Set status message
  const setStatusMessage = useCallback(async (message) => {
    if (!presenceSettings.allowStatusMessages) return;
    
    await updatePresence({ statusMessage: message });
    
    // Log status message change
    await logEvent(userId, 'PRESENCE_STATUS_MESSAGE', {
      messageLength: message.length
    });
  }, [updatePresence, userId, presenceSettings.allowStatusMessages]);

  // Set activity
  const setActivity = useCallback(async (activity, context = {}) => {
    await updatePresence({ 
      activity,
      activityContext: context 
    });
  }, [updatePresence]);

  // Set typing indicator
  const setTyping = useCallback(async (isTyping, context = {}) => {
    await updatePresence({ 
      isTyping,
      typingContext: context,
      typingAt: isTyping ? new Date() : null
    });

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        updatePresence({ 
          isTyping: false,
          typingAt: null 
        });
      }, 3000);
    }
  }, [updatePresence]);

  // Get presence for specific user
  const getUserPresence = useCallback(async (targetUserId) => {
    if (!targetUserId) return null;

    try {
      const presenceRef = doc(db, 'presence', targetUserId);
      const presenceDoc = await getDoc(presenceRef);
      
      if (presenceDoc.exists()) {
        const data = presenceDoc.data();
        return {
          ...data,
          lastSeen: data.lastSeen?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user presence:', error);
      return null;
    }
  }, []);

  // Update presence settings
  const updatePresenceSettings = useCallback(async (newSettings) => {
    if (!userId) return;

    try {
      const updatedSettings = { ...presenceSettings, ...newSettings };
      
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        presenceSettings: updatedSettings
      });

      setPresenceSettings(updatedSettings);

      // Log settings update
      await logEvent(userId, 'PRESENCE_SETTINGS_UPDATE', {
        changes: newSettings
      });
    } catch (error) {
      console.error('Error updating presence settings:', error);
    }
  }, [userId, presenceSettings]);

  // Get online status for relationship
  const getRelationshipOnlineStatus = useCallback(() => {
    return relationshipPresence.reduce((acc, presence) => {
      acc[presence.userId] = {
        isOnline: presence.status === PresenceStatus.ONLINE,
        status: presence.status,
        activity: presence.activity,
        lastSeen: presence.lastSeen,
        statusMessage: presence.statusMessage,
        isActive: presence.activity === ActivityType.ACTIVE,
        isInSession: presence.activity === ActivityType.IN_SESSION
      };
      return acc;
    }, {});
  }, [relationshipPresence]);

  // Format last seen time
  const formatLastSeen = useCallback((lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return lastSeen.toLocaleDateString();
  }, []);

  // Computed values
  const isOnline = userPresence.status === PresenceStatus.ONLINE;
  const isAway = userPresence.status === PresenceStatus.AWAY;
  const isActive = userPresence.activity === ActivityType.ACTIVE;
  const isInSession = userPresence.activity === ActivityType.IN_SESSION;
  
  const onlineRelationshipMembers = useMemo(() => {
    return relationshipPresence.filter(p => p.status === PresenceStatus.ONLINE);
  }, [relationshipPresence]);

  const relationshipOnlineCount = onlineRelationshipMembers.length;

  // Presence statistics
  const presenceStats = useMemo(() => {
    const now = new Date();

    return {
      isOnline,
      isActive,
      lastActivity: lastActivityRef.current,
      sessionDuration: userPresence.lastSeen ? now - userPresence.lastSeen : 0,
      relationshipOnlineCount,
      totalRelationshipMembers: relationshipPresence.length,
      statusMessage: userPresence.statusMessage,
      device: userPresence.device
    };
  }, [isOnline, isActive, userPresence, relationshipOnlineCount, relationshipPresence.length]);

  return {
    // Presence state
    userPresence,
    relationshipPresence,
    presenceSettings,
    isInitialized,

    // Status management
    setStatus,
    setStatusMessage,
    setActivity,
    setTyping,

    // Presence queries
    getUserPresence,
    getRelationshipOnlineStatus,

    // Settings
    updatePresenceSettings,

    // Utilities
    formatLastSeen,

    // Computed values
    isOnline,
    isAway,
    isActive,
    isInSession,
    onlineRelationshipMembers,
    relationshipOnlineCount,
    presenceStats
  };
};