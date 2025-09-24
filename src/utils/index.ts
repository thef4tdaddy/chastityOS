/**
 * Utility functions barrel export
 * Re-exports all utility functions for easy importing
 */

// Date and time formatting
export * from "./formatting/date";
export * from "./formatting/time";

// Helper utilities
export * from "./helpers/string";
export * from "./helpers/hash";

// Logging
export * from "./logging";

// Event types (will be moved to types folder)
export const EVENT_TYPES = [
  "Orgasm (Self)",
  "Orgasm (Partner)",
  "Ruined Orgasm",
  "Edging",
  "Tease & Denial",
  "Play Session",
  "Hygiene",
  "Medication",
  "Mood Entry",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
