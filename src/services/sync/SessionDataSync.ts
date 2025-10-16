/**
 * Session Data Synchronization Service
 * Handles sync operations for session and tracking data
 */
import { serviceLogger } from "@/utils/logging";
import { db, sessionDBService } from "../database";
import { FirebaseSyncCore } from "./FirebaseSyncCore";
import type {
  DBBase,
  DBSession,
  SyncOptions,
  SyncResult,
} from "@/types/database";
import { query, where, getDocs, getDoc } from "firebase/firestore";
import { syncConflictResolver } from "./SyncConflictResolver";

const logger = serviceLogger("SessionDataSync");

export class SessionDataSync extends FirebaseSyncCore {
  private readonly collectionName = "sessions";

  constructor() {
    super();
    logger.info("SessionDataSync initialized");
  }

  /**
   * Sync session data collection
   */
  async syncCollection(
    userId: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error("Session sync already in progress");
    }

    await this.validateUser(userId);
    this.validateConnectivity();

    this.isSyncing = true;
    const result = this.initializeSyncResult();

    try {
      this.logSyncOperation("Starting sync", this.collectionName, userId);

      await this.uploadLocalChanges(userId, result);
      await this.downloadRemoteChanges(userId, result);

      if (result.conflicts.length > 0) {
        const resolvedDocs = await syncConflictResolver.handleConflicts(
          result.conflicts,
          options.conflictResolution || "auto",
        );

        for (const doc of resolvedDocs) {
          await this.updateLocalDoc(doc);
          await this.updateRemoteDoc(userId, doc);
        }
      }

      this.logSyncOperation(
        "Completed sync",
        this.collectionName,
        userId,
        result.operations.uploaded + result.operations.downloaded,
      );
    } catch (error) {
      result.success = false;
      result.error = error as Error;
      logger.error("Session sync failed", {
        error: error as Error,
        userId,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  async getPendingDocs(userId: string): Promise<DBBase[]> {
    return sessionDBService.getPendingSync(userId);
  }

  async markDocsAsSynced(ids: string[]): Promise<void> {
    await sessionDBService.bulkMarkAsSynced(ids);
  }

  async applyRemoteChanges(docs: DBBase[], result?: SyncResult): Promise<void> {
    for (const docData of docs) {
      const localDoc = await sessionDBService.findById(docData.id);

      if (localDoc) {
        if (syncConflictResolver.hasConflict(localDoc, docData)) {
          const conflictInfo = syncConflictResolver.createConflictInfo(
            "download_conflict",
            this.collectionName,
            docData.id,
            localDoc as unknown as Record<string, unknown>,
            docData as unknown as Record<string, unknown>,
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

        if (remoteDoc && syncConflictResolver.hasConflict(docData, remoteDoc)) {
          const conflictInfo = syncConflictResolver.createConflictInfo(
            "upload_conflict",
            this.collectionName,
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
          this.collectionName,
          docData.id,
        );
        batch.set(
          docRef,
          { ...docData, lastModified: this.toFirestoreTimestamp(new Date()) },
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
    const remoteDocs = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as DBBase,
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

  protected async getRemoteDoc(
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
      logger.error("Failed to get remote session document", {
        error: error as Error,
        docId,
      });
      return null;
    }
  }

  private async updateLocalDoc(data: DBBase): Promise<void> {
    await sessionDBService.update(data.id, data);
  }

  private async createLocalDoc(data: DBBase): Promise<void> {
    const {
      lastModified: _lastModified,
      syncStatus: _syncStatus,
      ...rest
    } = data;
    await sessionDBService.create(
      rest as Omit<DBSession, "lastModified" | "syncStatus">,
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

export const sessionDataSync = new SessionDataSync();
