# Keyholder System Hooks

This directory contains the critical keyholder system hooks that provide the foundation for all keyholder functionality in ChastityOS 4.0.

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

## Hook Integration Example

Here's how to use multiple hooks together in a comprehensive keyholder interface:

```typescript
import {
  useKeyholderSystem,
  useAdminSession,
  useKeyholderRewards,
  useKeyholderSession
} from './hooks/keyholder';

function ComprehensiveKeyholderInterface() {
  const keyholderSystem = useKeyholderSystem();

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
