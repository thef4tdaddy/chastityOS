/**
 * Type definitions barrel export
 * Re-exports all type definitions for easy importing
 */

// Core types
export * from "./core";
export * from "./events";
export * from "./achievements";

// Account linking types
export * from "./account-linking";

// Relationship types
export * from "./relationships";

// Database types - explicitly export to avoid conflicts
export type {
  SyncStatus,
  DBBase,
  DBUser,
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
  DBSettings,
  SyncOperation,
  ConflictRecord,
  DBSyncMeta,
  QueuedOperation,
  SessionWithDuration,
  TaskWithStatus,
  GoalWithProgress,
  SessionFilters,
  EventFilters,
  TaskFilters,
  // New achievement database types
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  DBAchievementNotification,
  DBLeaderboardEntry,
  // Compatibility aliases
  UserSettings,
  Task,
} from "./database";

// Import and re-export achievement enums (as values for runtime usage)
export {
  AchievementCategory,
  AchievementDifficulty,
  LeaderboardCategory,
  LeaderboardPeriod,
} from "./achievements";

// Feedback types
export * from "./feedback";

// Re-export commonly used Firebase types
export type { Timestamp } from "firebase/firestore";
