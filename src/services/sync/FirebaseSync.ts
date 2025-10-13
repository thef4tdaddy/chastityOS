/**
 * Firebase Sync Service
 * Main orchestrator for data synchronization between Dexie and Firebase
 */
import { serviceLogger } from "@/utils/logging";
import { getFirebaseAuth, getFirestore } from "@/services/firebase";
import { sessionDBService } from "@/services/database";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { doc, Timestamp, setDoc } from "firebase/firestore";
import type {
  SyncOptions,
  SyncResult,
  ConflictInfo,
  DBSession,
  SyncOperation,
} from "@/types/database";
import { connectionStatus } from "./connectionStatus";
import { offlineQueue } from "./OfflineQueue";
import { userSettingsSync } from "./UserSettingsSync";
import { sessionDataSync } from "./SessionDataSync";
import { eventDataSync } from "./EventDataSync";
import { taskDataSync } from "./TaskDataSync";
import { achievementDataSync } from "./AchievementDataSync";
import { relationshipDataSync } from "./RelationshipDataSync";
import { syncConflictResolver } from "./SyncConflictResolver";
import { NotificationService } from "@/services/notifications";

const logger = serviceLogger("FirebaseSync");

/**
 * Main Firebase Sync Orchestrator
 * Coordinates sync operations across all data types
 */
export class FirebaseSync {
  private isSyncing = false;

  constructor() {
    logger.info("FirebaseSync orchestrator initialized");
    connectionStatus.subscribe(async (isOnline) => {
      if (isOnline) {
        await this.processOfflineQueue();
      }
    });
  }

  /**
   * Main entry point for user data synchronization
   */
  async syncUserData(
    userId: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.warn("Sync already in progress");
      throw new Error("Sync already in progress");
    }

    if (!connectionStatus.getIsOnline()) {
      logger.warn("App is offline, skipping sync");
      throw new Error("App is offline");
    }

    await this.validateUser(userId);
    this.isSyncing = true;

    logger.info("Starting orchestrated data synchronization", {
      userId,
      options,
    });

    const result: SyncResult = {
      success: true,
      operations: {
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
      },
      conflicts: [],
      timestamp: new Date(),
    };

    try {
      // Process any pending offline operations first
      await this.processOfflineQueue();

      // Determine which collections to sync
      const collections = options.collections || [
        "sessions",
        "events",
        "tasks",
        "goals",
        "settings",
      ];

      // Sync each collection using dedicated services
      await this.syncCollections(collections, userId, result, options);

      logger.info("Orchestrated data synchronization completed", {
        userId,
        result: {
          uploaded: result.operations.uploaded,
          downloaded: result.operations.downloaded,
          conflicts: result.operations.conflicts,
        },
      });

      // Send sync completed notification if manual sync
      const totalOperations =
        result.operations.uploaded +
        result.operations.downloaded +
        result.operations.conflicts;

      NotificationService.notifySyncCompleted({
        userId,
        operationsCount: totalOperations,
        wasManualSync: options.force === true,
      }).catch((error) => {
        logger.warn("Failed to send sync completed notification", { error });
      });
    } catch (error) {
      result.success = false;
      result.error = error as Error;
      logger.error("Orchestrated data synchronization failed", {
        error: error as Error,
        userId,
      });

      // Send sync failed notification
      NotificationService.notifySyncFailed({
        userId,
        errorMessage: (error as Error).message,
        retryable: true,
      }).catch((err) => {
        logger.warn("Failed to send sync failed notification", { error: err });
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync specific collections using dedicated services
   */
  private async syncCollections(
    collections: string[],
    userId: string,
    result: SyncResult,
    options: SyncOptions,
  ): Promise<void> {
    for (const collection of collections) {
      try {
        const collectionResult = await this.syncSingleCollection(
          collection,
          userId,
          options,
        );
        this.mergeResults(result, collectionResult);
      } catch (error) {
        logger.error(`Failed to sync collection: ${collection}`, {
          error: error as Error,
          userId,
        });
        throw error;
      }
    }
  }

  /**
   * Sync a single collection using the appropriate service
   */
  private async syncSingleCollection(
    collectionName: string,
    userId: string,
    options: SyncOptions,
  ): Promise<SyncResult> {
    logger.debug(`Syncing collection: ${collectionName}`, { userId });

    switch (collectionName) {
      case "settings":
        return await userSettingsSync.syncCollection(userId, options);
      case "sessions":
        return await sessionDataSync.syncCollection(userId, options);
      case "events":
        return await eventDataSync.syncCollection(userId, options);
      case "tasks":
      case "goals":
        return await taskDataSync.syncCollection(userId, options);
      case "achievements":
        return await achievementDataSync.syncCollection(userId, options);
      case "relationships":
        return await relationshipDataSync.syncCollection(userId, options);
      default:
        logger.warn(`Unknown collection: ${collectionName}`);
        return {
          success: true,
          operations: { uploaded: 0, downloaded: 0, conflicts: 0 },
          conflicts: [],
          timestamp: new Date(),
        };
    }
  }

  /**
   * Merge results from individual collection syncs
   */
  private mergeResults(
    mainResult: SyncResult,
    collectionResult: SyncResult,
  ): void {
    mainResult.operations.uploaded += collectionResult.operations.uploaded;
    mainResult.operations.downloaded += collectionResult.operations.downloaded;
    mainResult.operations.conflicts += collectionResult.operations.conflicts;
    mainResult.conflicts.push(...collectionResult.conflicts);

    if (!collectionResult.success) {
      mainResult.success = false;
      if (collectionResult.error && !mainResult.error) {
        mainResult.error = collectionResult.error;
      }
    }
  }

  /**
   * Validate user authentication
   */
  private async validateUser(userId: string): Promise<Auth> {
    const auth = (await getFirebaseAuth()) as Auth;
    const user = auth.currentUser;

    if (!user || user.uid !== userId) {
      logger.warn("User not authenticated or mismatch", {
        userId,
        currentUser: user?.uid,
      });
      throw new Error("User not authenticated");
    }

    return auth;
  }

  /**
   * Get pending conflicts for manual resolution
   */
  getPendingConflicts(): ConflictInfo[] {
    return syncConflictResolver.getPendingConflicts();
  }

  /**
   * Clear resolved conflicts from queue
   */
  clearResolvedConflicts(resolvedConflictIds: string[]): void {
    syncConflictResolver.clearResolvedConflicts(resolvedConflictIds);
  }

  /**
   * Sync a single session to Firebase
   */
  async syncSingleSession(session: DBSession): Promise<void> {
    if (!connectionStatus.getIsOnline()) {
      logger.debug("Offline, queuing session sync");
      await offlineQueue.queueOperation({
        type: "update",
        collectionName: "sessions",
        payload: session,
        userId: session.userId,
      });
      return;
    }

    const auth = (await getFirebaseAuth()) as Auth;
    const user = auth.currentUser;

    if (!user || user.uid !== session.userId) {
      logger.warn("User not authenticated or mismatch for session sync", {
        sessionUserId: session.userId,
        currentUser: user?.uid,
      });
      return;
    }

    try {
      const firestore = (await getFirestore()) as Firestore;
      const sessionRef = doc(
        firestore,
        `users/${user.uid}/sessions`,
        session.id,
      );

      // Convert dates to Firestore timestamps
      const firestoreSession = {
        ...session,
        startTime: Timestamp.fromDate(session.startTime),
        endTime: session.endTime ? Timestamp.fromDate(session.endTime) : null,
        pauseStartTime: session.pauseStartTime
          ? Timestamp.fromDate(session.pauseStartTime)
          : null,
        lastModified: Timestamp.fromDate(session.lastModified),
      };

      await setDoc(sessionRef, firestoreSession);

      // Mark as synced in local DB
      await sessionDBService.update(session.id, { syncStatus: "synced" });

      logger.debug("Session synced to Firebase", { sessionId: session.id });
    } catch (error) {
      logger.error("Failed to sync single session", {
        error: error as Error,
        sessionId: session.id,
      });
      throw error;
    }
  }

  /**
   * Process offline queue operations
   */
  async processOfflineQueue(): Promise<void> {
    logger.info("Processing offline queue");
    const operations = await offlineQueue.getQueuedOperations();

    if (operations.length === 0) {
      logger.debug("Offline queue is empty");
      return;
    }

    logger.debug(`Processing ${operations.length} queued operations`);

    const auth = (await getFirebaseAuth()) as Auth;
    const user = auth.currentUser;

    if (!user) {
      logger.warn("No user authenticated, cannot process offline queue");
      return;
    }

    // Process operations by triggering syncs for affected collections
    const collectionsToSync = new Set<string>();
    operations.forEach((op) => collectionsToSync.add(op.collectionName));

    for (const collection of Array.from(collectionsToSync)) {
      await this.syncSingleCollection(collection, user.uid, {});
    }

    await offlineQueue.clearQueue();
  }

  /**
   * Public methods for specific entity synchronization
   * These are used by TanStack Query hooks for targeted sync
   */

  async syncUserTasks(userId: string): Promise<void> {
    try {
      await taskDataSync.syncTasks(userId);
      logger.debug("User tasks synced successfully", { userId });
    } catch (error) {
      logger.error("Failed to sync user tasks", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  async syncUserSettings(userId: string): Promise<void> {
    try {
      await userSettingsSync.syncCollection(userId);
      logger.debug("User settings synced successfully", { userId });
    } catch (error) {
      logger.error("Failed to sync user settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  async syncUserEvents(userId: string): Promise<void> {
    try {
      await eventDataSync.syncCollection(userId);
      logger.debug("User events synced successfully", { userId });
    } catch (error) {
      logger.error("Failed to sync user events", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  async syncUserSessions(userId: string): Promise<void> {
    try {
      await sessionDataSync.syncCollection(userId);
      logger.debug("User sessions synced successfully", { userId });
    } catch (error) {
      logger.error("Failed to sync user sessions", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Apply remote changes to local database
   * Supports both SyncOperation array and collection-specific data
   */
  async applyRemoteChanges(
    changesOrCollection: SyncOperation[] | string,
    data?: Record<string, unknown>[],
  ): Promise<void> {
    try {
      if (Array.isArray(changesOrCollection)) {
        // Handle SyncOperation[] format
        logger.debug("Applying remote changes", {
          changes: changesOrCollection,
        });
        // TODO: Implement remote changes application logic for SyncOperation[]
      } else {
        // Handle collection-specific format
        logger.debug("Applying remote changes for collection", {
          collection: changesOrCollection,
          data,
        });
        // TODO: Implement remote changes application logic for specific collection
      }
    } catch (error) {
      logger.error("Failed to apply remote changes", { error: error as Error });
      throw error;
    }
  }
}
