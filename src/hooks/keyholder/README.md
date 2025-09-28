# Keyholder System Hooks - Phase 1 Implementation

This directory contains the 5 critical keyholder system hooks that enable core dual-account functionality for ChastityOS 4.0.

## 🎯 Hooks Overview

### 1. `useKeyholderSystem` - Unified Keyholder Management
**File**: `useKeyholderSystem.ts`  
**Purpose**: Provides unified management interface for all keyholder functionality. Acts as the primary entry point for keyholder operations.

**Key Features**:
- Relationship lifecycle management (create invites, accept/remove submissives)
- Admin session integration
- Multi-relationship support
- Dashboard stats and overview data
- Permission validation system

```typescript
const {
  activeRelationships,
  adminSession,
  keyholderStatus,
  stats,
  createInviteCode,
  startAdminSession,
  switchActiveRelationship
} = useKeyholderSystem(keyholderId);
```

### 2. `useAdminSession` - Admin Session Management
**File**: `useAdminSession.ts`  
**Purpose**: Manages secure admin sessions with time limits, permission boundaries, and audit logging.

**Key Features**:
- Time-bounded sessions (default 30 minutes)
- Granular permission checking
- Activity tracking and auto-extension
- Comprehensive audit logging
- Security warnings and timeout handling

```typescript
const {
  session,
  isActive,
  timeRemaining,
  startSession,
  endSession,
  validatePermission,
  hasPermission
} = useAdminSession(relationshipId, keyholderId);
```

### 3. `useKeyholderRewards` - Reward/Punishment System
**File**: `useKeyholderRewards.ts`  
**Purpose**: Manages rewards and punishments, time modifications, achievements, and task assignments.

**Key Features**:
- Time modification system with safety limits
- Achievement integration
- Task assignment functionality
- Comprehensive audit trail
- Cooldown system to prevent abuse

```typescript
const {
  availableRewards,
  availablePunishments,
  applyReward,
  applyPunishment,
  addSessionTime,
  awardAchievement,
  isInCooldown
} = useKeyholderRewards(relationshipId, keyholderId);
```

### 4. `useKeyholderSession` - Session Control from Keyholder
**File**: `useKeyholderSession.ts`  
**Purpose**: Provides session control capabilities from the keyholder perspective with real-time monitoring.

**Key Features**:
- Full session control (start/stop/pause/resume)
- Goal management and modification
- Override powers for emergency situations
- Real-time monitoring and stats
- Session history and analytics

```typescript
const {
  session,
  controlOptions,
  liveStats,
  startSession,
  stopSession,
  modifyGoals,
  emergencyUnlock,
  sessionDuration
} = useKeyholderSession(relationshipId, keyholderId);
```

### 5. `useMultiWearer` - Multiple Submissive Management
**File**: `useMultiWearer.ts`  
**Purpose**: Manages multiple submissive relationships with bulk operations and comparative analytics.

**Key Features**:
- Relationship switching interface
- Bulk operations (sessions, tasks, rewards, messages)
- Comparative analytics and stats
- Broadcast communication
- Progress tracking for bulk operations

```typescript
const {
  relationships,
  activeRelationship,
  overviewStats,
  switchToRelationship,
  bulkStartSessions,
  sendBroadcastMessage,
  getComparativeStats
} = useMultiWearer(keyholderId);
```

## 🔧 Usage Example

Here's how to use multiple hooks together in a React component:

```typescript
import React from 'react';
import {
  useKeyholderSystem,
  useAdminSession,
  useKeyholderRewards,
  useMultiWearer
} from '../hooks/keyholder';

const KeyholderDashboard = ({ keyholderId }) => {
  // Main system hook
  const {
    activeRelationships,
    keyholderStatus,
    stats
  } = useKeyholderSystem(keyholderId);

  // Multi-wearer management
  const {
    activeRelationship,
    switchToRelationship,
    overviewStats
  } = useMultiWearer(keyholderId);

  // Admin session for active relationship
  const {
    session: adminSession,
    startSession: startAdminSession,
    hasPermission
  } = useAdminSession(activeRelationship?.id, keyholderId);

  // Rewards system for active relationship
  const {
    availableRewards,
    applyReward,
    isInCooldown
  } = useKeyholderRewards(activeRelationship?.id, keyholderId);

  return (
    <div className="keyholder-dashboard">
      <h1>Keyholder Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="stats">
        <p>Active Relationships: {stats.activeRelationships}</p>
        <p>Active Sessions: {overviewStats.totalActiveSessions}</p>
      </div>

      {/* Relationship Switcher */}
      <select 
        value={activeRelationship?.id || ''} 
        onChange={(e) => switchToRelationship(e.target.value)}
      >
        {activeRelationships.map(rel => (
          <option key={rel.id} value={rel.id}>
            {rel.submissiveName || `Relationship ${rel.id}`}
          </option>
        ))}
      </select>

      {/* Admin Session Controls */}
      {activeRelationship && (
        <div className="admin-controls">
          {!adminSession ? (
            <button onClick={() => startAdminSession(activeRelationship.id)}>
              Start Admin Session
            </button>
          ) : (
            <div>
              <p>Admin Session Active</p>
              {hasPermission('reward_punishment') && (
                <div className="rewards">
                  {availableRewards.map(reward => (
                    <button
                      key={reward.id}
                      onClick={() => applyReward(reward.id)}
                      disabled={isInCooldown}
                    >
                      {reward.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## 🔄 Integration with Existing Code

These hooks are designed to work alongside the existing `useKeyholderHandlers` hook:

```typescript
// Existing pattern
const keyholderHandlers = useKeyholderHandlers({...});

// New pattern - can be used together
const keyholderSystem = useKeyholderSystem(keyholderId);
const adminSession = useAdminSession(relationshipId, keyholderId);
```

## 🔐 Security Features

All hooks implement comprehensive security features:

- **Permission Validation**: Every operation checks keyholder permissions
- **Audit Logging**: All actions are logged with timestamps and reasons
- **Session Management**: Time-bounded admin sessions with automatic expiration
- **Rate Limiting**: Cooldown periods prevent abuse of reward/punishment system
- **Emergency Controls**: Emergency unlock capabilities with required justification

## 🚀 Next Steps

1. **Integration**: Update existing keyholder components to use these hooks
2. **Testing**: Add comprehensive unit and integration tests
3. **Documentation**: Add detailed JSDoc comments
4. **Migration**: Create migration guide from existing keyholder system

## 📊 Technical Specifications

- **Total Implementation**: ~67,000 characters across 5 hooks
- **Type Safety**: 40+ TypeScript interfaces for complete type coverage
- **Real-time Updates**: Firebase Firestore integration with live snapshots
- **Error Handling**: Comprehensive error boundaries and loading states
- **Performance**: Optimized with useMemo and useCallback for expensive operations