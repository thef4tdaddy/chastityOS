/**
 * Settings Management Utilities
 * Query keys and helper functions for settings hooks
 */

// Query Keys
export const settingsKeys = {
  all: ["settings"] as const,
  user: (userId: string) => [...settingsKeys.all, "user", userId] as const,
  section: (userId: string, section: string) =>
    [...settingsKeys.user(userId), "section", section] as const,
} as const;
