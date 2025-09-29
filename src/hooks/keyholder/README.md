# Keyholder System Hooks

This directory contains the 5 critical keyholder system hooks that provide the foundation for all keyholder functionality in ChastityOS 4.0.

## Hooks Overview

### 1. `useKeyholderSystem`
The main entry point and unified management interface for all keyholder functionality.

```typescript
import { useKeyholderSystem } from './hooks/keyholder';

function KeyholderDashboard() {
  const {
    // State
    activeRelationships,
    keyholderStatus,
    stats,
    selectedRelationship,
    
    // Computed
    hasActiveRelationships,
    activeRelationshipCount,
    
    // Actions
    createInviteCode,
    acceptSubmissive,
    switchActiveRelationship,
    startAdminSession,
  } = useKeyholderSystem();

  // Create invite code for new submissive
  const handleCreateInvite = async () => {
    const inviteCode = await createInviteCode({ expirationHours: 24 });
    console.log('Invite code:', inviteCode);
  };

  return (
    <div>
      <h2>Keyholder Dashboard</h2>
      <p>Active Relationships: {activeRelationshipCount}</p>
      <button onClick={handleCreateInvite}>Create Invite Code</button>
    </div>
  );
}
```

### 2. `useAdminSession`
Manages secure admin sessions with time limits and permission boundaries.

```typescript
import { useAdminSession } from './hooks/keyholder';

function AdminControls({ relationshipId }: { relationshipId: string }) {
  const {
    // State
    session,
    isActive,
    timeRemaining,
    permissions,
    
    // Actions
    startSession,
    endSession,
    extendSession,
    hasPermission,
    logAction,
  } = useAdminSession(relationshipId);

  const handleStartSession = async () => {
    const session = await startSession(relationshipId, 30); // 30 minutes
    if (session) {
      console.log('Admin session started:', session.id);
    }
  };

  const handleControlAction = async () => {
    if (hasPermission('session_control')) {
      await logAction({
        action: 'SESSION_PAUSE',
        permission: 'session_control',
        details: 'Paused session from admin interface',
      });
    }
  };

  return (
    <div>
      {isActive ? (
        <div>
          <p>Session Active - {Math.ceil(timeRemaining / 60)} minutes left</p>
          <button onClick={handleControlAction}>Pause Session</button>
          <button onClick={endSession}>End Session</button>
        </div>
      ) : (
        <button onClick={handleStartSession}>Start Admin Session</button>
      )}
    </div>
  );
}
```

### 3. `useKeyholderRewards`
Manages the reward and punishment system with time modifications and audit logging.

```typescript
import { useKeyholderRewards } from './hooks/keyholder';

function RewardsPunishments({ relationshipId }: { relationshipId: string }) {
  const {
    // State
    system,
    canApplyRewards,
    canApplyPunishments,
    
    // Actions
    applyReward,
    applyPunishment,
    addSessionTime,
    reduceSessionTime,
    getHistory,
  } = useKeyholderRewards(relationshipId);

  const handleReward = async () => {
    await applyReward('time_reduction_30', 'Good behavior reward');
  };

  const handlePunishment = async () => {
    await applyPunishment('time_addition_60', 'Rule violation - tardiness');
  };

  const handleTimeAdjustment = async () => {
    await addSessionTime(30, 'Additional time for incomplete task');
  };

  return (
    <div>
      <h3>Rewards & Punishments</h3>
      <div>
        <button onClick={handleReward} disabled={!canApplyRewards}>
          Give Reward (-30 min)
        </button>
        <button onClick={handlePunishment} disabled={!canApplyPunishments}>
          Apply Punishment (+60 min)
        </button>
      </div>
      <div>
        <h4>Recent Actions: {system.recentActions.length}</h4>
        {getHistory(7).map(action => (
          <div key={action.id}>
            {action.type}: {action.actionName} - {action.reason}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. `useKeyholderSession`
Provides session control capabilities with real-time monitoring.

```typescript
import { useKeyholderSession } from './hooks/keyholder';

function SessionControl({ relationshipId }: { relationshipId: string }) {
  const {
    // State
    control,
    isActive,
    sessionDuration,
    goalProgress,
    
    // Actions
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    modifyGoals,
    emergencyUnlock,
  } = useKeyholderSession(relationshipId);

  const handleStart = async () => {
    const result = await startSession(relationshipId, {
      targetDuration: 4 * 60 * 60, // 4 hours
    });
    console.log('Session started:', result);
  };

  const handleEmergency = async () => {
    const result = await emergencyUnlock({
      reason: 'Medical emergency reported',
      requireConfirmation: true,
      notifySubmissive: true,
      logToHistory: true,
    });
    console.log('Emergency unlock:', result);
  };

  return (
    <div>
      <h3>Session Control</h3>
      {isActive ? (
        <div>
          <p>Duration: {Math.floor(sessionDuration / 3600)}h {Math.floor((sessionDuration % 3600) / 60)}m</p>
          <p>Goal Progress: {goalProgress.toFixed(1)}%</p>
          <button onClick={() => pauseSession('Keyholder requested pause')}>
            Pause
          </button>
          <button onClick={() => stopSession('Session completed')}>
            Stop Session
          </button>
          <button onClick={handleEmergency} style={{ backgroundColor: 'red' }}>
            Emergency Unlock
          </button>
        </div>
      ) : (
        <button onClick={handleStart}>Start Session</button>
      )}
    </div>
  );
}
```

### 5. `useMultiWearer`
Manages multiple submissive relationships with bulk operations.

```typescript
import { useMultiWearer } from './hooks/keyholder';

function MultiWearerDashboard() {
  const {
    // State
    relationships,
    filteredOverviews,
    overviewStats,
    activeRelationship,
    
    // Computed
    totalRelationships,
    canPerformBulkOperations,
    
    // Actions
    switchToRelationship,
    bulkStartSessions,
    bulkSendRewards,
    sendBroadcastMessage,
    setFilter,
  } = useMultiWearer();

  const handleBulkReward = async () => {
    const selectedIds = filteredOverviews
      .filter(r => r.status === 'active')
      .map(r => r.id);

    if (selectedIds.length > 0) {
      await bulkSendRewards(selectedIds, 'time_reduction_30', 'Weekly good behavior reward');
    }
  };

  const handleBroadcast = async () => {
    const activeIds = filteredOverviews
      .filter(r => r.status === 'active')
      .map(r => r.id);

    await sendBroadcastMessage({
      content: 'Weekly check-in: How are you doing?',
      priority: 'normal',
      requiresResponse: true,
    }, activeIds);
  };

  return (
    <div>
      <h2>Multi-Wearer Dashboard</h2>
      <div>
        <p>Total Relationships: {totalRelationships}</p>
        <p>Active Sessions: {overviewStats.activeSessions}</p>
      </div>

      <div>
        <input 
          type="text" 
          placeholder="Search relationships..."
          onChange={(e) => setFilter('searchTerm', e.target.value)}
        />
        <select onChange={(e) => setFilter('status', e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="needs_attention">Needs Attention</option>
        </select>
      </div>

      <div>
        <h3>Relationships ({filteredOverviews.length})</h3>
        {filteredOverviews.map(overview => (
          <div key={overview.id} onClick={() => switchToRelationship(overview.id)}>
            <h4>{overview.submissiveName}</h4>
            <p>Status: {overview.status}</p>
            <p>Active Session: {overview.hasActiveSession ? 'Yes' : 'No'}</p>
            <p>Pending Tasks: {overview.pendingTasks}</p>
          </div>
        ))}
      </div>

      {canPerformBulkOperations && (
        <div>
          <h3>Bulk Operations</h3>
          <button onClick={handleBulkReward}>
            Send Reward to All Active
          </button>
          <button onClick={handleBroadcast}>
            Send Broadcast Message
          </button>
        </div>
      )}
    </div>
  );
}
```

## Hook Integration Example

Here's how to use multiple hooks together in a comprehensive keyholder interface:

```typescript
import { 
  useKeyholderSystem, 
  useAdminSession, 
  useKeyholderRewards,
  useKeyholderSession,
  useMultiWearer 
} from './hooks/keyholder';

function ComprehensiveKeyholderInterface() {
  const keyholderSystem = useKeyholderSystem();
  const multiWearer = useMultiWearer();
  
  // Use admin session for the currently selected relationship
  const selectedRelationshipId = keyholderSystem.selectedRelationship?.id;
  const adminSession = useAdminSession(selectedRelationshipId || '');
  const rewards = useKeyholderRewards(selectedRelationshipId || '');
  const sessionControl = useKeyholderSession(selectedRelationshipId || '');

  // Only show controls if admin session is active
  const showControls = adminSession.isActive && selectedRelationshipId;

  return (
    <div>
      <h1>Keyholder Control Panel</h1>
      
      {/* Overview Stats */}
      <div>
        <h2>Overview</h2>
        <p>Total Relationships: {multiWearer.totalRelationships}</p>
        <p>Active Sessions: {multiWearer.activeSessions}</p>
        <p>Requires Attention: {multiWearer.requiresAttention}</p>
      </div>

      {/* Relationship Selection */}
      <div>
        <h2>Select Relationship</h2>
        {keyholderSystem.activeRelationships.map(rel => (
          <button 
            key={rel.id}
            onClick={() => keyholderSystem.switchActiveRelationship(rel.id)}
          >
            {rel.submissiveUserId}
            {keyholderSystem.selectedRelationship?.id === rel.id && ' (Selected)'}
          </button>
        ))}
      </div>

      {/* Admin Session Management */}
      {selectedRelationshipId && (
        <div>
          <h2>Admin Session</h2>
          {adminSession.isActive ? (
            <div>
              <p>Session Active - {Math.ceil(adminSession.timeRemaining / 60)} min left</p>
              <button onClick={adminSession.endSession}>End Session</button>
            </div>
          ) : (
            <button onClick={() => adminSession.startSession(selectedRelationshipId)}>
              Start Admin Session
            </button>
          )}
        </div>
      )}

      {/* Controls (only when admin session is active) */}
      {showControls && (
        <div>
          <h2>Session Control</h2>
          {sessionControl.isActive ? (
            <div>
              <p>Duration: {sessionControl.sessionDuration}s</p>
              <p>Progress: {sessionControl.goalProgress}%</p>
              <button onClick={() => sessionControl.pauseSession('Admin pause')}>
                Pause
              </button>
              <button onClick={() => sessionControl.stopSession()}>
                Stop
              </button>
            </div>
          ) : (
            <button onClick={() => sessionControl.startSession(selectedRelationshipId)}>
              Start Session
            </button>
          )}

          <h2>Rewards & Punishments</h2>
          <button onClick={() => rewards.reduceSessionTime(30, 'Good behavior')}>
            Reward (-30 min)
          </button>
          <button onClick={() => rewards.addSessionTime(60, 'Rule violation')}>
            Punishment (+60 min)
          </button>
        </div>
      )}

      {/* Bulk Operations */}
      <div>
        <h2>Bulk Operations</h2>
        <button onClick={() => multiWearer.bulkSendRewards(
          keyholderSystem.activeRelationships.map(r => r.id),
          'time_reduction_30',
          'Weekly reward'
        )}>
          Send Weekly Reward to All
        </button>
      </div>
    </div>
  );
}
```

## Key Benefits

1. **Modular Design**: Each hook handles a specific aspect of keyholder functionality
2. **Type Safety**: Full TypeScript coverage with comprehensive interfaces  
3. **Error Handling**: Consistent error patterns across all hooks
4. **Security**: Admin sessions, permission validation, and audit logging
5. **Scalability**: Efficient bulk operations for managing multiple relationships
6. **Real-time**: Live updates and monitoring capabilities
7. **Integration**: Works seamlessly with existing ChastityOS infrastructure

## Usage Guidelines

1. **Always start with `useKeyholderSystem`** - it provides the foundation
2. **Use `useAdminSession`** for any sensitive operations that need security boundaries
3. **Combine hooks strategically** - they're designed to work together
4. **Handle loading and error states** - all hooks provide consistent state management
5. **Respect permissions** - always check permissions before performing actions
6. **Log important actions** - use the audit logging features for transparency