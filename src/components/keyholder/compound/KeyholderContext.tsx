/**
 * KeyholderContext - Shared context for Keyholder compound component
 * Provides keyholder data and controls to all sub-components
 */

import { createContext, useContext } from "react";
import type { DBSession } from "../../../types/database";
import type { AdminRelationship } from "../../../types/account-linking";

export interface KeyholderContextValue {
  // User info
  keyholderUserId?: string;

  // Relationships
  relationships: AdminRelationship[];
  keyholderRelationships: AdminRelationship[];
  selectedRelationship?: AdminRelationship | null;
  selectedWearerId: string | null;
  setSelectedWearer: (wearerId: string | null) => void;

  // Session data
  submissiveSession: DBSession | null;
  sessionLoading: boolean;

  // Access control
  isKeyholderModeUnlocked: boolean;
  lockKeyholderControls: () => void;
}

const KeyholderContext = createContext<KeyholderContextValue | null>(null);

export const useKeyholderContext = () => {
  const context = useContext(KeyholderContext);
  if (!context) {
    throw new Error(
      "useKeyholderContext must be used within a Keyholder component",
    );
  }
  return context;
};

export default KeyholderContext;
