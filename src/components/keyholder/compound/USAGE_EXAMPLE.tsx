/**
 * Usage Example: Keyholder Compound Component
 *
 * This file demonstrates how to use the Keyholder compound component
 * in a real application. Copy and adapt this pattern for your own use.
 */

import React from "react";
import { Keyholder } from "./index";
import type { KeyholderContextValue } from "./KeyholderContext";

/**
 * Example: Basic Keyholder Usage
 *
 * This shows the minimal setup needed to use the Keyholder component
 */
export const BasicKeyholderExample = () => {
  // In a real application, you would get this data from hooks
  const keyholderContextValue: KeyholderContextValue = {
    keyholderUserId: "keyholder-123",
    relationships: [],
    keyholderRelationships: [],
    selectedRelationship: null,
    selectedWearerId: null,
    setSelectedWearer: (_id) => {
      // Implementation would go here
    },
    submissiveSession: null,
    sessionLoading: false,
    isKeyholderModeUnlocked: false,
    lockKeyholderControls: () => {
      // Implementation would go here
    },
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

/**
 * Example: Custom Layout
 *
 * Sub-components can be arranged in any order or layout
 */
export const CustomLayoutExample = () => {
  const keyholderContextValue: KeyholderContextValue = {
    keyholderUserId: "keyholder-123",
    relationships: [],
    keyholderRelationships: [],
    selectedRelationship: null,
    selectedWearerId: null,
    setSelectedWearer: () => {},
    submissiveSession: null,
    sessionLoading: false,
    isKeyholderModeUnlocked: false,
    lockKeyholderControls: () => {},
    setSubmissiveSession: () => {},
    keyholderControls: null,
    setKeyholderControls: () => {},
    isLoading: false,
    error: null,
    /* ... context value ... */
  } as KeyholderContextValue;

  return (
    <Keyholder value={keyholderContextValue}>
      <div className="max-w-6xl mx-auto p-4">
        {/* Header section */}
        <div className="mb-6">
          <Keyholder.Header />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <Keyholder.RelationshipsList />
            <Keyholder.SessionControls />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Keyholder.TaskManagement />
            <Keyholder.Settings />
          </div>
        </div>
      </div>
    </Keyholder>
  );
};

/**
 * Example: Conditional Rendering
 *
 * You can conditionally render sub-components based on state
 */
export const ConditionalRenderingExample = () => {
  const keyholderContextValue: KeyholderContextValue = {
    keyholderUserId: "keyholder-123",
    isKeyholderModeUnlocked: true,
    keyholderRelationships: [
      /* ... relationships ... */
    ],
    relationships: [],
    selectedRelationship: null,
    selectedWearerId: null,
    setSelectedWearer: () => {},
    submissiveSession: null,
    sessionLoading: false,
    lockKeyholderControls: () => {},
    setSubmissiveSession: () => {},
    keyholderControls: null,
    setKeyholderControls: () => {},
    isLoading: false,
    error: null,
    /* ... rest of context value ... */
  } as KeyholderContextValue;

  return (
    <Keyholder value={keyholderContextValue}>
      <Keyholder.Header />

      {/* Only show if multiple relationships */}
      {keyholderContextValue.keyholderRelationships.length > 1 && (
        <Keyholder.RelationshipsList />
      )}

      {/* Only show when unlocked */}
      {keyholderContextValue.isKeyholderModeUnlocked && (
        <>
          <Keyholder.SessionControls />
          <Keyholder.TaskManagement />
          <Keyholder.Settings />
        </>
      )}
    </Keyholder>
  );
};

/**
 * Example: With Real Hooks
 *
 * This shows how to integrate with real application hooks
 */
export const RealWorldExample = () => {
  // These hooks would be imported from your actual hook files
  // import { useAuthState } from '@/contexts';
  // import { useKeyholderStore } from '@/stores/keyholderStore';
  // import { useAccountLinking } from '@/hooks/account-linking/useAccountLinking';

  // Example hook usage (commented out to avoid import errors)
  /*
  const { user } = useAuthState();
  const isKeyholderModeUnlocked = useKeyholderStore(
    (state) => state.isKeyholderModeUnlocked
  );
  const lockKeyholderControls = useKeyholderStore(
    (state) => state.lockKeyholderControls
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

  const { submissiveSession, loading } = useSubmissiveData(selectedRelationship);

  const keyholderContextValue: KeyholderContextValue = {
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
  */

  // Placeholder return for this example file
  return <div>See commented code above for real implementation</div>;
};

/**
 * Example: Creating Custom Sub-Components
 *
 * You can create your own sub-components that use the context
 */
import { useKeyholderContext } from "./KeyholderContext";

const CustomKeyholderComponent = () => {
  const { keyholderUserId, isKeyholderModeUnlocked } = useKeyholderContext();

  return (
    <div className="custom-keyholder-display">
      <p>Keyholder ID: {keyholderUserId}</p>
      <p>Status: {isKeyholderModeUnlocked ? "Unlocked" : "Locked"}</p>
    </div>
  );
};

export const CustomSubComponentExample = () => {
  const keyholderContextValue: KeyholderContextValue = {
    keyholderUserId: "keyholder-123",
    relationships: [],
    keyholderRelationships: [],
    selectedRelationship: null,
    selectedWearerId: null,
    setSelectedWearer: () => {},
    submissiveSession: null,
    sessionLoading: false,
    isKeyholderModeUnlocked: false,
    lockKeyholderControls: () => {},
    setSubmissiveSession: () => {},
    keyholderControls: null,
    setKeyholderControls: () => {},
    isLoading: false,
    error: null,
    /* ... context value ... */
  } as KeyholderContextValue;

  return (
    <Keyholder value={keyholderContextValue}>
      <Keyholder.Header />
      <CustomKeyholderComponent /> {/* Your custom component */}
      <Keyholder.SessionControls />
    </Keyholder>
  );
};
