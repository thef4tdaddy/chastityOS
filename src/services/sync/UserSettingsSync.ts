/**
 * User Settings Synchronization Service
 * Handles sync operations for user settings data
 */
import { serviceLogger } from "@/utils/logging";
import { db, settingsDBService } from "../database";
import { FirebaseSyncCore } from "./FirebaseSyncCore";
import type {
  DBBase,
  DBSettings,
  SyncOptions,
  SyncResult,
} from "@/types/database";
import { query, where, getDocs, getDoc } from "firebase/firestore";
import { syncConflictResolver } from "./SyncConflictResolver";

const logger = serviceLogger("UserSettingsSync");

export class UserSettingsSync extends FirebaseSyncCore {
  private readonly collectionName = "settings";

  constructor() {
    super();
    logger.info("UserSettingsSync initialized");
  }

  /**
   * Sync user settings collection
   */
  async syncCollection(
    userId: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error("Settings sync already in progress");
    }

    await this.validateUser(userId);
    this.validateConnectivity();

    this.isSyncing = true;
    const result = this.initializeSyncResult();

    try {
      this.logSyncOperation("Starting sync", this.collectionName, userId);

      // Upload pending local changes
      await this.uploadLocalChanges(userId, result);

      // Download remote changes
      await this.downloadRemoteChanges(userId, result);

      // Handle conflicts if any
      if (result.conflicts.length > 0) {
        const resolvedDocs = await syncConflictResolver.handleConflicts(
          result.conflicts,
          options.conflictResolution || "auto",
        );

        // Apply resolved documents
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
      logger.error("Settings sync failed", {
        error: error as Error,
        userId,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Get pending settings documents for sync
   */
  async getPendingDocs(userId: string): Promise<DBBase[]> {
    return settingsDBService.getPendingSync(userId);
  }

  /**
   * Mark settings documents as synced
   */
  async markDocsAsSynced(ids: string[]): Promise<void> {
    await settingsDBService.bulkMarkAsSynced(ids);
  }

  /**
   * Apply remote settings changes to local storage
   */
  async applyRemoteChanges(docs: DBBase[], result?: SyncResult): Promise<void> {
    for (const docData of docs) {
      const localDoc = await settingsDBService.findById(docData.id);

      if (localDoc) {
        // Check for conflicts
        if (syncConflictResolver.hasConflict(localDoc, docData)) {
          const conflictInfo = syncConflictResolver.createConflictInfo(
            "download_conflict",
            this.collectionName,
            docData.id,
            localDoc as Record<string, unknown>,
            docData as Record<string, unknown>,
          );

          if (result) {
            result.conflicts.push(conflictInfo);
            this.updateSyncResult(result, "conflicts");
          } else {
            // Auto-resolve if no result tracking
            const resolved =
              await syncConflictResolver.autoResolveConflict(conflictInfo);
            await this.updateLocalDoc(resolved);
          }
        } else {
          // No conflict, apply remote changes
          await this.updateLocalDoc(docData);
          if (result) this.updateSyncResult(result, "downloaded");
        }
      } else {
        // New document from server
        await this.createLocalDoc(docData);
        if (result) this.updateSyncResult(result, "downloaded");
      }
    }
  }

  /**
   * Upload local settings changes to Firebase
   */
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
        // Check for conflicts before uploading
        const remoteDoc = await this.getRemoteDoc(userId, docData.id);

        if (remoteDoc && syncConflictResolver.hasConflict(docData, remoteDoc)) {
          const conflictInfo = syncConflictResolver.createConflictInfo(
            "upload_conflict",
            this.collectionName,
            docData.id,
            docData as Record<string, unknown>,
            remoteDoc as Record<string, unknown>,
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
      await this.markDocsAsSynced(syncedIds);
    }
  }

  /**
   * Download remote settings changes
   */
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

  /**
   * Get remote settings document
   */
  private async getRemoteDoc(
    userId: string,
    docId: string,
  ): Promise<DBBase | null> {
    try {
      const { firestore } = await this.createBatch();
      const docRef = this.getDocRef(
        firestore,
        userId,
        this.collectionName,
        docId,
      );
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const docData = docSnap.data();
      return { id: docId, ...docData } as DBBase;
    } catch (error) {
      logger.error("Failed to get remote settings document", {
        error: error as Error,
        docId,
      });
      return null;
    }
  }

  /**
   * Update local settings document
   */
  private async updateLocalDoc(data: DBBase): Promise<void> {
    await settingsDBService.update(data.id, data);
  }

  /**
   * Create local settings document
   */
  private async createLocalDoc(data: DBBase): Promise<void> {
    const {
      lastModified: _lastModified,
      syncStatus: _syncStatus,
      ...rest
    } = data;
    await settingsDBService.create(
      rest as Omit<DBSettings, "lastModified" | "syncStatus">,
    );
  }

  /**
   * Update remote settings document
   */
  private async updateRemoteDoc(userId: string, data: DBBase): Promise<void> {
    const { firestore, batch } = await this.createBatch();
    const docRef = this.getDocRef(
      firestore,
      userId,
      this.collectionName,
      data.id,
    );
    batch.set(docRef, data, { merge: true });
    await batch.commit();
  }
}

export const userSettingsSync = new UserSettingsSync();
