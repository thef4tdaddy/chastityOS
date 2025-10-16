/**
 * TrackerContext - Shared context for Tracker compound component
 * Provides session data and controls to all subcomponents
 */

import { createContext, useContext } from "react";
import type { DBSession, DBGoal } from "@/types/database";

export interface TrackerContextValue {
  // Session state
  session: DBSession | null;
  isActive: boolean;
  isPaused: boolean;
  sessionId?: string;
  userId?: string;
  duration?: number;

  // Goals
  goals?: {
    active: DBGoal[];
    keyholderAssigned: DBGoal[];
  };
  personalGoal?: DBGoal | null;
  keyholderGoal?: DBGoal | null;
  isHardcoreMode?: boolean;

  // Stats
  totalChastityTime: number;
  totalCageOffTime: number;

  // Session controls
  controls: {
    start: () => Promise<void>;
    end: (reason?: string) => Promise<void>;
    pause: (reason?: string) => Promise<void>;
    resume: () => Promise<void>;
  };

  // Pause state
  canPause: boolean;
  cooldownRemaining?: number;

  // Loading states
  isStarting: boolean;
  isEnding: boolean;

  // Emergency unlock
  handleEmergencyUnlock: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export const useTrackerContext = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error(
      "useTrackerContext must be used within a Tracker component",
    );
  }
  return context;
};

export default TrackerContext;
