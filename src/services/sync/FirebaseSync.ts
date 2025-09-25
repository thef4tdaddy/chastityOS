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
} from "firebase/firestore";
import type {
  DBBase,
  DBSession,
  DBTask,
  DBSettings,
  DBEvent,
  DBGoal,
} from "@/types/database";
import { conflictResolver } from "./ConflictResolver";
import { connectionStatus } from "./connectionStatus";
import { offlineQueue } from "./OfflineQueue";

const logger = serviceLogger("FirebaseSync");

export class FirebaseSync {
  private isSyncing = false;

  constructor() {
    logger.info("FirebaseSync initialized");
    connectionStatus.subscribe((isOnline) => {
      if (isOnline) {
        this.processOfflineQueue();
      }
    });
  }

  /**
   * Main entry point for the synchronization process
   */
  async sync() {
    if (this.isSyncing) {
      logger.warn("Sync already in progress");
      return;
    }

    if (!connectionStatus.getIsOnline()) {
      logger.warn("App is offline, skipping sync");
      return;
    }

    const auth = (await getFirebaseAuth()) as Auth;
    const user = auth.currentUser;

    if (!user) {
      logger.warn("No user authenticated, skipping sync");
      return;
    }

    this.isSyncing = true;
    logger.info("Starting synchronization process", { userId: user.uid });

    try {
      await this.processOfflineQueue();

      // Sync all collections
      await this.syncCollection("sessions", user.uid);
      await this.syncCollection("events", user.uid);
      await this.syncCollection("tasks", user.uid);
      await this.syncCollection("goals", user.uid);
      await this.syncCollection("settings", user.uid);

      logger.info("Synchronization process completed", { userId: user.uid });
    } catch (error) {
      logger.error("Synchronization process failed", {
        error: error as Error,
        userId: user.uid,
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Synchronize a specific collection
   */
  private async syncCollection(collectionName: string, userId: string) {
    logger.debug(`Syncing collection: ${collectionName}`, { userId });

    try {
      await this.pushChangesToFirebase(collectionName, userId);
      await this.pullChangesFromFirebase(collectionName, userId);
    } catch (error) {
      logger.error(`Failed to sync collection: ${collectionName}`, {
        error: error as Error,
        userId,
      });
    }
  }

  /**
   * Push local changes to Firebase
   */
  private async pushChangesToFirebase(collectionName: string, userId: string) {
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
      `Pushing ${pendingDocs.length} pending changes for ${collectionName}`,
      { userId },
    );

    const firestore = (await getFirestore()) as Firestore;
    const batch = writeBatch(firestore);
    const syncedIds: string[] = [];

    for (const docData of pendingDocs) {
      const docRef = doc(
        firestore as Firestore,
        `users/${userId}/${collectionName}`,
        docData.id,
      );
      batch.set(docRef, docData, { merge: true });
      syncedIds.push(docData.id);
    }

    try {
      await batch.commit();
      await this.markDocsAsSynced(collectionName, syncedIds);
      logger.debug(
        `Successfully pushed ${syncedIds.length} changes for ${collectionName}`,
        { userId },
      );
    } catch (error) {
      logger.error(`Failed to push changes for ${collectionName}`, {
        error: error as Error,
        userId,
      });
    }
  }

  /**
   * Pull remote changes from Firebase
   */
  private async pullChangesFromFirebase(
    collectionName: string,
    userId: string,
  ) {
    const firestore = await getFirestore();
    const syncMeta = await db.syncMeta.get(collectionName);
    const lastSync = syncMeta ? syncMeta.lastSync : new Date(0);

    logger.debug(
      `Pulling changes for ${collectionName} since ${lastSync.toISOString()}`,
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
        logger.debug(`No new changes to pull for ${collectionName}`, {
          userId,
        });
        return;
      }

      logger.debug(
        `Pulled ${remoteDocs.length} new changes for ${collectionName}`,
        { userId },
      );

      await this.applyRemoteChanges(collectionName, remoteDocs);

      await db.syncMeta.update(collectionName, { lastSync: new Date() });
    } catch (error) {
      logger.error(`Failed to pull changes for ${collectionName}`, {
        error: error as Error,
        userId,
      });
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

  public async applyRemoteChanges(collectionName: string, docs: DBBase[]) {
    for (const docData of docs) {
      const localDoc = await this.getLocalDoc(collectionName, docData.id);

      if (localDoc) {
        let resolvedDoc;
        switch (collectionName) {
          case "sessions":
            resolvedDoc = conflictResolver.resolveSessionConflict(
              localDoc as DBSession,
              docData as DBSession,
            );
            break;
          case "tasks":
            resolvedDoc = conflictResolver.resolveTaskConflict(
              localDoc as DBTask,
              docData as DBTask,
            );
            break;
          case "settings":
            resolvedDoc = conflictResolver.resolveSettingsConflict(
              localDoc as DBSettings,
              docData as DBSettings,
            );
            break;
          default:
            // Default to server wins
            resolvedDoc = docData;
            break;
        }
        await this.updateLocalDoc(collectionName, docData.id, resolvedDoc);
      } else {
        // New document from server
        await this.createLocalDoc(collectionName, docData);
      }
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
