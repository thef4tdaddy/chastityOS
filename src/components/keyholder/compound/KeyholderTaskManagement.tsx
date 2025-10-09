/**
 * KeyholderTaskManagement - Sub-component for task management
 */

import React from "react";
import { useKeyholderContext } from "./KeyholderContext";
import { TaskManagement } from "../TaskManagement";

export const KeyholderTaskManagement: React.FC = () => {
  const { isKeyholderModeUnlocked, selectedRelationship, keyholderUserId } =
    useKeyholderContext();

  // Only show if keyholder mode is unlocked
  if (!isKeyholderModeUnlocked) return null;

  // Use selected wearer ID or fall back to keyholder's own ID
  const userId = selectedRelationship?.wearerId || keyholderUserId || "";

  return <TaskManagement userId={userId} />;
};
