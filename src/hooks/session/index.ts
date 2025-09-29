/**
 * Enhanced Session Hooks - Phase 2 Implementation
 * Export all session management hooks with enhanced features
 */

export {
  useSession,
  type EnhancedSessionState,
  type SessionContext,
  type KeyholderSessionControls,
} from "./useSession";
export {
  usePauseResume,
  type EnhancedPauseState,
  type CooldownState,
  type KeyholderOverrideCapabilities,
} from "./usePauseResume";
export {
  useSessionGoals,
  type SessionGoalsState,
  type SessionGoal,
  type GoalAnalytics,
} from "./useSessionGoals";
export {
  useSessionHistory,
  type SessionHistoryState,
  type HistoricalSession,
  type HistoryInsights,
} from "./useSessionHistory";
