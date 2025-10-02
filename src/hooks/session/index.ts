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
export { usePauseResume } from "./usePauseResume";
export type {
  EnhancedPauseState,
  CooldownState,
  KeyholderOverrideCapabilities,
} from "../../types/pauseResume";
export {
  useSessionGoals,
  type SessionGoalsState,
  type SessionGoal,
  type GoalAnalytics,
} from "./useSessionGoals";
export { useSessionHistory } from "./useSessionHistory";
export type * from "./types/sessionHistory";

// Phase 1 Hooks - Component Migration (#309)
export {
  useSessionLoader,
  type UseSessionLoaderReturn,
} from "./useSessionLoader";
export {
  useSessionActions,
  type UseSessionActionsReturn,
  type UseSessionActionsOptions,
  type SessionConfig,
} from "./useSessionActions";
