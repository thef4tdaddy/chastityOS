/**
 * Tracker - Main compound component for chastity tracking
 * Provides shared context to all sub-components
 */

import React, { ReactNode } from "react";
import TrackerContext from "./TrackerContext";
import type { TrackerContextValue } from "./TrackerContext";
import { TrackerHeader } from "./TrackerHeader";
import { TrackerStatusDisplay } from "./TrackerStatusDisplay";
import { TrackerControls } from "./TrackerControls";
import { TrackerStats } from "./TrackerStats";
import { TrackerModals } from "./TrackerModals";

interface TrackerProps {
  children: ReactNode;
  value: TrackerContextValue;
}

/**
 * Main Tracker component that provides context to all sub-components
 * Usage:
 * <Tracker value={trackerContextValue}>
 *   <Tracker.Header />
 *   <Tracker.StatusDisplay />
 *   <Tracker.Controls />
 *   <Tracker.Stats />
 *   <Tracker.Modals />
 * </Tracker>
 */
export const Tracker = ({ children, value }: TrackerProps) => {
  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
};

// Attach sub-components to Tracker
Tracker.Header = TrackerHeader;
Tracker.StatusDisplay = TrackerStatusDisplay;
Tracker.Controls = TrackerControls;
Tracker.Stats = TrackerStats;
Tracker.Modals = TrackerModals;
