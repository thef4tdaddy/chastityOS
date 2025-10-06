// API hooks index - exports all TanStack Query hooks
export {
  useCurrentSession,
  useSessionHistory,
  useSessionMutations,
} from "./useSessionQuery";
export {
  useTasksQuery,
  usePendingTasksQuery,
  useTaskMutations,
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useSubmitTaskForReview,
  useApproveTask,
  useRejectTask,
  useAssignTask,
} from "./useTaskQuery";
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
  useCreatePersonalGoal,
  useUpdatePersonalGoal,
  useUpdateGoalProgress,
  useCompletePersonalGoal,
  useDeletePersonalGoal,
  useCreateKeyholderDuration,
  useUpdateKeyholderDuration,
} from "./usePersonalGoalQueries";
export { useReportData, useGoalsQuery } from "./useReportData";
export {
  useEmergencyPinStatus,
  useSetEmergencyPin,
  useRemoveEmergencyPin,
  useValidateEmergencyPin,
  useHasEmergencyPin,
} from "./useEmergencyPin";
export {
  useLockCombination,
  useSaveLockCombination,
  useDeleteLockCombination,
} from "./useLockCombination";
