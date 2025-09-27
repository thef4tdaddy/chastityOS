/**
 * Task Data Synchronization Service
 * Handles sync operations for task and goal data
 */
import { serviceLogger } from "@/utils/logging";
import { db, taskDBService, goalDBService } from "../database";
import { FirebaseSyncCore } from "./FirebaseSyncCore";
import type {
  DBBase,
  DBTask,
  DBGoal,
  SyncOptions,
  SyncResult,
} from "@/types/database";
import { query, where, getDocs, getDoc } from "firebase/firestore";
import { syncConflictResolver } from "./SyncConflictResolver";

const logger = serviceLogger("TaskDataSync");

export class TaskDataSync extends FirebaseSyncCore {
  private readonly taskCollectionName = "tasks";
  private readonly goalCollectionName = "goals";

  constructor() {
    super();
    logger.info("TaskDataSync initialized");
  }

  /**
   * Sync both tasks and goals collections
   */
  async syncCollection(
    userId: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error("Task/Goal sync already in progress");
    }

    await this.validateUser(userId);
    this.validateConnectivity();

    this.isSyncing = true;
    const result = this.initializeSyncResult();

    try {
      this.logSyncOperation("Starting sync", "tasks+goals", userId);

      // Sync tasks first
      await this.syncTasks(userId, result, options);

      // Then sync goals
      await this.syncGoals(userId, result, options);

      this.logSyncOperation(
        "Completed sync",
        "tasks+goals",
        userId,
        result.operations.uploaded + result.operations.downloaded,
      );
    } catch (error) {
      result.success = false;
      result.error = error as Error;
      logger.error("Task/Goal sync failed", {
        error: error as Error,
        userId,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync only tasks collection
   */
  async syncTasks(
    userId: string,
    result?: SyncResult,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const taskResult = result || this.initializeSyncResult();

    await this.syncSpecificCollection(
      userId,
      this.taskCollectionName,
      taskDBService,
      taskResult,
      options,
    );

    return taskResult;
  }

  /**
   * Sync only goals collection
   */
  async syncGoals(
    userId: string,
    result?: SyncResult,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const goalResult = result || this.initializeSyncResult();

    await this.syncSpecificCollection(
      userId,
      this.goalCollectionName,
      goalDBService,
      goalResult,
      options,
    );

    return goalResult;
  }

  async getPendingDocs(userId: string): Promise<DBBase[]> {
    const taskDocs = await taskDBService.getPendingSync(userId);
    const goalDocs = await goalDBService.getPendingSync(userId);
    return [...taskDocs, ...goalDocs];
  }

  async markDocsAsSynced(_ids: string[]): Promise<void> {
    // This method is not used directly since we handle tasks and goals separately
    // in the specific collection sync methods
  }

  async applyRemoteChanges(
    _docs: DBBase[],
    _result?: SyncResult,
  ): Promise<void> {
    // This method is not used directly since we handle tasks and goals separately
    // in the specific collection sync methods
  }

  /**
   * Sync a specific collection (tasks or goals)
   */
  private async syncSpecificCollection(
    userId: string,
    collectionName: string,
    dbService: typeof taskDBService | typeof goalDBService,
    result: SyncResult,
    options: SyncOptions,
  ): Promise<void> {
    this.logSyncOperation("Starting sync", collectionName, userId);

    await this.uploadLocalChangesForCollection(
      userId,
      collectionName,
      dbService,
      result,
    );
    await this.downloadRemoteChangesForCollection(
      userId,
      collectionName,
      dbService,
      result,
    );

    if (result.conflicts.length > 0) {
      const conflictsForCollection = result.conflicts.filter(
        (c) => c.collection === collectionName,
      );
      if (conflictsForCollection.length > 0) {
        const resolvedDocs = await syncConflictResolver.handleConflicts(
          conflictsForCollection,
          options.conflictResolution || "auto",
        );

        for (const doc of resolvedDocs) {
          await this.updateLocalDocForCollection(
            collectionName,
            dbService,
            doc,
          );
          await this.updateRemoteDoc(userId, collectionName, doc);
        }
      }
    }
  }

  private async uploadLocalChangesForCollection(
    userId: string,
    collectionName: string,
    dbService: typeof taskDBService | typeof goalDBService,
    result: SyncResult,
  ): Promise<void> {
    const pendingDocs = await dbService.getPendingSync(userId);

    if (pendingDocs.length === 0) return;

    this.logSyncOperation(
      "Uploading changes",
      collectionName,
      userId,
      pendingDocs.length,
    );

    const { firestore, batch } = await this.createBatch();
    const syncedIds: string[] = [];

    for (const docData of pendingDocs) {
      try {
        const remoteDoc = await this.getRemoteDoc(
          userId,
          collectionName,
          docData.id,
        );

        if (remoteDoc && syncConflictResolver.hasConflict(docData, remoteDoc)) {
          const conflictInfo = syncConflictResolver.createConflictInfo(
            "upload_conflict",
            collectionName,
            docData.id,
            docData as unknown as Record<string, unknown>,
            remoteDoc as unknown as Record<string, unknown>,
          );
          result.conflicts.push(conflictInfo);
          this.updateSyncResult(result, "conflicts");
          continue;
        }

        const docRef = this.getDocRef(
          firestore,
          userId,
          collectionName,
          docData.id,
        );
        batch.set(
          docRef,
          { ...docData, lastModified: new Date() },
          { merge: true },
        );
        syncedIds.push(docData.id);
        this.updateSyncResult(result, "uploaded");
      } catch (error) {
        logger.error(`Failed to prepare upload for ${docData.id}`, {
          error: error as Error,
        });
        throw error;
      }
    }

    if (syncedIds.length > 0) {
      await batch.commit();
      await dbService.bulkMarkAsSynced(syncedIds);
    }
  }

  private async downloadRemoteChangesForCollection(
    userId: string,
    collectionName: string,
    dbService: typeof taskDBService | typeof goalDBService,
    result: SyncResult,
  ): Promise<void> {
    const { firestore } = await this.createBatch();
    const syncMeta = await db.syncMeta.get(collectionName);
    const lastSync = syncMeta ? syncMeta.lastSync : new Date(0);

    this.logSyncOperation("Downloading changes", collectionName, userId);

    const collectionRef = this.getCollectionRef(
      firestore,
      userId,
      collectionName,
    );
    const q = query(
      collectionRef,
      where("lastModified", ">", this.toFirestoreTimestamp(lastSync)),
    );

    const querySnapshot = await getDocs(q);
    const remoteDocs = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as DBBase,
    );

    if (remoteDocs.length > 0) {
      this.logSyncOperation(
        "Downloaded changes",
        collectionName,
        userId,
        remoteDocs.length,
      );
      await this.applyRemoteChangesForCollection(
        collectionName,
        dbService,
        remoteDocs,
        result,
      );
      await db.syncMeta.update(collectionName, { lastSync: new Date() });
    }
  }

  private async applyRemoteChangesForCollection(
    collectionName: string,
    dbService: typeof taskDBService | typeof goalDBService,
    docs: DBBase[],
    result: SyncResult,
  ): Promise<void> {
    for (const docData of docs) {
      const localDoc = await dbService.findById(docData.id);

      if (localDoc) {
        if (syncConflictResolver.hasConflict(localDoc, docData)) {
          const conflictInfo = syncConflictResolver.createConflictInfo(
            "download_conflict",
            collectionName,
            docData.id,
            localDoc as unknown as Record<string, unknown>,
            docData as unknown as Record<string, unknown>,
          );

          result.conflicts.push(conflictInfo);
          this.updateSyncResult(result, "conflicts");
        } else {
          await this.updateLocalDocForCollection(
            collectionName,
            dbService,
            docData,
          );
          this.updateSyncResult(result, "downloaded");
        }
      } else {
        await this.createLocalDocForCollection(
          collectionName,
          dbService,
          docData,
        );
        this.updateSyncResult(result, "downloaded");
      }
    }
  }

  private async getRemoteDoc(
    userId: string,
    collectionName: string,
    docId: string,
  ): Promise<DBBase | null> {
    try {
      const { firestore } = await this.createBatch();
      const docRef = this.getDocRef(firestore, userId, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const docData = docSnap.data();
      return { id: docId, ...docData } as DBBase;
    } catch (error) {
      logger.error(`Failed to get remote ${collectionName} document`, {
        error: error as Error,
        docId,
      });
      return null;
    }
  }

  private async updateLocalDocForCollection(
    collectionName: string,
    dbService: typeof taskDBService | typeof goalDBService,
    data: DBBase,
  ): Promise<void> {
    await dbService.update(data.id, data);
  }

  private async createLocalDocForCollection(
    collectionName: string,
    dbService: typeof taskDBService | typeof goalDBService,
    data: DBBase,
  ): Promise<void> {
    const {
      lastModified: _lastModified,
      syncStatus: _syncStatus,
      ...rest
    } = data;
    if (collectionName === "tasks") {
      await (dbService as typeof taskDBService).create(
        rest as Omit<DBTask, "lastModified" | "syncStatus">,
      );
    } else {
      await (dbService as typeof goalDBService).create(
        rest as Omit<DBGoal, "lastModified" | "syncStatus">,
      );
    }
  }

  private async updateRemoteDoc(
    userId: string,
    collectionName: string,
    data: DBBase,
  ): Promise<void> {
    const { firestore, batch } = await this.createBatch();
    const docRef = this.getDocRef(firestore, userId, collectionName, data.id);
    batch.set(docRef, data, { merge: true });
    await batch.commit();
  }
}

export const taskDataSync = new TaskDataSync();
