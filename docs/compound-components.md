# Compound Component Patterns

This document describes the compound component pattern implementation in chastityOS.

## Overview

Compound components share an implicit state between parent and child components using React Context, eliminating prop drilling and creating more flexible APIs.

## Benefits

- **Reduced Prop Drilling**: No need to pass props through multiple levels
- **Flexible Composition**: Easy to rearrange, add, or remove sub-components
- **Better Encapsulation**: State is managed internally, not exposed
- **Improved Reusability**: Sub-components can be reused independently
- **Cleaner API**: More intuitive and easier to use

## Implemented Components

### Tracker Compound Component

The Tracker compound component manages chastity tracking session state and controls.

#### Basic Usage

```tsx
import { Tracker } from "@/components/tracker/compound";
import { useTrackerData } from "@/hooks/tracker/useTrackerData";
import { useTrackerSession } from "@/hooks/tracker/useTrackerSession";

const TrackerPage = () => {
  // Get tracker data from hooks
  const trackerData = useTrackerData(true);
  const sessionData = useTrackerSession(user?.uid);

  // Build context value
  const trackerContextValue = {
    session: sessionData.currentSession,
    isActive: trackerData.isActive,
    isPaused: trackerData.isPaused,
    sessionId: trackerData.sessionId,
    userId: user?.uid,
    duration: trackerData.duration,
    goals: trackerData.goals,
    personalGoal: trackerData.personalGoal,
    keyholderGoal: trackerData.keyholderGoal,
    isHardcoreMode: trackerData.isHardcoreMode,
    totalChastityTime: trackerData.lifetimeStats.totalChastityTime,
    totalCageOffTime: trackerData.lifetimeStats.totalCageOffTime,
    controls: {
      start: trackerData.startSession,
      end: trackerData.endSession,
      pause: trackerData.pauseSession,
      resume: trackerData.resumeSession,
    },
    canPause: trackerData.canPause,
    cooldownRemaining: trackerData.cooldownRemaining,
    isStarting: trackerData.isStarting,
    isEnding: trackerData.isEnding,
    handleEmergencyUnlock: sessionData.handleEmergencyUnlock,
  };

  return (
    <Tracker value={trackerContextValue}>
      <Tracker.Header />
      <Tracker.StatusDisplay />
      <Tracker.Controls />
      <Tracker.Stats />
      <Tracker.Modals
        showReasonModal={showReasonModal}
        onCancelRemoval={handleCancelRemoval}
        onConfirmRemoval={handleConfirmRemoval}
        reasonForRemoval={reasonForRemoval}
        onReasonChange={setReasonForRemoval}
      />
    </Tracker>
  );
};
```

#### Available Sub-Components

- **Tracker.Header** - Displays goal information and cooldown messages
- **Tracker.StatusDisplay** - Shows current session status and duration
- **Tracker.Controls** - Start/stop/pause/resume buttons
- **Tracker.Stats** - Lifetime statistics display
- **Tracker.Modals** - Modal dialogs for reasons and confirmations

#### Context API

All sub-components have access to the tracker context via `useTrackerContext()`:

```tsx
import { useTrackerContext } from "@/components/tracker/compound";

const CustomComponent = () => {
  const {
    isActive,
    isPaused,
    controls,
    session,
    // ... all other context values
  } = useTrackerContext();

  return <div>{/* Use context values */}</div>;
};
```

### Keyholder Compound Component

The Keyholder compound component manages keyholder dashboard state and controls.

#### Basic Usage

```tsx
import { Keyholder } from "@/components/keyholder/compound";
import { useAccountLinking } from "@/hooks/account-linking/useAccountLinking";
import { useKeyholderStore } from "@/stores/keyholderStore";

const KeyholderPage = () => {
  const { user } = useAuthState();
  const isKeyholderModeUnlocked = useKeyholderStore(
    (state) => state.isKeyholderModeUnlocked,
  );
  const lockKeyholderControls = useKeyholderStore(
    (state) => state.lockKeyholderControls,
  );

  const {
    relationships,
    keyholderRelationships,
    selectedWearerId,
    setSelectedWearer,
  } = useAccountLinking();

  const selectedRelationship = selectedWearerId
    ? relationships.find((r) => r.wearerId === selectedWearerId)
    : keyholderRelationships[0];

  const { submissiveSession, loading } =
    useSubmissiveData(selectedRelationship);

  const keyholderContextValue = {
    keyholderUserId: user?.uid,
    relationships,
    keyholderRelationships,
    selectedRelationship,
    selectedWearerId,
    setSelectedWearer,
    submissiveSession,
    sessionLoading: loading,
    isKeyholderModeUnlocked,
    lockKeyholderControls,
  };

  return (
    <Keyholder value={keyholderContextValue}>
      <Keyholder.Header />
      <Keyholder.RelationshipsList />
      <Keyholder.SessionControls />
      <Keyholder.TaskManagement />
      <Keyholder.Settings />
    </Keyholder>
  );
};
```

#### Available Sub-Components

- **Keyholder.Header** - Dashboard title and pending release requests
- **Keyholder.RelationshipsList** - Wearer selection dropdown
- **Keyholder.SessionControls** - Session control buttons for selected wearer
- **Keyholder.TaskManagement** - Task management interface
- **Keyholder.Settings** - Keyholder settings and lock controls

#### Context API

All sub-components have access to the keyholder context via `useKeyholderContext()`:

```tsx
import { useKeyholderContext } from "@/components/keyholder/compound";

const CustomComponent = () => {
  const {
    keyholderUserId,
    selectedRelationship,
    isKeyholderModeUnlocked,
    // ... all other context values
  } = useKeyholderContext();

  return <div>{/* Use context values */}</div>;
};
```

## Error Handling

Both compound components enforce proper usage:

```tsx
// ❌ This will throw an error
const BadComponent = () => {
  const context = useTrackerContext(); // Error: must be used within Tracker
  return <div>Bad</div>;
};

// ✅ This is correct
const GoodComponent = () => {
  return (
    <Tracker value={contextValue}>
      <MyComponent /> {/* Can use useTrackerContext here */}
    </Tracker>
  );
};
```

## Testing

Both compound components have comprehensive test coverage:

```tsx
import { render, screen } from "@testing-library/react";
import { Tracker } from "@/components/tracker/compound";

test("provides context to children", () => {
  const mockValue = createMockContextValue();

  render(
    <Tracker value={mockValue}>
      <Tracker.Header />
    </Tracker>,
  );

  // Test that sub-components render and have access to context
});
```

## Migration Guide

### Before (Prop Drilling)

```tsx
<TrackerPage
  isCageOn={isCageOn}
  handleToggleCage={handleToggleCage}
  showReasonModal={showReasonModal}
  setShowReasonModal={setShowReasonModal}
  pauseReason={pauseReason}
  setPauseReason={setPauseReason}
  isHardcoreMode={isHardcoreMode}
  sessionData={sessionData}
  // ... 15+ more props
/>
```

### After (Compound Components)

```tsx
<Tracker value={trackerContextValue}>
  <Tracker.Header />
  <Tracker.StatusDisplay />
  <Tracker.Controls />
  <Tracker.Stats />
  <Tracker.Modals {...modalProps} />
</Tracker>
```

## Best Practices

1. **Keep Context Focused**: Only include data that sub-components actually need
2. **Memoize Context Values**: Use `useMemo` to prevent unnecessary re-renders
3. **Handle Loading States**: Show appropriate loading UI while data is fetching
4. **Error Boundaries**: Wrap compound components in error boundaries
5. **Type Safety**: Always define proper TypeScript types for context values

## Future Components

The following components are candidates for the compound pattern:

- Task forms
- Settings forms
- Achievement gallery
- Full report display

## References

- [React Context API](https://react.dev/reference/react/useContext)
- [Compound Component Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
