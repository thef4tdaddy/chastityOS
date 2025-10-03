/**
 * Authentication Utilities
 * Query keys and helper functions for auth hooks
 */

// Query Keys
export const authKeys = {
  currentUser: ["auth", "currentUser"] as const,
  profile: (uid: string) => ["auth", "profile", uid] as const,
} as const;
