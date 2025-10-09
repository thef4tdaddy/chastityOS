/**
 * Keyholder - Main compound component for keyholder dashboard
 * Provides shared context to all sub-components
 */

import React, { ReactNode } from "react";
import KeyholderContext from "./KeyholderContext";
import type { KeyholderContextValue } from "./KeyholderContext";
import { KeyholderHeader } from "./KeyholderHeader";
import { KeyholderRelationshipsList } from "./KeyholderRelationshipsList";
import { KeyholderSessionControls } from "./KeyholderSessionControls";
import { KeyholderTaskManagement } from "./KeyholderTaskManagement";
import { KeyholderSettings } from "./KeyholderSettings";

interface KeyholderProps {
  children: ReactNode;
  value: KeyholderContextValue;
}

/**
 * Main Keyholder component that provides context to all sub-components
 * Usage:
 * <Keyholder value={keyholderContextValue}>
 *   <Keyholder.Header />
 *   <Keyholder.RelationshipsList />
 *   <Keyholder.SessionControls />
 *   <Keyholder.TaskManagement />
 *   <Keyholder.Settings />
 * </Keyholder>
 */
export const Keyholder = ({ children, value }: KeyholderProps) => {
  return (
    <KeyholderContext.Provider value={value}>
      {children}
    </KeyholderContext.Provider>
  );
};

// Attach sub-components to Keyholder
Keyholder.Header = KeyholderHeader;
Keyholder.RelationshipsList = KeyholderRelationshipsList;
Keyholder.SessionControls = KeyholderSessionControls;
Keyholder.TaskManagement = KeyholderTaskManagement;
Keyholder.Settings = KeyholderSettings;
