/**
 * ChastityOS Database - Dexie Implementation
 * Comprehensive local database with sync capabilities
 * Based on issue #104 specifications
 */
import Dexie, { type Table, type Transaction, type Version } from "dexie";
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
  offlineQueue!: Table<QueuedOperation>;

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

  // Explicitly declare Dexie methods we use to fix TypeScript issues
  declare transaction: <T>(
    mode: string,
    tables: Table[],
    callback: (trans: Transaction) => T | Promise<T>,
  ) => Promise<T>;
  declare on: (
    eventName: string,
    callback: (...args: unknown[]) => void,
  ) => void;
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

    // Add hooks for automatic timestamp and sync status updates
    this.sessions.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating session", { id: obj.id, userId: obj.userId });
    });

    this.sessions.hook(
      "updating",
      (modifications: Partial<DBSession>, primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
        logger.debug("Updating session", { id: primKey, modifications });
      },
    );

    this.events.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating event", { id: obj.id, type: obj.type });
    });

    this.events.hook(
      "updating",
      (modifications: Partial<DBEvent>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.tasks.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating task", { id: obj.id, text: obj.text });
    });

    this.tasks.hook(
      "updating",
      (modifications: Partial<DBTask>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.goals.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating goal", { id: obj.id, title: obj.title });
    });

    this.goals.hook(
      "updating",
      (modifications: Partial<DBGoal>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.settings.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating settings", { userId: obj.userId });
    });

    this.settings.hook(
      "updating",
      (modifications: Partial<DBSettings>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // Achievement table hooks
    this.achievements.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating achievement", { id: obj.id, name: obj.name });
    });

    this.achievements.hook(
      "updating",
      (modifications: Partial<DBAchievement>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.userAchievements.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating user achievement", {
        userId: obj.userId,
        achievementId: obj.achievementId,
      });
    });

    this.userAchievements.hook(
      "updating",
      (modifications: Partial<DBUserAchievement>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.achievementProgress.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating achievement progress", {
        userId: obj.userId,
        achievementId: obj.achievementId,
      });
    });

    this.achievementProgress.hook(
      "updating",
      (
        modifications: Partial<DBAchievementProgress>,
        _primKey,
        _obj,
        _trans,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.achievementNotifications.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating achievement notification", {
        userId: obj.userId,
        type: obj.type,
      });
    });

    this.achievementNotifications.hook(
      "updating",
      (
        modifications: Partial<DBAchievementNotification>,
        _primKey,
        _obj,
        _trans,
      ) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    this.leaderboardEntries.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating leaderboard entry", {
        userId: obj.userId,
        category: obj.category,
      });
    });

    this.leaderboardEntries.hook(
      "updating",
      (modifications: Partial<DBLeaderboardEntry>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // Rules table hooks
    this.rules.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating rule", { id: obj.id, title: obj.title });
    });

    this.rules.hook(
      "updating",
      (modifications: Partial<KeyholderRule>, _primKey, _obj, _trans) => {
        modifications.lastModified = new Date();
        if (!modifications.syncStatus) {
          modifications.syncStatus = "pending" as SyncStatus;
        }
      },
    );

    // Release requests table hooks
    this.releaseRequests.hook("creating", (_primKey, obj, _trans) => {
      obj.lastModified = new Date();
      if (!obj.syncStatus) {
        obj.syncStatus = "pending" as SyncStatus;
      }
      logger.debug("Creating release request", {
        id: obj.id,
        sessionId: obj.sessionId,
      });
    });

    this.releaseRequests.hook(
      "updating",
      (modifications: Partial<DBReleaseRequest>, _primKey, _obj, _trans) => {
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
          .equals("pending")
          .count(),
        userAchievements: await this.userAchievements
          .where("syncStatus")
          .equals("pending")
          .count(),
        achievementProgress: await this.achievementProgress
          .where("syncStatus")
          .equals("pending")
          .count(),
        achievementNotifications: await this.achievementNotifications
          .where("syncStatus")
          .equals("pending")
          .count(),
        leaderboardEntries: await this.leaderboardEntries
          .where("syncStatus")
          .equals("pending")
          .count(),
        // Rules sync status
        rules: await this.rules.where("syncStatus").equals("pending").count(),
        // Release requests sync status
        releaseRequests: await this.releaseRequests
          .where("syncStatus")
          .equals("pending")
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
