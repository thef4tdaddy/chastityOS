/**
 * ChastityOS Database - Dexie Implementation
 * Comprehensive local database with sync capabilities
 * Based on issue #104 specifications
 */
import Dexie, { type Table, type Version, type Transaction } from "dexie";
import {
  DBUser,
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
  DBSettings,
  DBSyncMeta,
  SyncStatus,
  QueuedOperation,
  // New achievement types
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  DBAchievementNotification,
  DBLeaderboardEntry,
  // Release request type
  DBReleaseRequest,
  // User stats type
  DBUserStats,
} from "@/types/database";
import { KeyholderRule } from "@/types/core";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("ChastityDB");

export class ChastityDB extends Dexie {
  // Define all tables with proper typing
  users!: Table<DBUser>;
  sessions!: Table<DBSession>;
  events!: Table<DBEvent>;
  tasks!: Table<DBTask>;
  goals!: Table<DBGoal>;
  settings!: Table<DBSettings>;
  syncMeta!: Table<DBSyncMeta>;
  offlineQueue!: Table<QueuedOperation<any>>;

  // New achievement tables
  achievements!: Table<DBAchievement>;
  userAchievements!: Table<DBUserAchievement>;
  achievementProgress!: Table<DBAchievementProgress>;
  achievementNotifications!: Table<DBAchievementNotification>;
  leaderboardEntries!: Table<DBLeaderboardEntry>;

  // Rules table
  rules!: Table<KeyholderRule>;

  // Release requests table
  releaseRequests!: Table<DBReleaseRequest>;

  // User stats table
  userStats!: Table<DBUserStats>;

  // Emergency PINs table
  emergencyPins!: Table<{
    userId: string;
    hashedPin: string;
    createdAt: Date;
    lastModified: Date;
  }>;

  // Lock combinations table (for hardcore mode)
  lockCombinations!: Table<{
    id: string;
    userId: string;
    sessionId: string;
    encryptedCombination: string;
    createdAt: Date;
    lastModified: Date;
    syncStatus: string;
  }>;

  // Explicitly declare Dexie methods we use to fix TypeScript issues

  declare verno: number;
  declare tables: Table<unknown>[];
  declare version: (versionNumber: number) => Version;

  constructor() {
    super("ChastityOS");

    // Version 1: Initial schema
    this.version(1).stores({
      // Users with primary key uid
      users: "&uid, email, role, lastSync, createdAt",

      // Sessions with compound indexes for efficient queries
      sessions:
        "++id, &sessionId, userId, [userId+startTime], [userId+syncStatus], [userId+isPaused], startTime, endTime, isPaused, syncStatus, lastModified",

      // Events with indexes for timeline queries
      events:
        "++id, &eventId, userId, sessionId, [userId+timestamp], [userId+type], [userId+isPrivate], timestamp, type, isPrivate, syncStatus, lastModified",

      // Tasks with status and date indexes
      tasks:
        "++id, &taskId, userId, [userId+status], [userId+priority], [userId+createdAt], [userId+dueDate], status, priority, createdAt, dueDate, assignedBy, syncStatus, lastModified",

      // Goals with completion and type indexes
      goals:
        "++id, &goalId, userId, [userId+type], [userId+isCompleted], [userId+createdAt], type, isCompleted, createdAt, dueDate, createdBy, syncStatus, lastModified",

      // Settings per user
      settings: "&id, userId, syncStatus, lastModified",

      // Sync metadata
      syncMeta: "&collection, lastSync, lastFullSync",
    });

    // Version 2: Add offlineQueue table
    this.version(2).stores({
      offlineQueue: "++id,createdAt",
    });

    // Version 3: Add achievement system tables
    this.version(3).stores({
      // Master achievements list (system-wide)
      achievements:
        "&id, category, difficulty, isActive, isHidden, syncStatus, lastModified",

      // User-specific earned achievements
      userAchievements:
        "++id, &[userId+achievementId], userId, achievementId, isVisible, earnedAt, syncStatus, lastModified",

      // Achievement progress tracking
      achievementProgress:
        "++id, &[userId+achievementId], userId, achievementId, isCompleted, syncStatus, lastModified",

      // Achievement notifications
      achievementNotifications:
        "++id, userId, achievementId, isRead, type, createdAt, syncStatus, lastModified",

      // Leaderboard entries
      leaderboardEntries:
        "++id, &[userId+category+period], userId, category, period, rank, isAnonymous, syncStatus, lastModified",
    });

    // Version 4: Add rules table
    this.version(4).stores({
      // Keyholder rules
      rules:
        "&id, keyholderUserId, submissiveUserId, [keyholderUserId+isActive], [submissiveUserId+isActive], isActive, createdAt, syncStatus, lastModified",
    });

    // Version 5: Add release requests table
    this.version(5).stores({
      // Release requests for "Beg for Release" workflow
      releaseRequests:
        "&id, submissiveUserId, keyholderUserId, sessionId, [keyholderUserId+status], [sessionId+status], status, requestedAt, syncStatus, lastModified",
    });

    // Version 6: Add emergency PINs table
    this.version(6).stores({
      // Emergency PINs for hardcore mode safety
      emergencyPins: "&userId, createdAt, lastModified",
    });

    // Version 7: Add lock combinations table
    this.version(7).stores({
      // Lock combinations encrypted with emergency PIN (for hardcore mode)
      lockCombinations:
        "&id, userId, sessionId, [userId+sessionId], syncStatus, lastModified",
    });

    // Version 8: Add user stats table
    this.version(8).stores({
      // User stats for tracking points and task completion
      userStats:
        "&id, userId, totalPoints, tasksCompleted, syncStatus, lastModified",
    });

    // Add hooks for automatic timestamp and sync status updates
    this.sessions.hook(
      "creating",
      (_primKey: any, obj: DBSession, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating session", { id: obj.id, userId: obj.userId });
      },
    );

    // Cast to any to satisfy Dexie hook overloads for "updating"
    (this.sessions as any).hook(
      "updating",
      (
        modifications: Partial<DBSession>,
        primKey: any,
        _obj?: DBSession,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Updating session", { id: primKey, modifications });
      },
    );

    this.events.hook(
      "creating",
      (_primKey: any, obj: DBEvent, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating event", { id: obj.id, type: obj.type });
      },
    );

    (this.events as any).hook(
      "updating",
      (
        modifications: Partial<DBEvent>,
        _primKey: any,
        _obj?: DBEvent,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.tasks.hook(
      "creating",
      (_primKey: any, obj: DBTask, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating task", { id: obj.id, text: obj.text });
      },
    );

    (this.tasks as any).hook(
      "updating",
      (
        modifications: Partial<DBTask>,
        _primKey: any,
        _obj?: DBTask,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.goals.hook(
      "creating",
      (_primKey: any, obj: DBGoal, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating goal", { id: obj.id, title: obj.title });
      },
    );

    (this.goals as any).hook(
      "updating",
      (
        modifications: Partial<DBGoal>,
        _primKey: any,
        _obj?: DBGoal,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.settings.hook(
      "creating",
      (_primKey: any, obj: DBSettings, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating settings", { userId: obj.userId });
      },
    );

    (this.settings as any).hook(
      "updating",
      (
        modifications: Partial<DBSettings>,
        _primKey: any,
        _obj?: DBSettings,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // Achievement table hooks
    this.achievements.hook(
      "creating",
      (_primKey: any, obj: DBAchievement, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating achievement", { id: obj.id, name: obj.name });
      },
    );

    (this.achievements as any).hook(
      "updating",
      (
        modifications: Partial<DBAchievement>,
        _primKey: any,
        _obj?: DBAchievement,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.userAchievements.hook(
      "creating",
      (_primKey: any, obj: DBUserAchievement, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating user achievement", {
          userId: obj.userId,
          achievementId: obj.achievementId,
        });
      },
    );

    (this.userAchievements as any).hook(
      "updating",
      (
        modifications: Partial<DBUserAchievement>,
        _primKey: any,
        _obj?: DBUserAchievement,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.achievementProgress.hook(
      "creating",
      (_primKey: any, obj: DBAchievementProgress, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating achievement progress", {
          userId: obj.userId,
          achievementId: obj.achievementId,
        });
      },
    );

    (this.achievementProgress as any).hook(
      "updating",
      (
        modifications: Partial<DBAchievementProgress>,
        _primKey: any,
        _obj?: DBAchievementProgress,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.achievementNotifications.hook(
      "creating",
      (_primKey: any, obj: DBAchievementNotification, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating achievement notification", {
          userId: obj.userId,
          type: obj.type,
        });
      },
    );

    (this.achievementNotifications as any).hook(
      "updating",
      (
        modifications: Partial<DBAchievementNotification>,
        _primKey: any,
        _obj?: DBAchievementNotification,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.leaderboardEntries.hook(
      "creating",
      (_primKey: any, obj: DBLeaderboardEntry, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating leaderboard entry", {
          userId: obj.userId,
          category: obj.category,
        });
      },
    );

    (this.leaderboardEntries as any).hook(
      "updating",
      (
        modifications: Partial<DBLeaderboardEntry>,
        _primKey: any,
        _obj?: DBLeaderboardEntry,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // Rules table hooks
    this.rules.hook(
      "creating",
      (_primKey: any, obj: KeyholderRule, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating rule", { id: obj.id, title: obj.title });
      },
    );

    // Removed unused @ts-expect-error and cast table for updating hook
    (this.rules as any).hook(
      "updating",
      (
        modifications: Partial<KeyholderRule>,
        _primKey: any,
        _obj?: KeyholderRule,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // Release requests table hooks
    this.releaseRequests.hook(
      "creating",
      (_primKey: any, obj: DBReleaseRequest, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating release request", {
          id: obj.id,
          sessionId: obj.sessionId,
        });
      },
    );

    (this.releaseRequests as any).hook(
      "updating",
      (
        modifications: Partial<DBReleaseRequest>,
        _primKey: any,
        _obj?: DBReleaseRequest,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // User stats table hooks
    this.userStats.hook(
      "creating",
      (_primKey: any, obj: DBUserStats, _trans?: Transaction) => {
        obj.lastModified = new Date();
        if (!obj.syncStatus) {
          obj.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Creating user stats", { userId: obj.userId });
      },
    );

    (this.userStats as any).hook(
      "updating",
      (
        modifications: Partial<DBUserStats>,
        _primKey: any,
        _obj?: DBUserStats,
        _trans?: Transaction,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // Global error handler
    this.on("ready", () => {
      logger.info("ChastityOS database ready", {
        version: this.verno,
        tables: this.tables.length,
      });
    });

    this.on("blocked", () => {
      logger.warn("Database blocked - another tab has a newer version");
    });

    this.on("versionchange", (event) => {
      logger.info("Database version change detected", { event });
    });
  }

  /**
   * Initialize database with default data
   */
  async initialize(): Promise<void> {
    try {
      logger.debug("Initializing database");

      // Check if database is already initialized
      const syncMeta = await this.syncMeta.count();
      if (syncMeta > 0) {
        logger.debug("Database already initialized");
        return;
      }

      // Initialize sync metadata for all collections
      const collections = [
        "users",
        "sessions",
        "events",
        "tasks",
        "goals",
        "settings",
        // New achievement collections
        "achievements",
        "userAchievements",
        "achievementProgress",
        "achievementNotifications",
        "leaderboardEntries",
        // Rules collection
        "rules",
        // Release requests collection
        "releaseRequests",
        // User stats collection
        "userStats",
      ];

      for (const collection of collections) {
        await this.syncMeta.add({
          collection,
          lastSync: new Date(0), // Epoch date for initial sync
          pendingOperations: [],
          conflicts: [],
          totalDocuments: 0,
        });
      }

      logger.info("Database initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize database", { error: error as Error });
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const stats = {
      users: await this.users.count(),
      sessions: await this.sessions.count(),
      events: await this.events.count(),
      tasks: await this.tasks.count(),
      goals: await this.goals.count(),
      settings: await this.settings.count(),
      // New achievement stats
      achievements: await this.achievements.count(),
      userAchievements: await this.userAchievements.count(),
      achievementProgress: await this.achievementProgress.count(),
      achievementNotifications: await this.achievementNotifications.count(),
      leaderboardEntries: await this.leaderboardEntries.count(),
      // Rules stats
      rules: await this.rules.count(),
      // Release requests stats
      releaseRequests: await this.releaseRequests.count(),
      // User stats
      userStats: await this.userStats.count(),
      pendingSync: {
        sessions: await this.sessions
          .where("syncStatus")
          .equals("pending")
          .count(),
        events: await this.events.where("syncStatus").equals("pending").count(),
        tasks: await this.tasks.where("syncStatus").equals("pending").count(),
        goals: await this.goals.where("syncStatus").equals("pending").count(),
        settings: await this.settings
          .where("syncStatus")
          .equals("pending")
          .count(),
        // Achievement sync status
        achievements: await this.achievements
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
        userAchievements: await this.userAchievements
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
        achievementProgress: await this.achievementProgress
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
        achievementNotifications: await this.achievementNotifications
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
        leaderboardEntries: await this.leaderboardEntries
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
        // Rules sync status
        rules: await this.rules
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
        // Release requests sync status
        releaseRequests: await this.releaseRequests
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
        // User stats sync status
        userStats: await this.userStats
          .where("syncStatus")
          .equals("pending" as SyncStatus)
          .count(),
      },
    };

    logger.debug("Database statistics", stats);
    return stats;
  }

  /**
   * Clear all user data (for logout/reset)
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      logger.info("Clearing all data for user", { userId });

      await this.transaction(
        "rw",
        [
          this.users,
          this.sessions,
          this.events,
          this.tasks,
          this.goals,
          this.settings,
          this.userAchievements,
          this.achievementProgress,
          this.achievementNotifications,
          this.leaderboardEntries,
          this.rules,
          this.releaseRequests,
          this.userStats,
        ],
        async () => {
          await this.users.where("uid").equals(userId).delete();
          await this.sessions.where("userId").equals(userId).delete();
          await this.events.where("userId").equals(userId).delete();
          await this.tasks.where("userId").equals(userId).delete();
          await this.goals.where("userId").equals(userId).delete();
          await this.settings.where("userId").equals(userId).delete();
          // Clear user-specific achievement data
          await this.userAchievements.where("userId").equals(userId).delete();
          await this.achievementProgress
            .where("userId")
            .equals(userId)
            .delete();
          await this.achievementNotifications
            .where("userId")
            .equals(userId)
            .delete();
          await this.leaderboardEntries.where("userId").equals(userId).delete();
          // Clear user-specific rules (both as keyholder and submissive)
          await this.rules.where("keyholderUserId").equals(userId).delete();
          await this.rules.where("submissiveUserId").equals(userId).delete();
          // Clear release requests (both as keyholder and submissive)
          await this.releaseRequests
            .where("keyholderUserId")
            .equals(userId)
            .delete();
          await this.releaseRequests
            .where("submissiveUserId")
            .equals(userId)
            .delete();
          // Clear user stats
          await this.userStats.where("userId").equals(userId).delete();
        },
      );

      logger.info("User data cleared successfully", { userId });
    } catch (error) {
      logger.error("Failed to clear user data", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

// Create and export the singleton database instance
export const db = new ChastityDB();
