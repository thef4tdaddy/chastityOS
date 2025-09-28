# Enhanced Hooks System

This directory contains the enhanced hooks system for ChastityOS, providing advanced multi-user functionality with keyholder integration.

## Architecture Overview

### Directory Structure
```
hooks/
├── session/           # Session management hooks
│   ├── useSession.ts           # Enhanced session management
│   ├── usePauseResume.ts       # Advanced pause/resume system
│   ├── useSessionGoals.ts      # Goal management with keyholder controls
│   └── useSessionHistory.ts    # Historical session data with privacy
├── data/              # Data management hooks
│   ├── useStatistics.ts        # Comprehensive statistics
│   └── useDataSync.ts          # Enhanced synchronization
├── chastity/          # Legacy/compatibility hooks
│   └── keyholderHandlers.js    # Existing keyholder handlers
└── README.md
```

## Enhanced Hooks

### 1. useSession - Enhanced Session Management
**File**: `src/hooks/session/useSession.ts`

Comprehensive session management with multi-user support, keyholder integration, and advanced analytics.

**Key Features**:
- Multi-user session contexts (self-managed, keyholder-managed, collaborative)
- Real-time session tracking with goal integration
- Keyholder control and override capabilities
- Predictive analytics and session insights
- Request system for keyholder approvals

**Usage Example**:
```typescript
import { useSession } from '../hooks/session/useSession';

const MyComponent = () => {
  const {
    session,
    context,
    keyholderControls,
    startSession,
    stopSession,
    isActive,
    duration,
    goalProgress
  } = useSession('user123', 'relationship456');

  const handleStartSession = async () => {
    const goals = [/* session goals */];
    await startSession(goals);
  };

  return (
    <div>
      <p>Session Active: {isActive ? 'Yes' : 'No'}</p>
      <p>Duration: {duration} seconds</p>
      <button onClick={handleStartSession}>Start Session</button>
    </div>
  );
};
```

### 2. usePauseResume - Enhanced Pause/Resume System
**File**: `src/hooks/session/usePauseResume.ts`

Advanced pause/resume functionality with intelligent cooldowns, keyholder overrides, and comprehensive analytics.

**Key Features**:
- Smart cooldown management with adaptive duration
- Emergency pause requests with justification
- Keyholder force pause/resume capabilities
- Pause pattern analysis and optimization
- Override request system

**Usage Example**:
```typescript
import { usePauseResume } from '../hooks/session/usePauseResume';

const PauseControls = () => {
  const {
    pauseStatus,
    cooldownState,
    pauseSession,
    resumeSession,
    requestEmergencyPause,
    canPause,
    canResume
  } = usePauseResume('session123', 'relationship456');

  return (
    <div>
      <button 
        onClick={() => pauseSession('comfort')} 
        disabled={!canPause}
      >
        Pause Session
      </button>
      <button 
        onClick={resumeSession} 
        disabled={!canResume}
      >
        Resume Session
      </button>
      {cooldownState.isInCooldown && (
        <p>Cooldown: {cooldownState.cooldownRemaining}s remaining</p>
      )}
    </div>
  );
};
```

### 3. useSessionGoals - Goal Management System
**File**: `src/hooks/session/useSessionGoals.ts`

Comprehensive goal management supporting both self-set and keyholder-assigned goals with progress tracking.

**Key Features**:
- Dual goal sources (self-set and keyholder-assigned)
- Real-time progress tracking with milestones
- Goal templates and intelligent suggestions
- Achievement system with rarity levels
- Analytics and difficulty progression

**Usage Example**:
```typescript
import { useSessionGoals } from '../hooks/session/useSessionGoals';

const GoalManager = () => {
  const {
    activeGoals,
    progress,
    setGoal,
    updateProgress,
    getSuggestedGoals,
    completionRate
  } = useSessionGoals('user123', 'relationship456');

  const handleCreateGoal = async () => {
    await setGoal({
      type: 'duration',
      category: 'endurance',
      target: { value: 60, unit: 'minutes', comparison: 'minimum' },
      priority: 'high'
    });
  };

  return (
    <div>
      <h3>Active Goals ({activeGoals.length})</h3>
      <p>Completion Rate: {completionRate}%</p>
      {activeGoals.map(goal => (
        <div key={goal.id}>
          <span>{goal.type} - {goal.progress}%</span>
        </div>
      ))}
      <button onClick={handleCreateGoal}>Add Goal</button>
    </div>
  );
};
```

### 4. useSessionHistory - Historical Data Management
**File**: `src/hooks/session/useSessionHistory.ts`

Comprehensive session history with privacy controls, analytics, and keyholder access management.

**Key Features**:
- Granular privacy controls for data sharing
- Advanced search and filtering capabilities
- Historical trends and pattern analysis
- GDPR-compliant data export
- Keyholder dashboard views

**Usage Example**:
```typescript
import { useSessionHistory } from '../hooks/session/useSessionHistory';

const HistoryDashboard = () => {
  const {
    sessions,
    insights,
    trends,
    getSessionsByDateRange,
    exportPersonalData,
    totalSessions,
    averageSessionLength
  } = useSessionHistory('user123', 'relationship456');

  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentSessions = getSessionsByDateRange(lastWeek, new Date());

  return (
    <div>
      <h3>Session History</h3>
      <p>Total Sessions: {totalSessions}</p>
      <p>Average Length: {Math.round(averageSessionLength / 60)} minutes</p>
      <p>Recent Sessions: {recentSessions.length}</p>
      <button onClick={exportPersonalData}>Export Data</button>
    </div>
  );
};
```

### 5. useStatistics - Comprehensive Analytics
**File**: `src/hooks/data/useStatistics.ts`

Advanced statistics and analytics system with predictive insights and keyholder dashboards.

**Key Features**:
- Multi-dimensional analytics (sessions, goals, achievements)
- Predictive insights and recommendations
- Comparative analysis with benchmarks
- Keyholder dashboard with relationship metrics
- Privacy-controlled sharing

**Usage Example**:
```typescript
import { useStatistics } from '../hooks/data/useStatistics';

const StatsDashboard = () => {
  const {
    sessionStats,
    goalStats,
    getPredictiveInsights,
    getRecommendations,
    improvementScore,
    consistencyRating
  } = useStatistics('user123', 'relationship456');

  const insights = getPredictiveInsights();
  const recommendations = getRecommendations();

  return (
    <div>
      <h3>Statistics Overview</h3>
      <p>Total Sessions: {sessionStats.totalSessions}</p>
      <p>Goal Completion Rate: {goalStats.goalCompletionRate}%</p>
      <p>Improvement Score: {improvementScore}</p>
      <p>Consistency Rating: {consistencyRating}</p>
      
      <h4>Recommendations</h4>
      {recommendations.map(rec => (
        <div key={rec.id}>{rec.description}</div>
      ))}
    </div>
  );
};
```

### 6. useDataSync - Enhanced Synchronization
**File**: `src/hooks/data/useDataSync.ts`

Advanced data synchronization with multi-user support, conflict resolution, and privacy controls.

**Key Features**:
- Multi-user synchronization with relationship awareness
- Intelligent conflict detection and resolution
- Real-time sync with performance monitoring
- Backup and recovery system
- Privacy-controlled data sharing

**Usage Example**:
```typescript
import { useDataSync } from '../hooks/data/useDataSync';

const SyncManager = () => {
  const {
    syncStatus,
    conflicts,
    forceSyncAll,
    resolveConflict,
    getSyncHealth,
    isSyncing,
    hasConflicts
  } = useDataSync('user123');

  const health = getSyncHealth();

  return (
    <div>
      <h3>Data Synchronization</h3>
      <p>Status: {syncStatus.state}</p>
      <p>Health: {health.overallHealth}</p>
      {hasConflicts && <p>Conflicts: {conflicts.length}</p>}
      
      <button onClick={forceSyncAll} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Force Sync'}
      </button>
    </div>
  );
};
```

## Integration with Existing System

### Compatibility
- All enhanced hooks are designed to work alongside existing JavaScript hooks
- TypeScript interfaces provide strong typing without breaking existing code
- Gradual migration path from legacy hooks to enhanced hooks

### Usage Patterns
- Import enhanced hooks in new components
- Use existing hooks for backward compatibility
- Combine hooks for complex multi-user scenarios

### Performance Considerations
- Hooks use React best practices (useCallback, useMemo, etc.)
- Efficient state management with minimal re-renders
- Optimized for both single-user and multi-user scenarios

## Type System

All hooks are built with comprehensive TypeScript interfaces defined in `src/types/index.ts`:

- **Core Types**: UserInfo, SessionState, GoalState, etc.
- **Permission Types**: KeyholderPermission, SessionPermission, etc.
- **Analytics Types**: TrendData, StatisticsState, etc.
- **Sync Types**: ConflictResolution, SyncStatus, etc.

## Testing

Each hook should be tested with:
- Unit tests for hook logic
- Integration tests for hook composition
- Mock implementations for external dependencies
- Performance benchmarks for optimization

## Future Enhancements

- WebSocket integration for real-time features
- Advanced AI/ML for predictive analytics
- Enhanced privacy controls and encryption
- Mobile-specific optimizations
- Progressive Web App features

## Migration Guide

For migrating from existing hooks to enhanced hooks:

1. **Assessment**: Identify components using legacy hooks
2. **Planning**: Create migration timeline and priorities
3. **Implementation**: Gradual replacement with enhanced hooks
4. **Testing**: Comprehensive testing of migrated components
5. **Optimization**: Performance tuning and user experience improvements

## Support

For questions or issues with the enhanced hooks system:
- Review TypeScript interfaces in `src/types/index.ts`
- Check implementation examples in this README
- Refer to existing component usage patterns
- Consider backward compatibility requirements