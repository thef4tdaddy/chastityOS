/**
 * Test Helpers
 * A collection of utility functions and mock data generators for testing purposes.
 */

import type { DBSession, DBTask, DBEvent, DBGoal } from "@/types/database";
import { TaskPriority } from "@/types";

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

/**
 * Generates a unique ID for mock documents.
 * @param prefix - A prefix for the ID (e.g., 'user', 'session').
 * @returns A unique string ID.
 */
export const generateUniqueId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Creates a mock DBSession object.
 * @param overrides - Partial data to override the defaults.
 * @returns A mock DBSession.
 */
export function createMockDBSession(
  overrides: Partial<DBSession> = {},
): DBSession {
  const id = overrides.id ?? generateUniqueId("session");
  const userId = overrides.userId ?? "test-user";
  const now = new Date();

  return {
    id,
    userId,
    startTime: now,
    isPaused: false,
    accumulatedPauseTime: 0,
    isHardcoreMode: false,
    keyholderApprovalRequired: false,
    syncStatus: "synced",
    lastModified: now,
    ...overrides,
  };
}

/**
 * Creates a mock DBTask object.
 * @param overrides - Partial data to override the defaults.
 * @returns A mock DBTask.
 */
export function createMockDBTask(overrides: Partial<DBTask> = {}): DBTask {
  const id = overrides.id ?? generateUniqueId("task");
  const userId = overrides.userId ?? "test-user";
  const now = new Date();

  return {
    id,
    userId,
    title: "Test Task",
    status: "pending",
    priority: TaskPriority.MEDIUM,
    assignedBy: "keyholder",
    createdAt: now,
    isRecurring: false,
    syncStatus: "synced",
    lastModified: now,
    text: "This is a test task",
    ...overrides,
  };
}

/**
 * Creates a mock DBEvent object.
 * @param overrides - Partial data to override the defaults.
 * @returns A mock DBEvent.
 */
export function createMockDBEvent(overrides: Partial<DBEvent> = {}): DBEvent {
  const id = overrides.id ?? generateUniqueId("event");
  const userId = overrides.userId ?? "test-user";
  const now = new Date();

  return {
    id,
    userId,
    type: "note",
    timestamp: now,
    details: {},
    isPrivate: false,
    syncStatus: "synced",
    lastModified: now,
    ...overrides,
  };
}

/**
 * Creates a mock DBGoal object.
 * @param overrides - Partial data to override the defaults.
 * @returns A mock DBGoal.
 */
export function createMockDBGoal(overrides: Partial<DBGoal> = {}): DBGoal {
  const id = overrides.id ?? generateUniqueId("goal");
  const userId = overrides.userId ?? "test-user";
  const now = new Date();

  return {
    id,
    userId,
    title: "Test Goal",
    type: "duration",
    targetValue: 86400, // 1 day
    currentValue: 0,
    unit: "seconds",
    isCompleted: false,
    createdAt: now,
    createdBy: "submissive",
    isPublic: false,
    syncStatus: "synced",
    lastModified: now,
    ...overrides,
  };
}

/**
 * Creates multiple mock DBSession objects.
 * @param count - Number of sessions to create.
 * @param overrides - Partial data to override the defaults for each session.
 * @returns An array of mock DBSession objects.
 */
export function createMockDBSessions(
  count: number,
  overrides: Partial<DBSession> = {},
): DBSession[] {
  return Array.from({ length: count }, (_, index) =>
    createMockDBSession({
      id: `session_${index + 1}`,
      ...overrides,
    }),
  );
}

/**
 * Creates multiple mock DBEvent objects.
 * @param count - Number of events to create.
 * @param overrides - Partial data to override the defaults for each event.
 * @returns An array of mock DBEvent objects.
 */
export function createMockDBEvents(
  count: number,
  overrides: Partial<DBEvent> = {},
): DBEvent[] {
  return Array.from({ length: count }, (_, index) =>
    createMockDBEvent({
      id: `event_${index + 1}`,
      ...overrides,
    }),
  );
}

/**
 * Creates multiple mock DBTask objects.
 * @param count - Number of tasks to create.
 * @param overrides - Partial data to override the defaults for each task.
 * @returns An array of mock DBTask objects.
 */
export function createMockDBTasks(
  count: number,
  overrides: Partial<DBTask> = {},
): DBTask[] {
  return Array.from({ length: count }, (_, index) =>
    createMockDBTask({
      id: `task_${index + 1}`,
      ...overrides,
    }),
  );
}

/**
 * Creates multiple mock DBGoal objects.
 * @param count - Number of goals to create.
 * @param overrides - Partial data to override the defaults for each goal.
 * @returns An array of mock DBGoal objects.
 */
export function createMockDBGoals(
  count: number,
  overrides: Partial<DBGoal> = {},
): DBGoal[] {
  return Array.from({ length: count }, (_, index) =>
    createMockDBGoal({
      id: `goal_${index + 1}`,
      ...overrides,
    }),
  );
}
