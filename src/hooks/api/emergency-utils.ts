import type { EmergencyUnlockReason } from "../../types/events";

/**
 * Emergency System Utilities
 * Constants and helper functions for emergency hooks
 */

/**
 * Emergency unlock reasons with descriptions
 * Useful for UI dropdowns and validation
 */
export const EMERGENCY_REASONS: Record<
  EmergencyUnlockReason,
  { label: string; description: string }
> = {
  "Medical Emergency": {
    label: "Medical Emergency",
    description: "Health-related emergencies requiring immediate unlock",
  },
  "Safety Concern": {
    label: "Safety Concern",
    description: "Physical safety or security situations",
  },
  "Equipment Malfunction": {
    label: "Equipment Malfunction",
    description: "Device failure or malfunction",
  },
  "Urgent Situation": {
    label: "Urgent Situation",
    description: "Other urgent circumstances requiring unlock",
  },
  Other: {
    label: "Other",
    description: "Custom reason (additional notes required)",
  },
};
