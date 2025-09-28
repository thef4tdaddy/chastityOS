# Phase 3: Security & Real-time Hooks Documentation

This document provides comprehensive documentation for the 7 security and real-time hooks implemented in Phase 3 of the ChastityOS project.

## 🔒 Security Hooks

### 1. usePermissions

Comprehensive permission checking system that validates user permissions in real-time.

#### Usage
```javascript
import { usePermissions } from '../hooks/security/usePermissions';

const MyComponent = ({ userId }) => {
  const permissions = usePermissions(userId);

  if (permissions.isLoading) return <div>Loading...</div>;

  return (
    <div>
      {permissions.hasPermission('edit_own_profile') && (
        <button>Edit Profile</button>
      )}
      {permissions.isKeyholder && (
        <button>Keyholder Actions</button>
      )}
    </div>
  );
};
```

#### Key Features
- Real-time permission validation
- Role-based access control (user, keyholder, admin)
- Context-aware permissions
- Permission request system
- Automatic audit logging

#### API
- `hasPermission(permission, context?)` - Check single permission
- `hasAnyPermission(permissions[], context?)` - Check if user has any of the permissions
- `hasAllPermissions(permissions[], context?)` - Check if user has all permissions
- `hasRole(role)` - Check user role
- `canPerformAction(action, target?)` - Check specific actions
- `requestPermission(permission, justification)` - Request additional permission

### 2. useAuditLog

Complete audit logging system for transparency and security monitoring.

#### Usage
```javascript
import { useAuditLog } from '../hooks/security/useAuditLog';

const MyComponent = ({ userId, relationshipId }) => {
  const auditLog = useAuditLog(userId, relationshipId);

  const handleAction = async () => {
    await auditLog.logAction('user_action', {
      description: 'User performed important action',
      context: { page: 'settings' }
    });
  };

  return (
    <div>
      <p>Security Alerts: {auditLog.securityAlerts}</p>
      <p>Total Entries: {auditLog.totalEntries}</p>
      <button onClick={handleAction}>Log Action</button>
    </div>
  );
};
```

#### Key Features
- Comprehensive action logging
- Security event monitoring
- Compliance reporting
- Data export capabilities
- Privacy controls

#### API
- `logAction(action, details, context?)` - Log user action
- `logSecurityEvent(event)` - Log security-related event
- `getEntriesByDateRange(start, end)` - Get entries by date
- `exportAuditLog(format, filters?)` - Export audit data
- `getSecuritySummary()` - Get security overview

### 3. useSecuritySettings

Manage comprehensive security settings and configurations.

#### Usage
```javascript
import { useSecuritySettings } from '../hooks/security/useSecuritySettings';

const SecuritySettings = ({ userId }) => {
  const security = useSecuritySettings(userId);

  const handleTimeoutChange = async (minutes) => {
    await security.setSessionTimeout(minutes);
  };

  return (
    <div>
      <p>Security Level: {security.securityLevel}</p>
      <p>Session Timeout: {security.sessionTimeoutMinutes} minutes</p>
      <button onClick={() => handleTimeoutChange(15)}>
        Set 15 Minute Timeout
      </button>
    </div>
  );
};
```

#### Key Features
- Session timeout management
- Access control settings
- Security monitoring preferences
- Security health assessment

#### API
- `updateSessionSettings(settings)` - Update session security
- `setSessionTimeout(minutes)` - Set session timeout
- `addTrustedDevice(device)` - Add trusted device
- `getSecurityScore()` - Get security score (0-100)
- `checkSecurityHealth()` - Get comprehensive security status

## 🚀 Real-time Hooks

### 4. useRealtimeSync

Real-time data synchronization across devices and users.

#### Usage
```javascript
import { useRealtimeSync } from '../hooks/realtime/useRealtimeSync';

const RealtimeComponent = ({ userId }) => {
  const sync = useRealtimeSync(userId);

  const handleJoinChannel = async () => {
    await sync.joinChannel('session_123', 'session_sync');
  };

  return (
    <div>
      <p>Status: {sync.connectionStatus.status}</p>
      <p>Connected: {sync.isConnected ? 'Yes' : 'No'}</p>
      <button onClick={handleJoinChannel}>Join Channel</button>
    </div>
  );
};
```

#### Key Features
- WebSocket-based real-time communication
- Multi-device synchronization
- Channel management
- Conflict resolution

#### API
- `joinChannel(channelId, type?)` - Join sync channel
- `publishUpdate(update)` - Publish real-time update
- `subscribeToUpdates(dataType, callback)` - Subscribe to updates
- `syncWithKeyholder(relationshipId)` - Sync with keyholder

### 5. useNotifications

Comprehensive notification system for in-app, push, and email notifications.

#### Usage
```javascript
import { useNotifications } from '../hooks/realtime/useNotifications';

const NotificationCenter = ({ userId }) => {
  const notifications = useNotifications(userId);

  const createNotification = async () => {
    await notifications.createNotification({
      title: 'Test Notification',
      message: 'This is a test message',
      type: 'system',
      priority: 'medium'
    });
  };

  return (
    <div>
      <p>Unread: {notifications.unreadCount}</p>
      <button onClick={createNotification}>Create Notification</button>
      <button onClick={notifications.markAllAsRead}>Mark All Read</button>
    </div>
  );
};
```

#### Key Features
- Multi-channel notifications (in-app, push, email)
- User preference management
- Notification history and analytics
- Quiet hours support

#### API
- `createNotification(data)` - Create new notification
- `markAsRead(id)` - Mark notification as read
- `dismissNotification(id)` - Dismiss notification
- `updatePreferences(prefs)` - Update notification preferences
- `enableChannel(type)` - Enable notification channel

### 6. usePresence

Track and display online/offline presence for users in relationships.

#### Usage
```javascript
import { usePresence } from '../hooks/realtime/usePresence';

const PresenceIndicator = ({ userId, relationshipId }) => {
  const presence = usePresence(userId, relationshipId);

  return (
    <div>
      <p>Status: {presence.userPresence.status}</p>
      <p>Activity: {presence.userPresence.activity}</p>
      <p>Online in Relationship: {presence.relationshipOnlineCount}</p>
      <button onClick={() => presence.setStatus('busy')}>
        Set Busy
      </button>
    </div>
  );
};
```

#### Key Features
- Real-time presence tracking
- Activity indicators
- Status messages
- Relationship presence awareness

#### API
- `setStatus(status)` - Set presence status
- `setStatusMessage(message)` - Set custom status message
- `setActivity(activity, context?)` - Set current activity
- `setTyping(isTyping, context?)` - Set typing indicator

### 7. useLiveTimer

Synchronized timer updates across all devices and users.

#### Usage
```javascript
import { useLiveTimer } from '../hooks/realtime/useLiveTimer';

const TimerComponent = ({ userId, sessionId, relationshipId }) => {
  const timer = useLiveTimer(userId, sessionId, relationshipId);

  return (
    <div>
      <p>State: {timer.timerState.state}</p>
      <p>Elapsed: {timer.formattedElapsed}</p>
      <p>Remaining: {timer.formattedRemaining}</p>
      <p>Progress: {Math.round(timer.progress * 100)}%</p>
      
      <button onClick={() => timer.startTimer(3600)}>Start 1 Hour</button>
      <button onClick={timer.pauseTimer}>Pause</button>
      <button onClick={timer.stopTimer}>Stop</button>
    </div>
  );
};
```

#### Key Features
- Synchronized timers across devices
- Real-time progress sharing
- Conflict resolution
- Keyholder monitoring integration

#### API
- `startTimer(duration, type?)` - Start new timer
- `stopTimer()` - Stop current timer
- `pauseTimer()` - Pause timer
- `resumeTimer()` - Resume paused timer
- `addTime(seconds)` - Add time to timer
- `removeTime(seconds)` - Remove time from timer

## 🔧 Installation and Setup

### 1. Import Hooks
```javascript
// Import individual hooks
import { usePermissions } from './hooks/security/usePermissions';
import { useNotifications } from './hooks/realtime/useNotifications';

// Or import from index files
import { usePermissions, useAuditLog } from './hooks/security';
import { useRealtimeSync, useNotifications } from './hooks/realtime';
```

### 2. Firebase Setup
These hooks integrate with Firebase Firestore. Ensure your Firebase configuration includes:
- Authentication
- Firestore database
- Real-time listeners
- Security rules for collections used by hooks

### 3. Required Collections
The hooks expect these Firestore collections:
- `users/{userId}/notifications`
- `users/{userId}/auditLog`
- `users/{userId}/permissionRequests`
- `presence/{userId}`
- `realtimeChannels/{channelId}`
- `sessions/{sessionId}/timer`
- `relationships/{relationshipId}/presence`

## 🎯 Integration Examples

### Complete Security Setup
```javascript
const SecurityDashboard = ({ userId }) => {
  const permissions = usePermissions(userId);
  const auditLog = useAuditLog(userId);
  const security = useSecuritySettings(userId);

  return (
    <div>
      {permissions.hasPermission('view_security_dashboard') && (
        <div>
          <h2>Security Dashboard</h2>
          <p>Security Level: {security.securityLevel}</p>
          <p>Recent Alerts: {auditLog.securityAlerts}</p>
          <p>Permission Level: {permissions.permissionLevel}</p>
        </div>
      )}
    </div>
  );
};
```

### Real-time Session Management
```javascript
const SessionManager = ({ userId, sessionId, relationshipId }) => {
  const sync = useRealtimeSync(userId);
  const presence = usePresence(userId, relationshipId);
  const timer = useLiveTimer(userId, sessionId, relationshipId);
  const notifications = useNotifications(userId);

  useEffect(() => {
    // Set up session sync
    sync.syncSessionData(sessionId);
    presence.setActivity('in_session');
    
    // Notify start
    notifications.createNotification({
      title: 'Session Started',
      message: 'Your chastity session has begun',
      type: 'session'
    });
  }, []);

  return (
    <div>
      <h2>Active Session</h2>
      <p>Timer: {timer.formattedElapsed}</p>
      <p>Status: {presence.userPresence.status}</p>
      <p>Sync: {sync.isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
};
```

## 🔒 Security Considerations

1. **Permissions**: Always check permissions before rendering sensitive UI
2. **Audit Logging**: Log all security-relevant actions
3. **Real-time Security**: Validate all real-time updates server-side
4. **Data Privacy**: Respect user privacy settings in all hooks
5. **Error Handling**: Implement proper error handling for all async operations

## 📈 Performance Optimization

1. **Lazy Loading**: Import hooks only when needed
2. **Memoization**: Use React.memo for components using these hooks
3. **Debouncing**: Debounce frequent operations like presence updates
4. **Caching**: Leverage built-in caching in permission and audit hooks
5. **Cleanup**: Properly cleanup subscriptions and timers

## 🐛 Troubleshooting

### Common Issues
1. **Connection Issues**: Check Firebase configuration and network connectivity
2. **Permission Denied**: Verify Firestore security rules
3. **Real-time Updates**: Ensure proper cleanup of listeners
4. **Timer Sync**: Check for clock skew between client and server

### Debug Mode
Enable debug logging by setting:
```javascript
// In development
localStorage.setItem('hooks-debug', 'true');
```

This implementation provides a comprehensive foundation for security and real-time features in ChastityOS, ensuring production-ready security posture and enhanced user experience.