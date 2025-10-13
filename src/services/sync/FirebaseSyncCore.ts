/**
 * Firebase Sync Core Infrastructure
 * Shared utilities and base functionality for all sync services
 */
import { serviceLogger } from "@/utils/logging";
import { getFirestore, getFirebaseAuth } from "../firebase";
import type { Auth } from "firebase/auth";
import type { Firestore, DocumentSnapshot } from "firebase/firestore";
import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import type { DBBase, SyncOptions, SyncResult } from "@/types/database";
import { connectionStatus } from "./connectionStatus";
import { offlineQueue } from "./OfflineQueue";

const logger = serviceLogger("FirebaseSyncCore");

export abstract class FirebaseSyncCore {
  protected isSyncing = false;

  constructor() {
    logger.info("FirebaseSyncCore initialized");
  }

  /**
   * Validate user authentication
   */
  protected async validateUser(userId: string): Promise<Auth> {
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
   * Check online status and validate connectivity
   */
  protected validateConnectivity(): void {
    if (!connectionStatus.getIsOnline()) {
      logger.warn("App is offline, sync operations not available");
      throw new Error("App is offline");
    }
  }

  /**
   * Create Firebase batch for bulk operations
   */
  protected async createBatch(): Promise<{
    firestore: Firestore;
    batch: ReturnType<typeof writeBatch>;
  }> {
    const firestore = (await getFirestore()) as Firestore;
    const batch = writeBatch(firestore);
    return { firestore, batch };
  }

  /**
   * Get collection reference for user
   */
  protected getCollectionRef(
    firestore: Firestore,
    userId: string,
    collectionName: string,
  ) {
    return collection(firestore, `users/${userId}/${collectionName}`);
  }

  /**
   * Get document reference for user collection
   */
  protected getDocRef(
    firestore: Firestore,
    userId: string,
    collectionName: string,
    docId: string,
  ) {
    return doc(firestore, `users/${userId}/${collectionName}`, docId);
  }

  /**
   * Get a remote document from Firestore
   */
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

      return this.snapshotToDBBase(docSnap);
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
   * Handle offline operations by queueing them
   */
  protected async handleOfflineOperation(
    collectionName: string,
    operation: "update" | "delete" | "create",
    payload: DBBase,
  ): Promise<void> {
    logger.debug(
      `App is offline, queueing ${operation} operation for ${collectionName}`,
    );
    await offlineQueue.queueOperation({
      type: operation,
      collectionName,
      payload,
      userId: payload.userId,
    });
  }

  /**
   * Initialize sync result structure
   */
  protected initializeSyncResult(): SyncResult {
    return {
      success: true,
      operations: {
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
      },
      conflicts: [],
      timestamp: new Date(),
    };
  }

  /**
   * Update sync result with operation counts
   */
  protected updateSyncResult(
    result: SyncResult,
    operation: "uploaded" | "downloaded" | "conflicts",
    count = 1,
  ): void {
    result.operations[operation] += count;
  }

  /**
   * Convert Date to Firestore Timestamp
   */
  protected toFirestoreTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  protected fromFirestoreTimestamp(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  /**
   * Log sync operation
   */
  protected logSyncOperation(
    operation: string,
    collectionName: string,
    userId: string,
    count?: number,
  ): void {
    logger.debug(`${operation} ${collectionName}`, {
      userId,
      count,
    });
  }

  // Helper: convert a Firestore document snapshot to DBBase
  protected snapshotToDBBase<T extends DBBase = DBBase>(
    docSnap: DocumentSnapshot,
  ): T {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...(data as Record<string, unknown>),
    } as unknown as T;
  }

  /**
   * Abstract methods to be implemented by specific sync services
   */
  abstract syncCollection(
    userId: string,
    options?: SyncOptions,
  ): Promise<SyncResult>;

  abstract getPendingDocs(userId: string): Promise<DBBase[]>;

  abstract markDocsAsSynced(ids: string[]): Promise<void>;

  abstract applyRemoteChanges(
    docs: DBBase[],
    result?: SyncResult,
  ): Promise<void>;
}
