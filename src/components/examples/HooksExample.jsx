import React from 'react';
import { usePermissions } from '../../hooks/security/usePermissions';
import { useAuditLog } from '../../hooks/security/useAuditLog';
import { useSecuritySettings } from '../../hooks/security/useSecuritySettings';
import { useRealtimeSync } from '../../hooks/realtime/useRealtimeSync';
import { useNotifications } from '../../hooks/realtime/useNotifications';
import { usePresence } from '../../hooks/realtime/usePresence';
import { useLiveTimer } from '../../hooks/realtime/useLiveTimer';

// Example component demonstrating the new hooks
const HooksExample = ({ userId, sessionId, relationshipId }) => {
  // Security hooks
  const permissions = usePermissions(userId);
  const auditLog = useAuditLog(userId, relationshipId);
  const securitySettings = useSecuritySettings(userId);

  // Real-time hooks
  const realtimeSync = useRealtimeSync(userId);
  const notifications = useNotifications(userId);
  const presence = usePresence(userId, relationshipId);
  const liveTimer = useLiveTimer(userId, sessionId, relationshipId);

  if (permissions.isLoading || auditLog.isLoading || securitySettings.isLoading) {
    return <div className="text-purple-200">Loading security hooks...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 text-purple-200">
      <h1 className="text-3xl font-bold text-purple-300">Phase 3 Security & Real-time Hooks Demo</h1>
      
      {/* Security Hooks Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-purple-300 mb-4">🔒 Security Hooks</h2>
        
        {/* Permissions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-200 mb-2">Permissions System</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>User Role:</strong> {permissions.isKeyholder ? 'Keyholder' : 'User'}</p>
              <p><strong>Permission Level:</strong> {permissions.permissionLevel}</p>
              <p><strong>Is Admin:</strong> {permissions.isAdmin ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Can Edit Profile:</strong> {permissions.hasPermission('edit_own_profile') ? 'Yes' : 'No'}</p>
              <p><strong>Can Start Session:</strong> {permissions.hasPermission('start_session') ? 'Yes' : 'No'}</p>
              <p><strong>Can View Data:</strong> {permissions.hasPermission('view_own_data') ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-200 mb-2">Audit Log</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>Total Entries:</strong> {auditLog.totalEntries}</p>
              <p><strong>Security Alerts:</strong> {auditLog.securityAlerts}</p>
            </div>
            <div>
              <p><strong>Security Concerns:</strong> {auditLog.hasSecurityConcerns ? 'Yes' : 'No'}</p>
              <p><strong>Last Login:</strong> {auditLog.lastLoginTime?.toLocaleString() || 'Never'}</p>
            </div>
            <div>
              <p><strong>Most Common Actions:</strong></p>
              <ul className="text-xs">
                {auditLog.mostCommonActions.slice(0, 3).map(({ action, count }) => (
                  <li key={action}>{action}: {count}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-200 mb-2">Security Settings</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Security Level:</strong> {securitySettings.securityLevel}</p>
              <p><strong>Is Secure:</strong> {securitySettings.isSecure ? 'Yes' : 'No'}</p>
              <p><strong>Needs Attention:</strong> {securitySettings.needsAttention ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Session Timeout:</strong> {securitySettings.sessionTimeoutMinutes} minutes</p>
              <p><strong>Require Re-auth:</strong> {securitySettings.sessionSettings.requireReauthForSensitive ? 'Yes' : 'No'}</p>
              <p><strong>Security Alerts:</strong> {securitySettings.monitoringSettings.enableSecurityAlerts ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Hooks Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-purple-300 mb-4">🚀 Real-time Hooks</h2>
        
        {/* Real-time Sync */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-200 mb-2">Real-time Sync</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>Connection Status:</strong> {realtimeSync.connectionStatus.status}</p>
              <p><strong>Is Connected:</strong> {realtimeSync.isConnected ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Active Channels:</strong> {realtimeSync.channelCount}</p>
              <p><strong>Has Active Sync:</strong> {realtimeSync.hasActiveSync ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Last Sync:</strong> {realtimeSync.lastSyncTime?.toLocaleString() || 'Never'}</p>
              <p><strong>Connection Health:</strong> {realtimeSync.connectionHealth}%</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-200 mb-2">Notifications</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>Unread Count:</strong> {notifications.unreadCount}</p>
              <p><strong>High Priority:</strong> {notifications.hasHighPriority ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Total Today:</strong> {notifications.notificationStats.today}</p>
              <p><strong>This Week:</strong> {notifications.notificationStats.thisWeek}</p>
            </div>
            <div>
              <p><strong>Push Enabled:</strong> {notifications.preferences.channels.push ? 'Yes' : 'No'}</p>
              <p><strong>Email Enabled:</strong> {notifications.preferences.channels.email ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Presence */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-200 mb-2">Presence</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>Status:</strong> {presence.userPresence.status}</p>
              <p><strong>Activity:</strong> {presence.userPresence.activity}</p>
            </div>
            <div>
              <p><strong>Is Online:</strong> {presence.isOnline ? 'Yes' : 'No'}</p>
              <p><strong>Is Active:</strong> {presence.isActive ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Online in Relationship:</strong> {presence.relationshipOnlineCount}</p>
              <p><strong>Last Seen:</strong> {presence.formatLastSeen(presence.userPresence.lastSeen)}</p>
            </div>
          </div>
        </div>

        {/* Live Timer */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-purple-200 mb-2">Live Timer</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>Timer State:</strong> {liveTimer.timerState.state}</p>
              <p><strong>Is Running:</strong> {liveTimer.isRunning ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Elapsed:</strong> {liveTimer.formattedElapsed}</p>
              <p><strong>Remaining:</strong> {liveTimer.formattedRemaining}</p>
            </div>
            <div>
              <p><strong>Progress:</strong> {Math.round(liveTimer.progress * 100)}%</p>
              <p><strong>Is Synced:</strong> {liveTimer.isSynced ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-purple-300 mb-4">🎮 Demo Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium text-purple-200 mb-2">Security Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => permissions.requestPermission('elevated_access', 'Demo request')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm"
              >
                Request Permission
              </button>
              <button 
                onClick={() => auditLog.logAction('demo_action', { demo: true })}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm"
              >
                Log Demo Action
              </button>
              <button 
                onClick={() => securitySettings.setSessionTimeout(15)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm"
              >
                Set 15min Timeout
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-purple-200 mb-2">Real-time Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => notifications.createNotification({
                  title: 'Demo Notification',
                  message: 'This is a test notification',
                  type: 'system'
                })}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
              >
                Create Notification
              </button>
              <button 
                onClick={() => presence.setStatus('busy')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
              >
                Set Status to Busy
              </button>
              <button 
                onClick={() => liveTimer.startTimer(300, 'demo')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
              >
                Start 5min Timer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-purple-400">
        <p>✨ Phase 3 Security & Real-time Hooks Implementation Complete</p>
        <p>All 7 hooks are now available for production use</p>
      </div>
    </div>
  );
};

export default HooksExample;