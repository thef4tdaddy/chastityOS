import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, collection, addDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { logEvent } from '../../utils/logging';

// Connection status
export const ConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

// Channel types
export const ChannelType = {
  USER_DATA: 'user_data',
  SESSION_SYNC: 'session_sync',
  RELATIONSHIP: 'relationship',
  NOTIFICATION: 'notification',
  SYSTEM: 'system'
};

// Sync update types
export const UpdateType = {
  SESSION_UPDATE: 'session_update',
  PROFILE_UPDATE: 'profile_update',
  EVENT_LOG: 'event_log',
  TASK_UPDATE: 'task_update',
  NOTIFICATION: 'notification',
  PRESENCE_UPDATE: 'presence_update'
};

export const useRealtimeSync = (userId) => {
  const [connectionStatus, setConnectionStatus] = useState({
    status: ConnectionStatus.DISCONNECTED,
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  });
  
  const [activeChannels, setActiveChannels] = useState([]);
  const [realtimeData, setRealtimeData] = useState({});
  const [syncMetrics, setSyncMetrics] = useState({
    lastSuccessfulSync: null,
    totalSyncs: 0,
    failedSyncs: 0,
    bytesTransferred: 0
  });

  // Refs for managing subscriptions and reconnection
  const subscriptionsRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const updateCallbacksRef = useRef(new Map());

  // Initialize connection
  const initializeConnection = useCallback(() => {
    if (!userId) return;

    setConnectionStatus(prev => ({
      ...prev,
      status: ConnectionStatus.CONNECTING
    }));

    try {
      // Simulate WebSocket connection initialization
      // In a real implementation, this would connect to a WebSocket server
      setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          status: ConnectionStatus.CONNECTED,
          lastConnected: new Date(),
          reconnectAttempts: 0,
          error: null
        }));

        // Start heartbeat
        startHeartbeat();

        // Log connection
        logEvent(userId, 'REALTIME_CONNECTED', {
          timestamp: new Date()
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize realtime connection:', error);
      setConnectionStatus(prev => ({
        ...prev,
        status: ConnectionStatus.ERROR,
        error: error.message
      }));
    }
  }, [userId]);

  // Start heartbeat to maintain connection
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      // Send heartbeat to server
      // In a real implementation, this would ping the WebSocket server
      setSyncMetrics(prev => ({
        ...prev,
        lastSuccessfulSync: new Date()
      }));
    }, 30000); // 30 seconds
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Handle connection errors and reconnection
  const handleConnectionError = useCallback((error) => {
    console.error('Realtime connection error:', error);
    
    setConnectionStatus(prev => ({
      ...prev,
      status: ConnectionStatus.ERROR,
      error: error.message,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    // Attempt reconnection with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        status: ConnectionStatus.RECONNECTING
      }));
      
      initializeConnection();
    }, delay);
  }, [connectionStatus.reconnectAttempts, initializeConnection]);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();

    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Clean up all subscriptions
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, [initializeConnection, stopHeartbeat]);

  // Join a sync channel
  const joinChannel = useCallback(async (channelId, channelType = ChannelType.USER_DATA) => {
    if (!userId || connectionStatus.status !== ConnectionStatus.CONNECTED) {
      console.warn('Cannot join channel: not connected');
      return;
    }

    try {
      // Create or update channel document
      const channelRef = doc(db, 'realtimeChannels', channelId);
      const channelData = {
        id: channelId,
        type: channelType,
        participants: [userId],
        lastActivity: serverTimestamp(),
        isActive: true,
        encryptionEnabled: true,
        createdBy: userId,
        createdAt: serverTimestamp()
      };

      await updateDoc(channelRef, channelData, { merge: true });

      // Set up real-time listener for this channel
      const messagesRef = collection(db, 'realtimeChannels', channelId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const updates = [];
        snapshot.forEach(doc => {
          updates.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          });
        });

        // Update realtime data
        setRealtimeData(prev => ({
          ...prev,
          [channelId]: updates
        }));

        // Notify subscribers
        const callbacks = updateCallbacksRef.current.get(channelId) || [];
        callbacks.forEach(callback => callback(updates));
      });

      // Store subscription for cleanup
      subscriptionsRef.current.set(channelId, unsubscribe);

      // Add to active channels
      setActiveChannels(prev => [...prev.filter(c => c.id !== channelId), channelData]);

      // Log channel join
      await logEvent(userId, 'REALTIME_CHANNEL_JOIN', {
        channelId,
        channelType
      });
    } catch (error) {
      console.error('Error joining channel:', error);
      handleConnectionError(error);
    }
  }, [userId, connectionStatus.status, handleConnectionError]);

  // Leave a sync channel
  const leaveChannel = useCallback(async (channelId) => {
    if (!userId) return;

    try {
      // Remove user from channel participants
      const channelRef = doc(db, 'realtimeChannels', channelId);
      await updateDoc(channelRef, {
        participants: activeChannels.find(c => c.id === channelId)?.participants?.filter(p => p !== userId) || [],
        lastActivity: serverTimestamp()
      });

      // Clean up subscription
      const unsubscribe = subscriptionsRef.current.get(channelId);
      if (unsubscribe) {
        unsubscribe();
        subscriptionsRef.current.delete(channelId);
      }

      // Remove from active channels
      setActiveChannels(prev => prev.filter(c => c.id !== channelId));

      // Clear realtime data for this channel
      setRealtimeData(prev => {
        const newData = { ...prev };
        delete newData[channelId];
        return newData;
      });

      // Log channel leave
      await logEvent(userId, 'REALTIME_CHANNEL_LEAVE', {
        channelId
      });
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  }, [userId, activeChannels]);

  // Create a new sync channel
  const createChannel = useCallback(async (type, participants = []) => {
    if (!userId) return null;

    try {
      const channelId = `${type}_${userId}_${Date.now()}`;
      const channelData = {
        id: channelId,
        type,
        participants: [userId, ...participants],
        lastActivity: serverTimestamp(),
        isActive: true,
        encryptionEnabled: true,
        createdBy: userId,
        createdAt: serverTimestamp()
      };

      // Create channel document
      const channelRef = doc(db, 'realtimeChannels', channelId);
      await updateDoc(channelRef, channelData, { merge: true });

      // Automatically join the channel
      await joinChannel(channelId, type);

      // Log channel creation
      await logEvent(userId, 'REALTIME_CHANNEL_CREATE', {
        channelId,
        type,
        participantCount: participants.length + 1
      });

      return channelData;
    } catch (error) {
      console.error('Error creating channel:', error);
      return null;
    }
  }, [userId, joinChannel]);

  // Subscribe to updates for a specific data type
  const subscribeToUpdates = useCallback((dataType, callback) => {
    const channelId = `${dataType}_${userId}`;
    
    // Store callback for this channel
    const callbacks = updateCallbacksRef.current.get(channelId) || [];
    updateCallbacksRef.current.set(channelId, [...callbacks, callback]);

    // Join channel if not already joined
    if (!activeChannels.find(c => c.id === channelId)) {
      joinChannel(channelId, ChannelType.USER_DATA);
    }

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        const callbacks = updateCallbacksRef.current.get(channelId) || [];
        const filteredCallbacks = callbacks.filter(cb => cb !== callback);
        
        if (filteredCallbacks.length === 0) {
          updateCallbacksRef.current.delete(channelId);
          leaveChannel(channelId);
        } else {
          updateCallbacksRef.current.set(channelId, filteredCallbacks);
        }
      }
    };
  }, [userId, activeChannels, joinChannel, leaveChannel]);

  // Publish an update to subscribers
  const publishUpdate = useCallback(async (update) => {
    if (!userId || connectionStatus.status !== ConnectionStatus.CONNECTED) {
      console.warn('Cannot publish update: not connected');
      return;
    }

    try {
      const channelId = update.channelId || `${update.type}_${userId}`;
      
      // Add update to channel messages
      const messagesRef = collection(db, 'realtimeChannels', channelId, 'messages');
      const updateData = {
        ...update,
        userId,
        timestamp: serverTimestamp(),
        id: Date.now().toString()
      };

      await addDoc(messagesRef, updateData);

      // Update sync metrics
      setSyncMetrics(prev => ({
        ...prev,
        totalSyncs: prev.totalSyncs + 1,
        lastSuccessfulSync: new Date(),
        bytesTransferred: prev.bytesTransferred + JSON.stringify(updateData).length
      }));

      // Log the update
      await logEvent(userId, 'REALTIME_UPDATE_PUBLISHED', {
        type: update.type,
        channelId,
        dataSize: JSON.stringify(updateData).length
      });
    } catch (error) {
      console.error('Error publishing update:', error);
      setSyncMetrics(prev => ({
        ...prev,
        failedSyncs: prev.failedSyncs + 1
      }));
      handleConnectionError(error);
    }
  }, [userId, connectionStatus.status, handleConnectionError]);

  // Sync with keyholder
  const syncWithKeyholder = useCallback(async (relationshipId) => {
    if (!userId || !relationshipId) return;

    try {
      const channelId = `relationship_${relationshipId}`;
      await joinChannel(channelId, ChannelType.RELATIONSHIP);

      // Publish sync request
      await publishUpdate({
        type: UpdateType.SESSION_UPDATE,
        channelId,
        action: 'sync_request',
        relationshipId,
        data: {
          userId,
          syncTime: new Date()
        }
      });

      // Log keyholder sync
      await logEvent(userId, 'KEYHOLDER_SYNC', {
        relationshipId,
        action: 'sync_initiated'
      });
    } catch (error) {
      console.error('Error syncing with keyholder:', error);
    }
  }, [userId, joinChannel, publishUpdate]);

  // Sync session data
  const syncSessionData = useCallback(async (sessionId) => {
    if (!userId || !sessionId) return;

    try {
      const channelId = `session_${sessionId}`;
      await joinChannel(channelId, ChannelType.SESSION_SYNC);

      // Get current session data and publish
      // In a real implementation, this would fetch actual session data
      const sessionData = {
        sessionId,
        status: 'active',
        startTime: new Date(),
        events: []
      };

      await publishUpdate({
        type: UpdateType.SESSION_UPDATE,
        channelId,
        data: sessionData
      });

      // Log session sync
      await logEvent(userId, 'SESSION_SYNC', {
        sessionId,
        action: 'data_synced'
      });
    } catch (error) {
      console.error('Error syncing session data:', error);
    }
  }, [userId, joinChannel, publishUpdate]);

  // Computed values
  const isConnected = connectionStatus.status === ConnectionStatus.CONNECTED;
  const channelCount = activeChannels.length;
  const lastSyncTime = syncMetrics.lastSuccessfulSync;
  const hasActiveSync = activeChannels.some(c => c.isActive);

  // Connection health score (0-100)
  const connectionHealth = useMemo(() => {
    if (!isConnected) return 0;
    
    let score = 50; // Base score for being connected
    
    // Add points for successful syncs
    if (syncMetrics.totalSyncs > 0) {
      const successRate = 1 - (syncMetrics.failedSyncs / syncMetrics.totalSyncs);
      score += successRate * 30;
    }
    
    // Add points for recent activity
    if (lastSyncTime && (Date.now() - lastSyncTime.getTime()) < 60000) {
      score += 20; // Recent sync within last minute
    }
    
    return Math.min(100, score);
  }, [isConnected, syncMetrics, lastSyncTime]);

  return {
    // Connection state
    connectionStatus,
    activeChannels,
    syncMetrics,
    realtimeData,

    // Channel management
    joinChannel,
    leaveChannel,
    createChannel,

    // Real-time data operations
    subscribeToUpdates,
    publishUpdate,

    // Relationship-specific sync
    syncWithKeyholder,
    syncSessionData,

    // Connection management
    initializeConnection,

    // Computed values
    isConnected,
    channelCount,
    lastSyncTime,
    hasActiveSync,
    connectionHealth
  };
};