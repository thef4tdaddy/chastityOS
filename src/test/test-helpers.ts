/**
 * Test Helper Utilities
 * Factory functions for creating properly typed mock objects for testing
 */

import type {
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
  DBUser,
  DBReleaseRequest,
  DBAchievement,
  DBUserAchievement,
  DBAchievementNotification,
  DBAchievementProgress,
  DBLeaderboardEntry,
  DBSettings,
  DBUserStats,
  SyncStatus,
  TaskStatus,
  EventType,
} from "../types/database";

// Helper to generate consistent IDs and timestamps
const createTestId = (prefix: string = "test") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const createTestDate = (offsetDays: number = 0) =>
  new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

/**
 * Create a complete DBSession mock object with all required fields
 */
export function createMockDBSession(
  overrides: Partial<DBSession> = {},
): DBSession {
  const now = new Date();
  const baseSession: DBSession = {
    id: createTestId("session"),
    userId: createTestId("user"),
    startTime: now,
    endTime: overrides.endTime ?? undefined,
    isPaused: overrides.isPaused ?? false,
    accumulatedPauseTime: overrides.accumulatedPauseTime ?? 0,
    isHardcoreMode: overrides.isHardcoreMode ?? false,
    keyholderApprovalRequired: overrides.keyholderApprovalRequired ?? false,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
    // Optional fields with defaults
    pauseStartTime: overrides.pauseStartTime,
    goalDuration: overrides.goalDuration,
    endReason: overrides.endReason,
    notes: overrides.notes,
    isEmergencyUnlock: overrides.isEmergencyUnlock,
    emergencyReason: overrides.emergencyReason,
    emergencyNotes: overrides.emergencyNotes,
    hasLockCombination: overrides.hasLockCombination,
    emergencyPinUsed: overrides.emergencyPinUsed,
  };

  return { ...baseSession, ...overrides };
}

/**
 * Create a complete DBEvent mock object with all required fields
 */
export function createMockDBEvent(overrides: Partial<DBEvent> = {}): DBEvent {
  const now = new Date();
  const baseEvent: DBEvent = {
    id: createTestId("event"),
    userId: createTestId("user"),
    type: overrides.type ?? "session_start",
    timestamp: overrides.timestamp ?? now,
    details: overrides.details ?? {
      action: "test_action",
      title: "Test Event",
    },
    isPrivate: overrides.isPrivate ?? false,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
    // Optional fields
    sessionId: overrides.sessionId,
  };

  return { ...baseEvent, ...overrides };
}

/**
 * Create a complete DBTask mock object with all required fields
 */
export function createMockDBTask(overrides: Partial<DBTask> = {}): DBTask {
  const now = new Date();
  const baseTask: DBTask = {
    id: createTestId("task"),
    userId: createTestId("user"),
    text: overrides.text ?? "Test task description",
    title: overrides.title,
    description: overrides.description,
    status: overrides.status ?? "pending",
    priority: overrides.priority ?? "medium",
    assignedBy: overrides.assignedBy ?? "submissive",
    category: overrides.category,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt,
    dueDate: overrides.dueDate,
    deadline: overrides.deadline,
    submittedAt: overrides.submittedAt,
    approvedAt: overrides.approvedAt,
    completedAt: overrides.completedAt,
    submissiveNote: overrides.submissiveNote,
    keyholderFeedback: overrides.keyholderFeedback,
    attachments: overrides.attachments ?? [],
    consequence: overrides.consequence,
    isRecurring: overrides.isRecurring ?? false,
    recurringConfig: overrides.recurringConfig,
    recurringSeriesId: overrides.recurringSeriesId,
    pointValue: overrides.pointValue,
    pointsAwarded: overrides.pointsAwarded ?? false,
    pointsAwardedAt: overrides.pointsAwardedAt,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseTask, ...overrides };
}

/**
 * Create a complete DBGoal mock object with all required fields
 */
export function createMockDBGoal(overrides: Partial<DBGoal> = {}): DBGoal {
  const now = new Date();
  const baseGoal: DBGoal = {
    id: createTestId("goal"),
    userId: createTestId("user"),
    type: overrides.type ?? "duration",
    title: overrides.title ?? "Test Goal",
    description: overrides.description,
    targetValue: overrides.targetValue ?? 3600, // 1 hour in seconds
    currentValue: overrides.currentValue ?? 0,
    progress: overrides.progress,
    unit: overrides.unit ?? "seconds",
    isCompleted: overrides.isCompleted ?? false,
    completedAt: overrides.completedAt,
    createdAt: overrides.createdAt ?? now,
    dueDate: overrides.dueDate,
    createdBy: overrides.createdBy ?? "submissive",
    isPublic: overrides.isPublic ?? false,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
    // Optional fields
    challengeType: overrides.challengeType,
    challengeYear: overrides.challengeYear,
    isSpecialChallenge: overrides.isSpecialChallenge,
    isHardcoreMode: overrides.isHardcoreMode,
    requiresEmergencyPin: overrides.requiresEmergencyPin,
  };

  return { ...baseGoal, ...overrides };
}

/**
 * Create a complete DBUser mock object with all required fields
 */
export function createMockDBUser(overrides: Partial<DBUser> = {}): DBUser {
  const now = new Date();
  const baseUser: DBUser = {
    id: createTestId("user"),
    userId: createTestId("user"),
    email: overrides.email ?? "test@example.com",
    displayName: overrides.displayName ?? "Test User",
    role: overrides.role ?? "submissive",
    profile: {
      submissiveName: overrides.profile?.submissiveName ?? "Test Submissive",
      keyholderName: overrides.profile?.keyholderName,
      timezone: overrides.profile?.timezone ?? "America/Chicago",
      preferences: {
        notifications: overrides.profile?.preferences?.notifications ?? true,
        publicProfile: overrides.profile?.preferences?.publicProfile ?? false,
        allowLinking: overrides.profile?.preferences?.allowLinking ?? true,
      },
    },
    verification: {
      emailVerified: overrides.verification?.emailVerified ?? true,
      phoneVerified: overrides.verification?.phoneVerified ?? false,
      identityVerified: overrides.verification?.identityVerified ?? false,
    },
    lastSync: overrides.lastSync ?? now,
    createdAt: overrides.createdAt ?? now,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseUser, ...overrides };
}

/**
 * Create a complete DBReleaseRequest mock object
 */
export function createMockDBReleaseRequest(
  overrides: Partial<DBReleaseRequest> = {},
): DBReleaseRequest {
  const now = new Date();
  const baseRequest: DBReleaseRequest = {
    id: createTestId("release_request"),
    submissiveUserId: overrides.submissiveUserId ?? createTestId("user"),
    keyholderUserId: overrides.keyholderUserId ?? createTestId("user"),
    sessionId: overrides.sessionId ?? createTestId("session"),
    requestedAt: overrides.requestedAt ?? now,
    status: overrides.status ?? "pending",
    approvedAt: overrides.approvedAt,
    deniedAt: overrides.deniedAt,
    reason: overrides.reason ?? "Test release request",
    keyholderResponse: overrides.keyholderResponse,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseRequest, ...overrides };
}

/**
 * Create a complete DBAchievement mock object
 */
export function createMockDBAchievement(
  overrides: Partial<DBAchievement> = {},
): DBAchievement {
  const now = new Date();
  const baseAchievement: DBAchievement = {
    id: createTestId("achievement"),
    name: overrides.name ?? "Test Achievement",
    description: overrides.description ?? "A test achievement",
    category: overrides.category ?? "milestone",
    icon: overrides.icon ?? "🏆",
    difficulty: overrides.difficulty ?? "bronze",
    points: overrides.points ?? 100,
    requirements: overrides.requirements ?? [
      {
        type: "session_duration",
        value: 3600,
        unit: "seconds",
      },
    ],
    isHidden: overrides.isHidden ?? false,
    rarity: overrides.rarity,
    isActive: overrides.isActive ?? true,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseAchievement, ...overrides };
}

/**
 * Create a complete DBUserAchievement mock object
 */
export function createMockDBUserAchievement(
  overrides: Partial<DBUserAchievement> = {},
): DBUserAchievement {
  const now = new Date();
  const baseUserAchievement: DBUserAchievement = {
    id: createTestId("user_achievement"),
    userId: createTestId("user"),
    achievementId: overrides.achievementId ?? createTestId("achievement"),
    earnedAt: overrides.earnedAt ?? now,
    progress: overrides.progress ?? 100,
    metadata: overrides.metadata ?? {},
    isVisible: overrides.isVisible ?? true,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseUserAchievement, ...overrides };
}

/**
 * Create a complete DBAchievementNotification mock object
 */
export function createMockDBAchievementNotification(
  overrides: Partial<DBAchievementNotification> = {},
): DBAchievementNotification {
  const now = new Date();
  const baseNotification: DBAchievementNotification = {
    id: createTestId("achievement_notification"),
    userId: createTestId("user"),
    achievementId: overrides.achievementId ?? createTestId("achievement"),
    type: overrides.type ?? "earned",
    title: overrides.title ?? "Achievement Unlocked!",
    message: overrides.message ?? "You earned a new achievement",
    isRead: overrides.isRead ?? false,
    createdAt: overrides.createdAt ?? now,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseNotification, ...overrides };
}

/**
 * Create a complete DBAchievementProgress mock object
 */
export function createMockDBAchievementProgress(
  overrides: Partial<DBAchievementProgress> = {},
): DBAchievementProgress {
  const now = new Date();
  const baseProgress: DBAchievementProgress = {
    id: createTestId("achievement_progress"),
    userId: createTestId("user"),
    achievementId: overrides.achievementId ?? createTestId("achievement"),
    currentValue: overrides.currentValue ?? 50,
    targetValue: overrides.targetValue ?? 100,
    isCompleted: overrides.isCompleted ?? false,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseProgress, ...overrides };
}

/**
 * Create a complete DBLeaderboardEntry mock object
 */
export function createMockDBLeaderboardEntry(
  overrides: Partial<DBLeaderboardEntry> = {},
): DBLeaderboardEntry {
  const now = new Date();
  const baseEntry: DBLeaderboardEntry = {
    id: createTestId("leaderboard_entry"),
    userId: createTestId("user"),
    category: overrides.category ?? "total_chastity_time",
    period: overrides.period ?? "all_time",
    value: overrides.value ?? 1000,
    rank: overrides.rank ?? 1,
    displayName: overrides.displayName ?? "Test User",
    displayNameType: overrides.displayNameType ?? "username",
    isAnonymous: overrides.isAnonymous ?? false,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseEntry, ...overrides };
}

/**
 * Create a complete DBSettings mock object
 */
export function createMockDBSettings(
  overrides: Partial<DBSettings> = {},
): DBSettings {
  const now = new Date();
  const baseSettings: DBSettings = {
    id: createTestId("settings"),
    userId: createTestId("user"),
    theme: overrides.theme ?? "light",
    eventDisplayMode: overrides.eventDisplayMode,
    twoFactorEnabled: overrides.twoFactorEnabled ?? false,
    updatedAt: overrides.updatedAt,
    notifications: overrides.notifications ?? {
      enabled: true,
      sessionReminders: true,
      taskDeadlines: true,
      keyholderMessages: true,
      goalProgress: true,
      achievements: true,
    },
    privacy: {
      publicProfile: overrides.privacy?.publicProfile ?? false,
      shareStatistics: overrides.privacy?.shareStatistics ?? false,
      allowDataExport: overrides.privacy?.allowDataExport ?? true,
      shareAchievements: overrides.privacy?.shareAchievements ?? false,
    },
    chastity: {
      allowEmergencyUnlock: overrides.chastity?.allowEmergencyUnlock ?? true,
      emergencyUnlockCooldown:
        overrides.chastity?.emergencyUnlockCooldown ?? 24,
      requireKeyholderApproval:
        overrides.chastity?.requireKeyholderApproval ?? false,
      defaultSessionGoal: overrides.chastity?.defaultSessionGoal ?? 3600,
      hardcoreModeEnabled: overrides.chastity?.hardcoreModeEnabled ?? false,
    },
    display: {
      language: overrides.display?.language ?? "en",
      timezone: overrides.display?.timezone ?? "America/Chicago",
      dateFormat: overrides.display?.dateFormat ?? "MM/DD/YYYY",
      timeFormat: overrides.display?.timeFormat ?? "12h",
      startOfWeek: overrides.display?.startOfWeek ?? "monday",
    },
    achievements: {
      enableTracking: overrides.achievements?.enableTracking ?? true,
      showProgress: overrides.achievements?.showProgress ?? true,
      enableNotifications: overrides.achievements?.enableNotifications ?? true,
    },
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
    // Optional flat properties
    displayName: overrides.displayName,
    email: overrides.email,
    submissiveName: overrides.submissiveName,
    timezone: overrides.timezone,
    language: overrides.language,
    fontSize: overrides.fontSize,
    animations: overrides.animations ?? true,
    publicProfile: overrides.publicProfile,
    profileVisibility: overrides.profileVisibility,
    showStats: overrides.showStats,
    showAchievements: overrides.showAchievements,
    accountDiscoverable: overrides.accountDiscoverable,
    showActivityStatus: overrides.showActivityStatus,
    bio: overrides.bio,
    profileImageUrl: overrides.profileImageUrl,
    shareStatistics: overrides.shareStatistics,
    defaultGoalDuration: overrides.defaultGoalDuration,
    allowKeyholderOverride: overrides.allowKeyholderOverride,
    goalReminders: overrides.goalReminders,
    progressSharing: overrides.progressSharing,
    dataCollection: overrides.dataCollection,
    analytics: overrides.analytics,
    crashReporting: overrides.crashReporting,
    locationTracking: overrides.locationTracking,
    autoBackup: overrides.autoBackup,
    backupFrequency: overrides.backupFrequency,
    dataRetention: overrides.dataRetention,
    exportFormat: overrides.exportFormat,
    sessionTimeout: overrides.sessionTimeout,
    requirePasswordForSensitive: overrides.requirePasswordForSensitive,
    emergencyContacts: overrides.emergencyContacts,
    advancedLogging: overrides.advancedLogging,
    betaFeatures: overrides.betaFeatures,
    developmentMode: overrides.developmentMode,
    keyholderLinked: overrides.keyholderLinked,
    keyholderPermissions: overrides.keyholderPermissions,
    createdAt: overrides.createdAt,
  };

  return { ...baseSettings, ...overrides };
}

/**
 * Create a complete DBUserStats mock object
 */
export function createMockDBUserStats(
  overrides: Partial<DBUserStats> = {},
): DBUserStats {
  const now = new Date();
  const baseStats: DBUserStats = {
    id: createTestId("user_stats"),
    userId: createTestId("user"),
    totalPoints: overrides.totalPoints ?? 1000,
    tasksCompleted: overrides.tasksCompleted ?? 50,
    tasksApproved: overrides.tasksApproved ?? 45,
    tasksRejected: overrides.tasksRejected ?? 5,
    currentStreak: overrides.currentStreak ?? 7,
    longestStreak: overrides.longestStreak ?? 14,
    lastTaskCompletedAt: overrides.lastTaskCompletedAt ?? now,
    syncStatus: overrides.syncStatus ?? "synced",
    lastModified: overrides.lastModified ?? now,
  };

  return { ...baseStats, ...overrides };
}

/**
 * Create arrays of mock objects for testing
 */
export function createMockDBSessions(
  count: number = 3,
  overrides: Partial<DBSession> = {},
): DBSession[] {
  return Array.from({ length: count }, (_, index) => {
    const baseOverrides = {
      ...overrides,
      id: `${overrides.id ?? createTestId("session")}_${index}`,
    };
    return createMockDBSession(baseOverrides);
  });
}

export function createMockDBEvents(
  count: number = 3,
  overrides: Partial<DBEvent> = {},
): DBEvent[] {
  return Array.from({ length: count }, (_, index) => {
    const baseOverrides = {
      ...overrides,
      id: `${overrides.id ?? createTestId("event")}_${index}`,
    };
    return createMockDBEvent(baseOverrides);
  });
}

export function createMockDBTasks(
  count: number = 3,
  overrides: Partial<DBTask> = {},
): DBTask[] {
  return Array.from({ length: count }, (_, index) => {
    const baseOverrides = {
      ...overrides,
      id: `${overrides.id ?? createTestId("task")}_${index}`,
    };
    return createMockDBTask(baseOverrides);
  });
}

export function createMockDBGoals(
  count: number = 3,
  overrides: Partial<DBGoal> = {},
): DBGoal[] {
  return Array.from({ length: count }, (_, index) => {
    const baseOverrides = {
      ...overrides,
      id: `${overrides.id ?? createTestId("goal")}_${index}`,
    };
    return createMockDBGoal(baseOverrides);
  });
}

/**
 * Common test scenarios
 */
export const mockScenarios = {
  activeSession: (): DBSession =>
    createMockDBSession({
      isPaused: false,
      endTime: undefined,
    }),

  pausedSession: (): DBSession =>
    createMockDBSession({
      isPaused: true,
      pauseStartTime: new Date(),
      accumulatedPauseTime: 300, // 5 minutes
    }),

  completedSession: (): DBSession =>
    createMockDBSession({
      isPaused: false,
      endTime: new Date(Date.now() + 3600000), // 1 hour later
      endReason: "goal_completed",
    }),

  emergencyUnlockSession: (): DBSession =>
    createMockDBSession({
      isPaused: false,
      endTime: new Date(),
      isEmergencyUnlock: true,
      emergencyReason: "Medical emergency",
      emergencyNotes: "Required immediate removal",
      emergencyPinUsed: true,
    }),

  hardcoreModeSession: (): DBSession =>
    createMockDBSession({
      isPaused: false,
      isHardcoreMode: true,
      keyholderApprovalRequired: true,
    }),

  completedTask: (): DBTask =>
    createMockDBTask({
      status: "completed",
      completedAt: new Date(),
      pointsAwarded: true,
      pointsAwardedAt: new Date(),
    }),

  overdueTask: (): DBTask =>
    createMockDBTask({
      status: "pending",
      dueDate: new Date(Date.now() - 86400000), // Yesterday
    }),

  recurringTask: (): DBTask =>
    createMockDBTask({
      isRecurring: true,
      recurringConfig: {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [1], // Monday
        nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),

  durationGoal: (): DBGoal =>
    createMockDBGoal({
      type: "duration",
      targetValue: 86400, // 24 hours
      currentValue: 43200, // 12 hours
      unit: "seconds",
    }),

  taskCompletionGoal: (): DBGoal =>
    createMockDBGoal({
      type: "task_completion",
      targetValue: 10,
      currentValue: 7,
      unit: "tasks",
    }),

  specialChallengeGoal: (): DBGoal =>
    createMockDBGoal({
      type: "special_challenge",
      challengeType: "locktober",
      challengeYear: 2024,
      isSpecialChallenge: true,
    }),
};
