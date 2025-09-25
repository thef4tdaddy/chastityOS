/**
 * Firebase Sync Service
 * Handles bidirectional data sync between Dexie and Firebase
 */
import { serviceLogger } from "@/utils/logging";
import {
  db,
  sessionDBService,
  eventDBService,
  taskDBService,
  goalDBService,
  settingsDBService,
} from "../database";
import { getFirestore, getFirebaseAuth } from "../firebase";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import type {
  DBBase,
  DBSession,
  DBTask,
  DBSettings,
  DBEvent,
  DBGoal,
  SyncOptions,
  SyncResult,
  ConflictInfo,
} from "@/types/database";
import { conflictResolver } from "./ConflictResolver";
import { connectionStatus } from "./connectionStatus";
import { offlineQueue } from "./OfflineQueue";

const logger = serviceLogger("FirebaseSync");

export class FirebaseSync {
  private isSyncing = false;
  private conflictQueue: ConflictInfo[] = [];

  constructor() {
    logger.info("FirebaseSync initialized");
    connectionStatus.subscribe((isOnline) => {
      if (isOnline) {
        this.processOfflineQueue();
      }
    });
  }

  /**
   * Main entry point for user data synchronization
   */
  async syncUserData(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.warn("Sync already in progress");
      throw new Error("Sync already in progress");
    }

    if (!connectionStatus.getIsOnline()) {
      logger.warn("App is offline, skipping sync");
      throw new Error("App is offline");
    }

    const auth = (await getFirebaseAuth()) as Auth;
    const user = auth.currentUser;

    if (!user || user.uid !== userId) {
      logger.warn("User not authenticated or mismatch", { userId, currentUser: user?.uid });
      throw new Error("User not authenticated");
    }

    this.isSyncing = true;
    logger.info("Starting user data synchronization", { userId, options });

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
      const collections = options.collections || ["sessions", "events", "tasks", "goals", "settings"];

      // Sync each collection
      for (const collection of collections) {
        await this.syncCollection(collection, userId, result, options);
      }

      // Handle any conflicts that were detected
      if (result.conflicts.length > 0) {
        await this.handleConflicts(result.conflicts, options.conflictResolution || "auto");
      }

      logger.info("User data synchronization completed", { 
        userId, 
        result: {
          uploaded: result.operations.uploaded,
          downloaded: result.operations.downloaded,
          conflicts: result.operations.conflicts,
        }
      });
    } catch (error) {
      result.success = false;
      result.error = error as Error;
      logger.error("User data synchronization failed", {
        error: error as Error,
        userId,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Synchronize a specific collection
   */
  private async syncCollection(
    collectionName: string, 
    userId: string, 
    result: SyncResult, 
    options: SyncOptions
  ) {
    logger.debug(`Syncing collection: ${collectionName}`, { userId });

    try {
      // 1. Upload pending local changes to Firebase
      await this.uploadLocalChanges(collectionName, userId, result);
      
      // 2. Download Firebase changes to local
      await this.downloadFirebaseChanges(collectionName, userId, result);
      
    } catch (error) {
      logger.error(`Failed to sync collection: ${collectionName}`, {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Upload local changes to Firebase
   */
  private async uploadLocalChanges(
    collectionName: string, 
    userId: string, 
    result: SyncResult
  ): Promise<void> {
    const pendingDocs = await this.getPendingDocs(collectionName, userId);

    if (pendingDocs.length === 0) {
      return;
    }

    if (!connectionStatus.getIsOnline()) {
      logger.debug(
        `App is offline, queueing ${pendingDocs.length} changes for ${collectionName}`,
      );
      for (const docData of pendingDocs) {
        await offlineQueue.queueOperation({
          type: "update",
          collectionName,
          payload: docData,
        });
      }
      return;
    }

    logger.debug(
      `Uploading ${pendingDocs.length} pending changes for ${collectionName}`,
      { userId },
    );

    const firestore = (await getFirestore()) as Firestore;
    const batch = writeBatch(firestore);
    const syncedIds: string[] = [];

    for (const docData of pendingDocs) {
      try {
        // Check for conflicts before uploading
        const remoteDoc = await this.getRemoteDoc(collectionName, userId, docData.id);
        
        if (remoteDoc && conflictResolver.hasConflict(docData, remoteDoc)) {
          // Conflict detected - add to results for resolution
          const conflictInfo = conflictResolver.createConflictInfo(
            "upload_conflict",
            collectionName,
            docData.id,
            docData as Record<string, unknown>,
            remoteDoc as Record<string, unknown>
          );
          result.conflicts.push(conflictInfo);
          result.operations.conflicts++;
          continue;
        }

        const docRef = doc(
          firestore as Firestore,
          `users/${userId}/${collectionName}`,
          docData.id,
        );
        batch.set(docRef, { ...docData, lastModified: new Date() }, { merge: true });
        syncedIds.push(docData.id);
        result.operations.uploaded++;
      } catch (error) {
        logger.error(`Failed to prepare upload for ${docData.id}`, {
          error: error as Error,
          collectionName,
        });
        throw error;
      }
    }

    if (syncedIds.length > 0) {
      try {
        await batch.commit();
        await this.markDocsAsSynced(collectionName, syncedIds);
        logger.debug(
          `Successfully uploaded ${syncedIds.length} changes for ${collectionName}`,
          { userId },
        );
      } catch (error) {
        logger.error(`Failed to upload changes for ${collectionName}`, {
          error: error as Error,
          userId,
        });
        throw error;
      }
    }
  }

  /**
   * Download Firebase changes to local
   */
  private async downloadFirebaseChanges(
    collectionName: string,
    userId: string,
    result: SyncResult,
  ) {
    const firestore = await getFirestore();
    const syncMeta = await db.syncMeta.get(collectionName);
    const lastSync = syncMeta ? syncMeta.lastSync : new Date(0);

    logger.debug(
      `Downloading changes for ${collectionName} since ${lastSync.toISOString()}`,
      { userId },
    );

    const q = query(
      collection(firestore as Firestore, `users/${userId}/${collectionName}`),
      where("lastModified", ">", Timestamp.fromDate(lastSync)),
    );

    try {
      const querySnapshot = await getDocs(q);
      const remoteDocs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as DBBase,
      );

      if (remoteDocs.length === 0) {
        logger.debug(`No new changes to download for ${collectionName}`, {
          userId,
        });
        return;
      }

      logger.debug(
        `Downloaded ${remoteDocs.length} new changes for ${collectionName}`,
        { userId },
      );

      await this.applyRemoteChanges(collectionName, remoteDocs, result);

      // Update sync metadata
      await db.syncMeta.update(collectionName, { lastSync: new Date() });
      
    } catch (error) {
      logger.error(`Failed to download changes for ${collectionName}`, {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Handle conflicts based on resolution strategy
   */
  private async handleConflicts(
    conflicts: ConflictInfo[], 
    strategy: "auto" | "manual"
  ): Promise<void> {
    if (strategy === "auto") {
      // Auto-resolve conflicts using built-in strategies
      for (const conflict of conflicts) {
        try {
          await this.autoResolveConflict(conflict);
        } catch (error) {
          logger.error("Failed to auto-resolve conflict", {
            error: error as Error,
            conflict: conflict.documentId,
          });
          // Convert to manual resolution on auto-resolve failure
          this.conflictQueue.push(conflict);
        }
      }
    } else {
      // Queue for manual resolution
      this.conflictQueue.push(...conflicts);
    }
  }

  /**
   * Auto-resolve conflict using resolver strategies
   */
  private async autoResolveConflict(conflict: ConflictInfo): Promise<void> {
    const { collection: collectionName, localData, remoteData } = conflict;
    
    let resolvedDoc: DBBase;
    
    switch (collectionName) {
      case "sessions":
        resolvedDoc = conflictResolver.resolveSessionConflict(
          localData as DBSession,
          remoteData as DBSession,
        );
        break;
      case "tasks":
        resolvedDoc = conflictResolver.resolveTaskConflict(
          localData as DBTask,
          remoteData as DBTask,
        );
        break;
      case "settings":
        resolvedDoc = conflictResolver.resolveSettingsConflict(
          localData as DBSettings,
          remoteData as DBSettings,
        );
        break;
      default:
        // Default to remote wins for other collections
        resolvedDoc = remoteData as DBBase;
        break;
    }

    // Apply the resolved document to both local and remote
    await this.updateLocalDoc(collectionName, conflict.documentId, resolvedDoc);
    await this.updateRemoteDoc(collectionName, conflict.documentId, resolvedDoc);
    
    logger.info("Auto-resolved conflict", {
      collection: collectionName,
      documentId: conflict.documentId,
    });
  }

  /**
   * Get pending conflicts for manual resolution
   */
  getPendingConflicts(): ConflictInfo[] {
    return [...this.conflictQueue];
  }

  /**
   * Clear resolved conflicts from queue
   */
  clearResolvedConflicts(resolvedConflictIds: string[]): void {
    this.conflictQueue = this.conflictQueue.filter(
      conflict => !resolvedConflictIds.includes(`${conflict.collection}-${conflict.documentId}`)
    );
  }

  /**
   * Backward-compatible sync method
   */
  async sync(): Promise<void> {
    const auth = (await getFirebaseAuth()) as Auth;
    const user = auth.currentUser;

    if (!user) {
      logger.warn("No user authenticated, skipping sync");
      return;
    }

    try {
      await this.syncUserData(user.uid);
    } catch (error) {
      logger.error("Sync failed", { error: error as Error });
      throw error;
    }
  }

  async processOfflineQueue() {
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

    for (const op of operations) {
      await this.pushChangesToFirebase(op.collectionName, user.uid);
    }

    await offlineQueue.clearQueue();
  }

  private async getPendingDocs(
    collectionName: string,
    userId: string,
  ): Promise<DBBase[]> {
    switch (collectionName) {
      case "sessions":
        return sessionDBService.getPendingSync(userId);
      case "events":
        return eventDBService.getPendingSync(userId);
      case "tasks":
        return taskDBService.getPendingSync(userId);
      case "goals":
        return goalDBService.getPendingSync(userId);
      case "settings":
        return settingsDBService.getPendingSync(userId);
      default:
        return [];
    }
  }

  private async markDocsAsSynced(collectionName: string, ids: string[]) {
    switch (collectionName) {
      case "sessions":
        await sessionDBService.bulkMarkAsSynced(ids);
        break;
      case "events":
        await eventDBService.bulkMarkAsSynced(ids);
        break;
      case "tasks":
        await taskDBService.bulkMarkAsSynced(ids);
        break;
      case "goals":
        await goalDBService.bulkMarkAsSynced(ids);
        break;
      case "settings":
        await settingsDBService.bulkMarkAsSynced(ids);
        break;
    }
  }

  public async applyRemoteChanges(collectionName: string, docs: DBBase[], result?: SyncResult) {
    for (const docData of docs) {
      const localDoc = await this.getLocalDoc(collectionName, docData.id);

      if (localDoc) {
        // Check for conflicts
        if (conflictResolver.hasConflict(localDoc, docData)) {
          const conflictInfo = conflictResolver.createConflictInfo(
            "download_conflict",
            collectionName,
            docData.id,
            localDoc as Record<string, unknown>,
            docData as Record<string, unknown>
          );
          
          if (result) {
            result.conflicts.push(conflictInfo);
            result.operations.conflicts++;
          } else {
            // Auto-resolve if no result tracking
            await this.autoResolveConflict(conflictInfo);
          }
        } else {
          // No conflict, apply remote changes
          await this.updateLocalDoc(collectionName, docData.id, docData);
          if (result) result.operations.downloaded++;
        }
      } else {
        // New document from server
        await this.createLocalDoc(collectionName, docData);
        if (result) result.operations.downloaded++;
      }
    }
  }

  /**
   * Get remote document from Firebase
   */
  private async getRemoteDoc(
    collectionName: string,
    userId: string,
    docId: string,
  ): Promise<DBBase | null> {
    try {
      const firestore = await getFirestore();
      const docRef = doc(firestore as Firestore, `users/${userId}/${collectionName}`, docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const docData = docSnap.data();
      return { id: docId, ...docData } as DBBase;
    } catch (error) {
      logger.error("Failed to get remote document", {
        error: error as Error,
        collectionName,
        docId,
      });
      return null;
    }
  }

  /**
   * Update remote document in Firebase
   */
  private async updateRemoteDoc(
    collectionName: string,
    docId: string,
    data: DBBase,
  ): Promise<void> {
    try {
      const firestore = await getFirestore();
      const auth = await getFirebaseAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const docRef = doc(firestore as Firestore, `users/${user.uid}/${collectionName}`, docId);
      const batch = writeBatch(firestore as Firestore);
      batch.set(docRef, data, { merge: true });
      await batch.commit();
      
    } catch (error) {
      logger.error("Failed to update remote document", {
        error: error as Error,
        collectionName,
        docId,
      });
      throw error;
    }
  }

  private async getLocalDoc(
    collectionName: string,
    id: string,
  ): Promise<DBBase | null> {
    switch (collectionName) {
      case "sessions":
        return (await sessionDBService.findById(id)) || null;
      case "events":
        return (await eventDBService.findById(id)) || null;
      case "tasks":
        return (await taskDBService.findById(id)) || null;
      case "goals":
        return (await goalDBService.findById(id)) || null;
      case "settings":
        return (await settingsDBService.findById(id)) || null;
      default:
        return null;
    }
  }

  private async updateLocalDoc(
    collectionName: string,
    id: string,
    data: DBBase,
  ) {
    switch (collectionName) {
      case "sessions":
        await sessionDBService.update(id, data);
        break;
      case "events":
        await eventDBService.update(id, data);
        break;
      case "tasks":
        await taskDBService.update(id, data);
        break;
      case "goals":
        await goalDBService.update(id, data);
        break;
      case "settings":
        await settingsDBService.update(id, data);
        break;
    }
  }

  private async createLocalDoc(collectionName: string, data: DBBase) {
    const { lastModified, syncStatus, ...rest } = data;
    switch (collectionName) {
      case "sessions":
        await sessionDBService.create(
          rest as Omit<DBSession, "lastModified" | "syncStatus">,
        );
        break;
      case "events":
        await eventDBService.create(
          rest as Omit<DBEvent, "lastModified" | "syncStatus">,
        );
        break;
      case "tasks":
        await taskDBService.create(
          rest as Omit<DBTask, "lastModified" | "syncStatus">,
        );
        break;
      case "goals":
        await goalDBService.create(
          rest as Omit<DBGoal, "lastModified" | "syncStatus">,
        );
        break;
      case "settings":
        await settingsDBService.create(
          rest as Omit<DBSettings, "lastModified" | "syncStatus">,
        );
        break;
    }
  }
}
