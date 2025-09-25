/**
 * Type definitions barrel export
 * Re-exports all type definitions for easy importing
 */

// Core types
export * from "./core";
export * from "./events";
export * from "./achievements";

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
} from "./database";

// Re-export commonly used Firebase types
export type { Timestamp } from "firebase/firestore";
