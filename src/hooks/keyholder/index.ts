/**
 * Keyholder Hooks Export
 * Centralized export for all keyholder system hooks
 */

// Core keyholder system hook - foundation for all others
export {
  useKeyholderSystem,
  type UseKeyholderSystemReturn,
  type KeyholderSystemState,
  type KeyholderSystemActions,
  type KeyholderStats,
  type KeyholderStatus,
  type AdminSession as KeyholderAdminSession,
  type InviteOptions,
  type BulkOperations,
} from "./useKeyholderSystem";

// Admin session management with security boundaries
export {
  useAdminSession,
  type UseAdminSessionReturn,
  type AdminSession,
  type AdminPermission,
  type AdminAction,
  type AdminSessionConfig,
  type AdminSessionState,
  type AdminSessionActions,
} from "./useAdminSession";

// Reward and punishment system
export {
  useKeyholderRewards,
  type UseKeyholderRewardsReturn,
  type RewardType,
  type PunishmentType,
  type RewardAction,
  type PunishmentAction,
  type RewardPunishmentHistory,
  type TaskAssignment,
  type RewardPunishmentSettings,
  type RewardPunishmentSystem,
  type RewardPunishmentState,
  type RewardPunishmentActions,
} from "./useKeyholderRewards";

// Session control from keyholder perspective
export {
  useKeyholderSession,
  type UseKeyholderSessionReturn,
  type SessionGoals,
  type SessionSummary,
  type LiveSessionStats,
  type SessionControlOptions,
  type EmergencyUnlockOptions,
  type KeyholderSessionControl,
  type KeyholderSessionState,
  type SessionActionResult,
  type KeyholderSessionActions,
} from "./useKeyholderSession";

// Multiple submissive management
export {
  useMultiWearer,
  type UseMultiWearerReturn,
  type MultiWearerStats,
  type RelationshipOverview,
  type BulkOperationStatus,
  type TaskTemplate,
  type ComparativeStats,
  type BulkMessage,
  type MultiWearerState,
  type MultiWearerActions,
} from "./useMultiWearer";

// Re-export commonly used types from core
export type {
  KeyholderRelationship,
  KeyholderPermissions,
} from "../../types/core";
