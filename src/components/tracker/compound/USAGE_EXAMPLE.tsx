/**
 * Usage Example: Tracker Compound Component
 *
 * This file demonstrates how to use the Tracker compound component
 * in a real application. Copy and adapt this pattern for your own use.
 */

import React from "react";
import { Tracker } from "./index";
import type { TrackerContextValue } from "./TrackerContext";

/**
 * Example: Basic Tracker Usage
 *
 * This shows the minimal setup needed to use the Tracker component
 */
export const BasicTrackerExample = () => {
  // In a real application, you would get this data from hooks
  const trackerContextValue: TrackerContextValue = {
    session: null,
    isActive: false,
    isPaused: false,
    sessionId: undefined,
    userId: "user-123",
    duration: 0,
    goals: {
      active: [],
      keyholderAssigned: [],
    },
    personalGoal: null,
    keyholderGoal: null,
    isHardcoreMode: false,
    totalChastityTime: 0,
    totalCageOffTime: 0,
    controls: {
      start: async () => {
        // Implementation would go here
      },
      end: async (_reason) => {
        // Implementation would go here
      },
      pause: async (_reason) => {
        // Implementation would go here
      },
      resume: async () => {
        // Implementation would go here
      },
    },
    canPause: true,
    cooldownRemaining: undefined,
    isStarting: false,
    isEnding: false,
    handleEmergencyUnlock: async () => {
      // Implementation would go here
    },
  };

  return (
    <Tracker value={trackerContextValue}>
      <Tracker.Header />
      <Tracker.StatusDisplay />
      <Tracker.Controls />
      <Tracker.Stats />
    </Tracker>
  );
};

/**
 * Example: Custom Layout
 *
 * Sub-components can be arranged in any order or layout
 */
export const CustomLayoutExample = () => {
  const trackerContextValue: TrackerContextValue = {
    /* ... context value ... */
  } as TrackerContextValue;

  return (
    <Tracker value={trackerContextValue}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <Tracker.Header />
          <Tracker.StatusDisplay />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Tracker.Controls />
          <Tracker.Stats />
        </div>
      </div>
    </Tracker>
  );
};

/**
 * Example: Conditional Rendering
 *
 * You can conditionally render sub-components based on state
 */
export const ConditionalRenderingExample = () => {
  const trackerContextValue: TrackerContextValue = {
    isActive: true,
    isPaused: false,
    /* ... rest of context value ... */
  } as TrackerContextValue;

  const showStats = true; // Could be from user settings

  return (
    <Tracker value={trackerContextValue}>
      <Tracker.Header />
      <Tracker.StatusDisplay />

      {/* Only show controls if session is active */}
      {trackerContextValue.isActive && <Tracker.Controls />}

      {/* Conditionally show stats */}
      {showStats && <Tracker.Stats />}
    </Tracker>
  );
};

/**
 * Example: With Real Hooks
 *
 * This shows how to integrate with real application hooks
 */
export const RealWorldExample = () => {
  // These hooks would be imported from your actual hook files
  // import { useTrackerData } from '@/hooks/tracker/useTrackerData';
  // import { useTrackerSession } from '@/hooks/tracker/useTrackerSession';

  // Example hook usage (commented out to avoid import errors)
  /*
  const {
    user,
    isActive,
    isPaused,
    sessionId,
    duration,
    goals,
    personalGoal,
    keyholderGoal,
    isHardcoreMode,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    canPause,
    cooldownRemaining,
    isStarting,
    isEnding,
    lifetimeStats,
  } = useTrackerData(true);

  const {
    currentSession,
    handleEmergencyUnlock,
  } = useTrackerSession(user?.uid);

  const trackerContextValue: TrackerContextValue = {
    session: currentSession,
    isActive,
    isPaused,
    sessionId,
    userId: user?.uid,
    duration,
    goals,
    personalGoal,
    keyholderGoal,
    isHardcoreMode,
    totalChastityTime: lifetimeStats.totalChastityTime,
    totalCageOffTime: lifetimeStats.totalCageOffTime,
    controls: {
      start: startSession,
      end: endSession,
      pause: pauseSession,
      resume: resumeSession,
    },
    canPause,
    cooldownRemaining,
    isStarting,
    isEnding,
    handleEmergencyUnlock,
  };

  return (
    <Tracker value={trackerContextValue}>
      <Tracker.Header />
      <Tracker.StatusDisplay />
      <Tracker.Controls />
      <Tracker.Stats />
    </Tracker>
  );
  */

  // Placeholder return for this example file
  return <div>See commented code above for real implementation</div>;
};

/**
 * Example: Creating Custom Sub-Components
 *
 * You can create your own sub-components that use the context
 */
import { useTrackerContext } from "./TrackerContext";

const CustomTrackerComponent = () => {
  const { isActive, duration } = useTrackerContext();

  return (
    <div className="custom-tracker-display">
      <p>Session Status: {isActive ? "Active" : "Inactive"}</p>
      <p>Duration: {duration}s</p>
    </div>
  );
};

export const CustomSubComponentExample = () => {
  const trackerContextValue: TrackerContextValue = {
    /* ... context value ... */
  } as TrackerContextValue;

  return (
    <Tracker value={trackerContextValue}>
      <Tracker.Header />
      <CustomTrackerComponent /> {/* Your custom component */}
      <Tracker.Controls />
    </Tracker>
  );
};
