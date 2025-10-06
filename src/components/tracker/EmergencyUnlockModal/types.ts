/**
 * Shared types for EmergencyUnlockModal components
 */
import type { EmergencyUnlockReason } from "../../../types/events";

export type ModalStage = "warning" | "reason" | "confirm";

export interface EmergencyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyUnlock: (
    reason: EmergencyUnlockReason,
    additionalNotes?: string,
  ) => Promise<void>;
  sessionId: string;
  isProcessing?: boolean;
  requirePin?: boolean;
}

/**
 * Helper to get reason description
 */
export const getReasonDescription = (reason: EmergencyUnlockReason): string => {
  const descriptions: Record<EmergencyUnlockReason, string> = {
    "Medical Emergency":
      "Health-related emergencies requiring immediate unlock",
    "Safety Concern": "Physical safety or security situations",
    "Equipment Malfunction": "Device failure or malfunction",
    "Urgent Situation": "Other urgent circumstances requiring unlock",
    Other: "Custom reason with additional details",
  };
  return descriptions[reason] || "";
};
