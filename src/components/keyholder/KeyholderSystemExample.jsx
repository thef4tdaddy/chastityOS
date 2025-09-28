import React, { useState } from 'react';
import {
  useKeyholderSystem,
  useAdminSession,
  useKeyholderRewards,
  useKeyholderSession,
  useMultiWearer
} from '../../hooks/keyholder';

/**
 * Example component demonstrating how to use the new keyholder system hooks.
 * This serves as both documentation and a working example of integration.
 */
const KeyholderSystemExample = ({ keyholderId }) => {
  const [selectedRelationshipId, setSelectedRelationshipId] = useState(null);

  // 1. Main keyholder system hook - provides overall management
  const {
    activeRelationships,
    keyholderStatus,
    stats,
    createInviteCode,
    isLoading: systemLoading,
    error: systemError
  } = useKeyholderSystem(keyholderId);

  // 2. Multi-wearer management for handling multiple relationships
  const {
    overviewStats,
    bulkStartSessions,
    canPerformBulkOperations
  } = useMultiWearer(keyholderId);

  // 3. Admin session management for the selected relationship
  const {
    isActive: isAdminSessionActive,
    startSession: startAdminSession,
    endSession: endAdminSession,
    hasPermission,
    formatTimeRemaining,
    needsReauth
  } = useAdminSession(selectedRelationshipId, keyholderId);

  // 4. Rewards system for the selected relationship
  const {
    availableRewards,
    availablePunishments,
    recentActions,
    applyReward,
    applyPunishment,
    isInCooldown,
    cooldownTimeRemaining,
    canApplyRewards,
    canApplyPunishments
  } = useKeyholderRewards(selectedRelationshipId, keyholderId);

  // 5. Session control for the selected relationship
  const {
    isActive: isSessionActive,
    controlOptions,
    liveStats,
    startSession: startChastitySession,
    stopSession: stopChastitySession,
    pauseSession,
    emergencyUnlock,
    sessionDuration
  } = useKeyholderSession(selectedRelationshipId, keyholderId);

  // Event handlers
  const handleCreateInvite = async () => {
    try {
      const inviteCode = await createInviteCode({
        expiresIn: 24, // 24 hours
        maxUses: 1,
        customMessage: 'You have been invited to join as a submissive.'
      });
      alert(`Invite code created: ${inviteCode}`);
    } catch (error) {
      alert(`Error creating invite: ${error.message}`);
    }
  };

  const handleStartAdminSession = async () => {
    if (!selectedRelationshipId) {
      alert('Please select a relationship first');
      return;
    }
    
    try {
      await startAdminSession(selectedRelationshipId, 30); // 30 minute session
    } catch (error) {
      alert(`Error starting admin session: ${error.message}`);
    }
  };

  const handleApplyReward = async (rewardId) => {
    try {
      await applyReward(rewardId, 'Good behavior reward');
    } catch (error) {
      alert(`Error applying reward: ${error.message}`);
    }
  };

  const handleApplyPunishment = async (punishmentId) => {
    const reason = prompt('Please provide a reason for this punishment:');
    if (!reason) return;

    try {
      await applyPunishment(punishmentId, reason);
    } catch (error) {
      alert(`Error applying punishment: ${error.message}`);
    }
  };

  const handleStartSession = async () => {
    try {
      await startChastitySession({
        durationMinutes: 120, // 2 hours
        tasksToComplete: 3,
        edgingCount: 5
      });
    } catch (error) {
      alert(`Error starting session: ${error.message}`);
    }
  };

  const handleEmergencyUnlock = async () => {
    const reason = prompt('Emergency unlock reason (required):');
    if (!reason) return;

    const confirmed = confirm(`Are you sure you want to perform an emergency unlock? This will immediately end the session and remove all restrictions. Reason: ${reason}`);
    if (!confirmed) return;

    try {
      await emergencyUnlock(reason);
    } catch (error) {
      alert(`Error performing emergency unlock: ${error.message}`);
    }
  };

  const handleBulkStartSessions = async () => {
    const confirmed = confirm(`Start sessions for all ${activeRelationships.length} relationships?`);
    if (!confirmed) return;

    try {
      const relationshipIds = activeRelationships.map(r => r.id);
      await bulkStartSessions(relationshipIds, { durationMinutes: 60 });
      alert('Bulk session start initiated');
    } catch (error) {
      alert(`Error starting bulk sessions: ${error.message}`);
    }
  };

  if (systemLoading) {
    return <div className="p-4">Loading keyholder system...</div>;
  }

  if (systemError) {
    return <div className="p-4 text-red-500">Error: {systemError}</div>;
  }

  return (
    <div className="keyholder-system-example p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Keyholder System Example</h1>
      
      {/* System Overview */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Relationships</p>
            <p className="text-2xl font-bold">{stats.totalRelationships}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Relationships</p>
            <p className="text-2xl font-bold">{stats.activeRelationships}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Sessions</p>
            <p className="text-2xl font-bold">{overviewStats.totalActiveSessions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-sm font-medium text-green-600">
              {keyholderStatus.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Relationship Management */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Relationship Management</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleCreateInvite}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Invite Code
          </button>
          
          {canPerformBulkOperations && (
            <button
              onClick={handleBulkStartSessions}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Bulk Start Sessions
            </button>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Relationship:</label>
          <select
            value={selectedRelationshipId || ''}
            onChange={(e) => setSelectedRelationshipId(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-md"
          >
            <option value="">Select a relationship...</option>
            {activeRelationships.map(rel => (
              <option key={rel.id} value={rel.id}>
                {rel.submissiveName || `Relationship ${rel.id.slice(0, 8)}`}
                {rel.hasActiveSession && ' (Active Session)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Admin Session Management */}
      {selectedRelationshipId && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Admin Session</h2>
          
          {!isAdminSessionActive ? (
            <button
              onClick={handleStartAdminSession}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Admin Session
            </button>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-green-600 font-medium">✓ Admin Session Active</span>
                <span className="text-sm text-gray-600">
                  Time Remaining: {formatTimeRemaining()}
                </span>
                {needsReauth && (
                  <span className="text-red-500 text-sm">⚠️ Session expiring soon!</span>
                )}
              </div>
              
              <button
                onClick={endAdminSession}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                End Admin Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* Session Control */}
      {selectedRelationshipId && isAdminSessionActive && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Session Control</h2>
          
          {!isSessionActive ? (
            <button
              onClick={handleStartSession}
              disabled={!controlOptions.canStart}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Start Chastity Session
            </button>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-green-600 font-medium">✓ Session Active</p>
                <p className="text-sm text-gray-600">
                  Duration: {Math.floor(sessionDuration / 60)} minutes
                </p>
                {liveStats && (
                  <p className="text-sm text-gray-600">
                    Effective Time: {Math.floor(liveStats.effectiveDuration / 60)} minutes
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => stopChastitySession('Stopped by keyholder')}
                  disabled={!controlOptions.canStop}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300"
                >
                  Stop Session
                </button>
                
                <button
                  onClick={() => pauseSession('Paused by keyholder')}
                  disabled={!controlOptions.canPause}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-300"
                >
                  Pause Session
                </button>
                
                <button
                  onClick={handleEmergencyUnlock}
                  className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
                >
                  Emergency Unlock
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rewards and Punishments */}
      {selectedRelationshipId && isAdminSessionActive && hasPermission('reward_punishment') && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Rewards & Punishments</h2>
          
          {isInCooldown && (
            <div className="bg-yellow-100 border border-yellow-400 p-3 rounded mb-4">
              <p className="text-yellow-800">
                Cooldown active: {Math.ceil(cooldownTimeRemaining / 1000 / 60)} minutes remaining
              </p>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-green-600 mb-2">Rewards</h3>
              <div className="space-y-2">
                {availableRewards.map(reward => (
                  <button
                    key={reward.id}
                    onClick={() => handleApplyReward(reward.id)}
                    disabled={!canApplyRewards || isInCooldown}
                    className="block w-full text-left p-2 border rounded hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <div className="font-medium">{reward.name}</div>
                    <div className="text-sm text-gray-600">{reward.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-red-600 mb-2">Punishments</h3>
              <div className="space-y-2">
                {availablePunishments.map(punishment => (
                  <button
                    key={punishment.id}
                    onClick={() => handleApplyPunishment(punishment.id)}
                    disabled={!canApplyPunishments || isInCooldown}
                    className="block w-full text-left p-2 border rounded hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <div className="font-medium">{punishment.name}</div>
                    <div className="text-sm text-gray-600">{punishment.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Actions */}
      {selectedRelationshipId && recentActions.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Recent Actions</h2>
          <div className="space-y-2">
            {recentActions.slice(0, 5).map(action => (
              <div key={action.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className={`font-medium ${action.type === 'reward' ? 'text-green-600' : 'text-red-600'}`}>
                    {action.type === 'reward' ? '🎁' : '⚠️'} {action.actionName}
                  </span>
                  {action.reason && (
                    <p className="text-sm text-gray-600">{action.reason}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {action.appliedAt.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyholderSystemExample;