import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, addDoc, updateDoc, doc, query, orderBy, limit, where, onSnapshot, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { logEvent } from '../../utils/logging';

// Notification types
export const NotificationType = {
  SYSTEM: 'system',
  SECURITY: 'security',
  SESSION: 'session',
  KEYHOLDER: 'keyholder',
  TASK: 'task',
  REWARD: 'reward',
  PUNISHMENT: 'punishment',
  SOCIAL: 'social',
  REMINDER: 'reminder'
};

// Notification priorities
export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Notification channels
export const NotificationChannelType = {
  IN_APP: 'in_app',
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms'
};

// Notification actions
export const NotificationAction = {
  DISMISS: 'dismiss',
  ACCEPT: 'accept',
  DECLINE: 'decline',
  VIEW: 'view',
  SNOOZE: 'snooze'
};

// Default notification preferences
const DEFAULT_PREFERENCES = {
  channels: {
    [NotificationChannelType.IN_APP]: true,
    [NotificationChannelType.PUSH]: false,
    [NotificationChannelType.EMAIL]: false,
    [NotificationChannelType.SMS]: false
  },
  types: {
    [NotificationType.SYSTEM]: true,
    [NotificationType.SECURITY]: true,
    [NotificationType.SESSION]: true,
    [NotificationType.KEYHOLDER]: true,
    [NotificationType.TASK]: true,
    [NotificationType.REWARD]: true,
    [NotificationType.PUNISHMENT]: true,
    [NotificationType.SOCIAL]: false,
    [NotificationType.REMINDER]: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  grouping: true,
  sound: true,
  vibration: true
};

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [deliveryChannels, setDeliveryChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState({
    push: 'default',
    notifications: 'default'
  });

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Check browser notification permissions
      if ('Notification' in window) {
        setPermissionStatus(prev => ({
          ...prev,
          notifications: Notification.permission
        }));
      }

      // Set up real-time listener for notifications
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationList = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          notificationList.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || null
          });
        });

        setNotifications(notificationList);
      });

      // Load user preferences
      await loadPreferences();

      // Initialize delivery channels
      await initializeDeliveryChannels();

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load notification preferences
  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const savedPreferences = userData.notificationPreferences || DEFAULT_PREFERENCES;
        setPreferences({ ...DEFAULT_PREFERENCES, ...savedPreferences });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }, [userId]);

  // Initialize delivery channels
  const initializeDeliveryChannels = useCallback(async () => {
    const channels = [
      {
        type: NotificationChannelType.IN_APP,
        enabled: true,
        status: 'active',
        lastUsed: new Date()
      }
    ];

    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      channels.push({
        type: NotificationChannelType.PUSH,
        enabled: preferences.channels[NotificationChannelType.PUSH],
        status: permissionStatus.notifications === 'granted' ? 'active' : 'pending',
        lastUsed: null
      });
    }

    // Email channel (would require server-side integration)
    channels.push({
      type: NotificationChannelType.EMAIL,
      enabled: preferences.channels[NotificationChannelType.EMAIL],
      status: 'available',
      lastUsed: null
    });

    setDeliveryChannels(channels);
  }, [preferences.channels, permissionStatus.notifications]);

  // Initialize on mount
  useEffect(() => {
    let unsubscribe;
    
    const init = async () => {
      unsubscribe = await initializeNotifications();
    };
    
    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeNotifications]);

  // Create and send notification
  const createNotification = useCallback(async (notificationData) => {
    if (!userId) return null;

    try {
      const notification = {
        userId,
        type: notificationData.type || NotificationType.SYSTEM,
        priority: notificationData.priority || NotificationPriority.MEDIUM,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        actions: notificationData.actions || [],
        isRead: false,
        isDismissed: false,
        createdAt: serverTimestamp(),
        expiresAt: notificationData.expiresAt || null,
        channels: notificationData.channels || [NotificationChannelType.IN_APP],
        context: {
          relationshipId: notificationData.relationshipId,
          sessionId: notificationData.sessionId,
          taskId: notificationData.taskId,
          ...notificationData.context
        }
      };

      // Save to database
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const docRef = await addDoc(notificationsRef, notification);

      const createdNotification = {
        id: docRef.id,
        ...notification,
        createdAt: new Date()
      };

      // Send through enabled channels
      await sendThroughChannels(createdNotification);

      // Log notification creation
      await logEvent(userId, 'NOTIFICATION_CREATED', {
        notificationId: docRef.id,
        type: notification.type,
        priority: notification.priority
      });

      return createdNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }, [userId]);

  // Send notification through appropriate channels
  const sendThroughChannels = useCallback(async (notification) => {
    const enabledChannels = deliveryChannels.filter(channel => 
      channel.enabled && 
      preferences.channels[channel.type] &&
      notification.channels.includes(channel.type)
    );

    for (const channel of enabledChannels) {
      try {
        switch (channel.type) {
          case NotificationChannelType.IN_APP:
            // In-app notifications are handled by the real-time listener
            break;

          case NotificationChannelType.PUSH:
            await sendPushNotification(notification);
            break;

          case NotificationChannelType.EMAIL:
            await sendEmailNotification(notification);
            break;

          case NotificationChannelType.SMS:
            await sendSMSNotification(notification);
            break;
        }
      } catch (error) {
        console.error(`Error sending notification via ${channel.type}:`, error);
      }
    }
  }, [deliveryChannels, preferences.channels]);

  // Send push notification
  const sendPushNotification = useCallback(async (notification) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      // Check if we're in quiet hours
      if (isInQuietHours()) {
        return;
      }

      // Show browser notification
      if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: notification.id,
          data: notification.data,
          requireInteraction: notification.priority === NotificationPriority.URGENT,
          actions: notification.actions.map(action => ({
            action: action.id,
            title: action.title
          }))
        });

        browserNotification.onclick = () => {
          // Handle notification click
          handleNotificationAction(notification.id, NotificationAction.VIEW);
        };
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }, []);

  // Send email notification (placeholder for server-side implementation)
  const sendEmailNotification = useCallback(async (notification) => {
    // This would typically call a server endpoint to send email
    console.log('Email notification would be sent:', notification);
  }, []);

  // Send SMS notification (placeholder for server-side implementation)
  const sendSMSNotification = useCallback(async (notification) => {
    // This would typically call a server endpoint to send SMS
    console.log('SMS notification would be sent:', notification);
  }, []);

  // Check if current time is in quiet hours
  const isInQuietHours = useCallback(() => {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [preferences.quietHours]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!userId) return;

    try {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );

      // Log the action
      await logEvent(userId, 'NOTIFICATION_READ', {
        notificationId
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.isRead);

      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'users', userId, 'notifications', notification.id);
        batch.update(notificationRef, {
          isRead: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date() 
        }))
      );

      // Log the action
      await logEvent(userId, 'NOTIFICATIONS_ALL_READ', {
        count: unreadNotifications.length
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId, notifications]);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId) => {
    if (!userId) return;

    try {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isDismissed: true,
        dismissedAt: serverTimestamp()
      });

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Log the action
      await logEvent(userId, 'NOTIFICATION_DISMISSED', {
        notificationId
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, [userId]);

  // Handle notification action
  const handleNotificationAction = useCallback(async (notificationId, action, data = {}) => {
    if (!userId) return;

    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Update notification with action taken
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        lastAction: action,
        actionData: data,
        actionTakenAt: serverTimestamp()
      });

      // Handle specific actions
      switch (action) {
        case NotificationAction.ACCEPT:
          // Handle acceptance logic
          break;
        case NotificationAction.DECLINE:
          // Handle decline logic
          break;
        case NotificationAction.SNOOZE:
          // Snooze the notification
          await snoozeNotification(notificationId, data.snoozeMinutes || 30);
          break;
        case NotificationAction.VIEW:
          await markAsRead(notificationId);
          break;
        case NotificationAction.DISMISS:
          await dismissNotification(notificationId);
          break;
      }

      // Log the action
      await logEvent(userId, 'NOTIFICATION_ACTION', {
        notificationId,
        action,
        data
      });
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }, [userId, notifications, markAsRead, dismissNotification]);

  // Snooze notification
  const snoozeNotification = useCallback(async (notificationId, minutes) => {
    if (!userId) return;

    try {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
      
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        snoozedUntil: snoozeUntil,
        snoozeCount: (notifications.find(n => n.id === notificationId)?.snoozeCount || 0) + 1
      });

      // Remove from current notifications temporarily
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Set timeout to re-show notification
      setTimeout(() => {
        // Re-fetch notifications to show snoozed notification
        // In a real implementation, this would be handled by the real-time listener
      }, minutes * 60 * 1000);
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  }, [userId, notifications]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    if (!userId) return;

    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        notificationPreferences: updatedPreferences
      });

      setPreferences(updatedPreferences);

      // Re-initialize delivery channels with new preferences
      await initializeDeliveryChannels();

      // Log preferences update
      await logEvent(userId, 'NOTIFICATION_PREFERENCES_UPDATE', {
        changes: newPreferences
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }, [userId, preferences, initializeDeliveryChannels]);

  // Enable notification channel
  const enableChannel = useCallback(async (channelType) => {
    if (channelType === NotificationChannelType.PUSH) {
      // Request push notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setPermissionStatus(prev => ({ ...prev, notifications: permission }));
        
        if (permission !== 'granted') {
          return false;
        }
      }
    }

    await updatePreferences({
      channels: {
        ...preferences.channels,
        [channelType]: true
      }
    });

    return true;
  }, [preferences.channels, updatePreferences]);

  // Disable notification channel
  const disableChannel = useCallback(async (channelType) => {
    await updatePreferences({
      channels: {
        ...preferences.channels,
        [channelType]: false
      }
    });
  }, [preferences.channels, updatePreferences]);

  // Computed values
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasHighPriority = notifications.some(n => 
    n.priority === NotificationPriority.HIGH || n.priority === NotificationPriority.URGENT
  );
  const recentNotifications = notifications.slice(0, 10);

  // Notification stats
  const notificationStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: notifications.length,
      unread: unreadCount,
      today: notifications.filter(n => n.createdAt >= today).length,
      thisWeek: notifications.filter(n => n.createdAt >= thisWeek).length,
      byType: Object.values(NotificationType).reduce((acc, type) => {
        acc[type] = notifications.filter(n => n.type === type).length;
        return acc;
      }, {}),
      byPriority: Object.values(NotificationPriority).reduce((acc, priority) => {
        acc[priority] = notifications.filter(n => n.priority === priority).length;
        return acc;
      }, {})
    };
  }, [notifications, unreadCount]);

  return {
    // Notification state
    notifications,
    preferences,
    deliveryChannels,
    isLoading,
    permissionStatus,

    // Notification management
    createNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    handleNotificationAction,
    snoozeNotification,

    // Preferences and channels
    updatePreferences,
    enableChannel,
    disableChannel,

    // Computed values
    unreadCount,
    hasHighPriority,
    recentNotifications,
    notificationStats
  };
};