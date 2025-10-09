/**
 * KeyholderSessionControls - Sub-component for session control buttons
 */

import React from "react";
import { useKeyholderContext } from "./KeyholderContext";
import { SessionControls } from "../SessionControls";

export const KeyholderSessionControls: React.FC = () => {
  const { submissiveSession, isKeyholderModeUnlocked } = useKeyholderContext();

  // Only show if keyholder mode is unlocked
  if (!isKeyholderModeUnlocked) return null;

  return <SessionControls session={submissiveSession} />;
};
