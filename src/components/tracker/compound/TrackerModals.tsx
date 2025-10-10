/**
 * TrackerModals - Sub-component for modals (reason for removal, pause reason, etc.)
 */

import React from "react";
import { ReasonModals } from "../ReasonModals";

interface TrackerModalsProps {
  // These props are passed from the page level since they involve local state
  showReasonModal?: boolean;
  onCancelRemoval?: () => void;
  onConfirmRemoval?: () => void;
  reasonForRemoval?: string;
  onReasonChange?: (reason: string) => void;

  showPauseReasonModal?: boolean;
  onCancelPause?: () => void;
  onConfirmPause?: () => void;
  pauseReason?: string;
  onPauseReasonChange?: (reason: string) => void;
}

/**
 * TrackerModals component
 * Note: This component still requires props because modal state
 * is typically managed at the page level. This is intentional
 * to maintain flexibility in how modals are triggered.
 */
export const TrackerModals: React.FC<TrackerModalsProps> = ({
  showReasonModal,
  onCancelRemoval,
  onConfirmRemoval,
  reasonForRemoval,
  onReasonChange,
  showPauseReasonModal,
  onCancelPause,
  onConfirmPause,
  pauseReason,
  onPauseReasonChange,
}) => {
  return (
    <ReasonModals
      showReasonModal={showReasonModal ?? false}
      onCancelRemoval={onCancelRemoval}
      onConfirmRemoval={onConfirmRemoval}
      reasonForRemoval={reasonForRemoval}
      onReasonChange={onReasonChange}
      showPauseReasonModal={showPauseReasonModal ?? false}
      onCancelPause={onCancelPause}
      onConfirmPause={onConfirmPause}
      pauseReason={pauseReason}
      onPauseReasonChange={onPauseReasonChange}
    />
  );
};
