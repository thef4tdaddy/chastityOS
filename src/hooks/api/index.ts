// API hooks index - exports all TanStack Query hooks
export {
  useCurrentSession,
  useSessionHistory,
  useSessionMutations,
} from "./useSessionQuery";
export { useTasksQuery, useTaskMutations } from "./useTaskQuery";
export { useSettingsQuery, useSettingsMutations } from "./useSettingsQueries";
export {
  useEventHistory,
  useRecentEvents,
  useInfiniteEventHistory,
  useEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEventStats,
} from "./useEvents";
export {
  useOfflineQueueStats,
  useOfflineQueueOperations,
  useRetryableOperations,
} from "./useOfflineQueue";
export {
  useRulesQuery,
  useActiveRulesQuery,
  useRuleMutations,
} from "./useRuleQueries";
export {
  usePersonalGoalQuery,
  useKeyholderRequiredDurationQuery,
  usePersonalGoalMutations,
} from "./usePersonalGoalQueries";
