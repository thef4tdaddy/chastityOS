// Feature hooks index file
export { useGameification } from "./useGameification";
export { useGoals } from "./useGoals";
export { useReporting } from "./useReporting";
export { useLogEventForm } from "./useLogEventForm";
export { useRuleEditor } from "./useRuleEditor";
export { useManualEntry } from "./useManualEntry";
export { useAccountSettings } from "./useAccountSettings";
export { useDisplaySettings } from "./useDisplaySettings";
export { usePersonalGoals } from "./usePersonalGoals";

export type { EventFormData, UseLogEventFormReturn } from "./useLogEventForm";

export type {
  Rule,
  Condition,
  RuleAction,
  CreateRuleInput,
  UpdateRuleInput,
  ValidationResult,
  TestResult,
  UseRuleEditorReturn,
} from "./useRuleEditor";

export type { EntryFormData, UseManualEntryReturn } from "./useManualEntry";

export type {
  AccountData,
  UseAccountSettingsReturn,
} from "./useAccountSettings";

export type {
  DisplaySettings,
  UseDisplaySettingsReturn,
} from "./useDisplaySettings";

export type {
  PersonalGoal,
  CreateGoalInput,
  UpdateGoalInput,
  UsePersonalGoalsReturn,
} from "./usePersonalGoals";
