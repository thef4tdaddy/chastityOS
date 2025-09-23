/**
 * Standardized event types for programmatic logging throughout the application.
 * Using a named export to ensure consistency across all imports.
 */
export const eventTypes = {
  // Session Events
  SESSION_START: { type: "SESSION_START", text: "Session Started" },
  SESSION_END: { type: "SESSION_END", text: "Session Ended" },
  EMERGENCY_UNLOCK: { type: "EMERGENCY_UNLOCK", text: "Emergency Unlock Used" },

  // Personal Goal Events
  PERSONAL_GOAL_SET: { type: "PERSONAL_GOAL_SET", text: "Personal Goal Set" },
  PERSONAL_GOAL_COMPLETED: {
    type: "PERSONAL_GOAL_COMPLETED",
    text: "Personal Goal Completed",
  },
  PERSONAL_GOAL_REMOVED: {
    type: "PERSONAL_GOAL_REMOVED",
    text: "Personal Goal Removed",
  },

  // Task Events
  TASK_ADDED: { type: "TASK_ADDED", text: "Task Added" },
  TASK_COMPLETED: { type: "TASK_COMPLETED", text: "Task Completed" },
  TASK_DELETED: { type: "TASK_DELETED", text: "Task Deleted" },

  // Keyholder Events
  KEYHOLDER_SESSION_LOCKED: {
    type: "KEYHOLDER_SESSION_LOCKED",
    text: "Session Locked by Keyholder",
  },
  KEYHOLDER_SESSION_UNLOCKED: {
    type: "KEYHOLDER_SESSION_UNLOCKED",
    text: "Session Unlocked by Keyholder",
  },
  KEYHOLDER_TASK_APPROVED: {
    type: "KEYHOLDER_TASK_APPROVED",
    text: "Task Approved by Keyholder",
  },
  KEYHOLDER_TASK_REJECTED: {
    type: "KEYHOLDER_TASK_REJECTED",
    text: "Task Rejected by Keyholder",
  },
};

/**
 * Categories and events for the manual "Log Event" page dropdowns.
 */
export const EVENT_CATEGORIES = [
  {
    category: "Orgasm",
    events: ["Orgasm (Self)", "Orgasm (Partner)", "Ruined Orgasm"],
  },
  {
    category: "Chastity",
    events: ["Chastity Locked", "Chastity Removed"],
  },
  {
    category: "Other",
    events: ["Edge"],
  },
];
