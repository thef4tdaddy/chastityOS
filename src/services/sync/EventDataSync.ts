/**
 * Event Data Synchronization Service
 * Handles sync operations for event logging data
 */
import { serviceLogger } from "@/utils/logging";
import { db, eventDBService } from "@/services/database";
import { FirebaseSyncCore } from "./FirebaseSyncCore";
import type {
  DBBase,
  DBEvent,
  SyncOptions,
  SyncResult,
  ConflictInfo,
} from "@/types/database";
import { query, where, getDocs } from "firebase/firestore";
import { syncConflictResolver } from "./SyncConflictResolver";

const logger = serviceLogger("EventDataSync");

export class EventDataSync extends FirebaseSyncCore {
  private readonly collectionName = "events";

  constructor() {
    super();
    logger.info("EventDataSync initialized");
  }

  async syncCollection(
    userId: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error("Event sync already in progress");
    }

    await this.validateUser(userId);
    this.validateConnectivity();

    this.isSyncing = true;
    const result = this.initializeSyncResult();

    try {
      this.logSyncOperation("Starting sync", this.collectionName, userId);

      await this.uploadLocalChanges(userId, result);
      await this.downloadRemoteChanges(userId, result);

      await this.resolveConflicts(userId, result, options);

      this.logSyncOperation(
        "Completed sync",
        this.collectionName,
        userId,
        result.operations.uploaded + result.operations.downloaded,
      );
    } catch (error) {
      result.success = false;
      result.error = error as Error;
      logger.error("Event sync failed", {
        error: error as Error,
        userId,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async resolveConflicts(
    userId: string,
    result: SyncResult,
    options: SyncOptions = {},
  ): Promise<void> {
    if (result.conflicts.length === 0) {
      return;
    }

    const resolvedDocs = await syncConflictResolver.handleConflicts(
      result.conflicts,
      options.conflictResolution || "auto",
    );

    for (const doc of resolvedDocs) {
      await this.updateLocalDoc(doc);
      await this.updateRemoteDoc(userId, doc);
    }
  }

  async getPendingDocs(userId: string): Promise<DBBase[]> {
    return eventDBService.getPendingSync(userId);
  }

  async markDocsAsSynced(ids: string[]): Promise<void> {
    await eventDBService.bulkMarkAsSynced(ids);
  }

  async applyRemoteChanges(docs: DBBase[], result?: SyncResult): Promise<void> {
    for (const docData of docs) {
      const localDoc = await eventDBService.findById(docData.id);

      if (localDoc) {
        // cast docData to DBEvent when checking conflicts / resolving
        if (
          syncConflictResolver.hasConflict(
            localDoc,
            docData as unknown as DBEvent,
          )
        ) {
          const conflictInfo = this.createConflict(
            "download_conflict",
            localDoc,
            docData,
          );

          if (result) {
            result.conflicts.push(conflictInfo);
            this.updateSyncResult(result, "conflicts");
          } else {
            const resolved =
              await syncConflictResolver.autoResolveConflict(conflictInfo);
            await this.updateLocalDoc(resolved);
          }
        } else {
          await this.updateLocalDoc(docData);
          if (result) this.updateSyncResult(result, "downloaded");
        }
      } else {
        await this.createLocalDoc(docData);
        if (result) this.updateSyncResult(result, "downloaded");
      }
    }
  }

  private createConflict(
    type: "download_conflict" | "upload_conflict",
    localDoc: DBBase,
    remoteDoc: DBBase,
  ): ConflictInfo {
    return syncConflictResolver.createConflictInfo(
      type,
      this.collectionName,
      localDoc.id,
      localDoc as unknown as Record<string, unknown>,
      remoteDoc as unknown as Record<string, unknown>,
    );
  }

  private async uploadLocalChanges(
    userId: string,
    result: SyncResult,
  ): Promise<void> {
    const pendingDocs = await this.getPendingDocs(userId);

    if (pendingDocs.length === 0) return;

    this.logSyncOperation(
      "Uploading changes",
      this.collectionName,
      userId,
      pendingDocs.length,
    );

    const { firestore, batch } = await this.createBatch();
    const syncedIds: string[] = [];

    for (const docData of pendingDocs) {
      try {
        const remoteDoc = await this.getRemoteDoc(
          userId,
          this.collectionName,
          docData.id,
        );

        // cast to DBEvent when calling conflict checker
        if (
          remoteDoc &&
          syncConflictResolver.hasConflict(
            docData as unknown as DBEvent,
            remoteDoc as unknown as DBEvent,
          )
        ) {
          const conflictInfo = this.createConflict(
            "upload_conflict",
            docData,
            remoteDoc,
          );
          result.conflicts.push(conflictInfo);
          this.updateSyncResult(result, "conflicts");
          continue;
        }

        const docRef = this.getDocRef(
          firestore,
          userId,
          this.collectionName,
          docData.id,
        );

        // Build a payload typed as Partial<DBEvent> so we don't need all required DBEvent fields
        const payload = {
          ...docData,
          lastModified: this.toFirestoreTimestamp(new Date()),
        } as Partial<DBEvent> & {
          lastModified: ReturnType<typeof this.toFirestoreTimestamp>;
        };

        batch.set(docRef, payload, { merge: true });
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
      await this.markDocsAsSynced(syncedIds);
    }
  }

  private async downloadRemoteChanges(
    userId: string,
    result: SyncResult,
  ): Promise<void> {
    const { firestore } = await this.createBatch();
    const syncMeta = await db.syncMeta.get(this.collectionName);
    const lastSync = syncMeta ? syncMeta.lastSync : new Date(0);

    this.logSyncOperation("Downloading changes", this.collectionName, userId);

    const collectionRef = this.getCollectionRef(
      firestore,
      userId,
      this.collectionName,
    );
    const q = query(
      collectionRef,
      where("lastModified", ">", this.toFirestoreTimestamp(lastSync)),
    );

    const querySnapshot = await getDocs(q);
    const remoteDocs = querySnapshot.docs.map((doc) =>
      this.snapshotToDBBase(doc),
    );

    if (remoteDocs.length > 0) {
      this.logSyncOperation(
        "Downloaded changes",
        this.collectionName,
        userId,
        remoteDocs.length,
      );
      await this.applyRemoteChanges(remoteDocs, result);
      await db.syncMeta.update(this.collectionName, { lastSync: new Date() });
    }
  }

  private async updateLocalDoc(data: DBBase): Promise<void> {
    // eventDBService.update expects Partial<DBEvent>, cast DBBase accordingly
    await eventDBService.update(data.id, data as unknown as Partial<DBEvent>);
  }

  private async createLocalDoc(data: DBBase): Promise<void> {
    // Cast DBBase to the expected create payload (strip sync metadata at runtime if present)
    await eventDBService.create(
      data as unknown as Omit<DBEvent, "lastModified" | "syncStatus">,
    );
  }

  private async updateRemoteDoc(userId: string, data: DBBase): Promise<void> {
    const { firestore, batch } = await this.createBatch();
    const docRef = this.getDocRef(
      firestore,
      userId,
      this.collectionName,
      data.id,
    );
    batch.set(
      docRef,
      this.sanitizeForFirestore(data as Record<string, unknown>),
      { merge: true },
    );
    await batch.commit();
  }
}

export const eventDataSync = new EventDataSync();
