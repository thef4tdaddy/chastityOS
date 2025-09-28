// Keyholder System Hooks - Phase 1 Implementation
// ChastityOS 4.0 Critical Keyholder System Hooks

// Core system management
export { useKeyholderSystem } from './useKeyholderSystem';
export type {
  KeyholderRelationship,
  AdminSession,
  KeyholderStatus,
  KeyholderStats,
  InviteOptions,
  BulkOperations,
  AdminPermission,
  KeyholderSystemState,
  KeyholderSystemActions,
} from './useKeyholderSystem';

// Admin session management
export { useAdminSession } from './useAdminSession';
export type {
  AdminAction,
  AdminSessionActions,
} from './useAdminSession';

// Reward and punishment system
export { useKeyholderRewards } from './useKeyholderRewards';
export type {
  RewardAction,
  PunishmentAction,
  RewardImpact,
  PunishmentImpact,
  TaskAssignment,
  RewardPunishmentHistory,
  RewardPunishmentSettings,
  RewardPunishmentSystem,
} from './useKeyholderRewards';

// Session control from keyholder perspective
export { useKeyholderSession } from './useKeyholderSession';
export type {
  SessionState,
  SessionGoals,
  SessionProgress,
  PauseEvent,
  SessionSummary,
  LiveSessionStats,
  SessionControlOptions,
  CustomGoal,
} from './useKeyholderSession';

// Multiple submissive management
export { useMultiWearer } from './useMultiWearer';
export type {
  MultiWearerStats,
  ComparativeStats,
  RelationshipComparison,
  BulkOperation,
  BulkOperationStatus,
  BulkOperationResult,
  TaskTemplate,
  MultiWearerState,
  MultiWearerActions,
} from './useMultiWearer';

// Re-export commonly used types for convenience
export type {
  AdminPermission,
  KeyholderRelationship,
  SessionGoals,
  TaskAssignment,
  RewardAction,
  PunishmentAction,
} from './useKeyholderSystem';