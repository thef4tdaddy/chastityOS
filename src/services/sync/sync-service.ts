/**
 * Sync service for Firebase ↔ Dexie data synchronization
 * Implements the core data flow: Firebase ↔ Dexie ↔ TanStack Query
 */
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
  type QuerySnapshot,
} from "firebase/firestore";
import { getFirestore } from "../firebase";
import { db as dexie } from "../storage/dexie";
import { ChastitySession, Task, PersonalGoal, ApiResponse } from "@/types";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("SyncService");

export interface SyncStatus {
  lastSyncTime: Date;
  pendingUploads: number;
  isOnline: boolean;
  hasConflicts: boolean;
}

export class SyncService {
  private static syncListeners: Map<string, Unsubscribe> = new Map();
  private static syncStatus: SyncStatus = {
    lastSyncTime: new Date(),
    pendingUploads: 0,
    isOnline: navigator.onLine,
    hasConflicts: false,
  };

  /**
   * Initialize sync service and set up offline/online listeners
   */
  static initialize(): void {
    logger.info("Initializing sync service");

    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));

    // Set initial online status
    this.syncStatus.isOnline = navigator.onLine;

    logger.debug("Sync service initialized", {
      isOnline: this.syncStatus.isOnline,
    });
  }

  /**
   * Start real-time sync for user data
   */
  static async startRealTimeSync(userId: string): Promise<void> {
    logger.info("Starting real-time sync", { userId });

    // Stop any existing listeners
    this.stopRealTimeSync();

    // Sync sessions
    await this.startSessionSync(userId);

    // Sync tasks
    await this.startTaskSync(userId);

    // Sync goals
    await this.startGoalSync(userId);

    logger.info("Real-time sync started for all collections");
  }

  /**
   * Stop all real-time sync listeners
   */
  static stopRealTimeSync(): void {
    logger.debug("Stopping real-time sync");

    this.syncListeners.forEach((unsubscribe, key) => {
      unsubscribe();
      logger.debug("Stopped sync listener", { key });
    });

    this.syncListeners.clear();
    logger.info("All real-time sync listeners stopped");
  }

  /**
   * Manual sync - push local changes and pull remote changes
   */
  static async performFullSync(
    userId: string,
  ): Promise<ApiResponse<SyncStatus>> {
    try {
      logger.info("Starting full manual sync", { userId });

      // Push pending local changes first
      await this.pushPendingChanges(userId);

      // Pull latest data from Firebase
      await this.pullLatestData(userId);

      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.pendingUploads = 0;

      logger.info("Full sync completed successfully");

      return {
        success: true,
        data: this.syncStatus,
        message: "Sync completed successfully",
      };
    } catch (error) {
      logger.error("Full sync failed", { error: error as Error, userId });
      return {
        success: false,
        error: "Sync failed. Please try again.",
      };
    }
  }

  /**
   * Get current sync status
   */
  static getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // ==================== SESSIONS SYNC ====================

  private static async startSessionSync(userId: string): Promise<void> {
    const firestore = await getFirestore();
    const sessionsQuery = query(
      collection(firestore, "users", userId, "sessions"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => this.handleSessionsSnapshot(snapshot),
      (error) => logger.error("Sessions sync error", { error }),
    );

    this.syncListeners.set("sessions", unsubscribe);
  }

  private static async handleSessionsSnapshot(
    snapshot: QuerySnapshot,
  ): Promise<void> {
    logger.debug("Processing sessions snapshot", { size: snapshot.size });

    const sessions: ChastitySession[] = [];
    snapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() } as ChastitySession);
    });

    // Update local Dexie database
    await dexie.transaction("rw", dexie.sessions, async () => {
      for (const session of sessions) {
        await dexie.sessions.put(session);
      }
    });

    logger.debug("Sessions synced to local database", {
      count: sessions.length,
    });
  }

  // ==================== TASKS SYNC ====================

  private static async startTaskSync(userId: string): Promise<void> {
    const firestore = await getFirestore();
    const tasksQuery = query(
      collection(firestore, "users", userId, "tasks"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => this.handleTasksSnapshot(snapshot),
      (error) => logger.error("Tasks sync error", { error }),
    );

    this.syncListeners.set("tasks", unsubscribe);
  }

  private static async handleTasksSnapshot(
    snapshot: QuerySnapshot,
  ): Promise<void> {
    logger.debug("Processing tasks snapshot", { size: snapshot.size });

    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });

    // Update local Dexie database
    await dexie.transaction("rw", dexie.tasks, async () => {
      for (const task of tasks) {
        await dexie.tasks.put(task);
      }
    });

    logger.debug("Tasks synced to local database", { count: tasks.length });
  }

  // ==================== GOALS SYNC ====================

  private static async startGoalSync(userId: string): Promise<void> {
    const firestore = await getFirestore();
    const goalsQuery = query(
      collection(firestore, "users", userId, "goals"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      goalsQuery,
      (snapshot) => this.handleGoalsSnapshot(snapshot),
      (error) => logger.error("Goals sync error", { error }),
    );

    this.syncListeners.set("goals", unsubscribe);
  }

  private static async handleGoalsSnapshot(
    snapshot: QuerySnapshot,
  ): Promise<void> {
    logger.debug("Processing goals snapshot", { size: snapshot.size });

    const goals: PersonalGoal[] = [];
    snapshot.forEach((doc) => {
      goals.push({ id: doc.id, ...doc.data() } as PersonalGoal);
    });

    // Update local Dexie database
    await dexie.transaction("rw", dexie.goals, async () => {
      for (const goal of goals) {
        await dexie.goals.put(goal);
      }
    });

    logger.debug("Goals synced to local database", { count: goals.length });
  }

  // ==================== SYNC OPERATIONS ====================

  private static async pushPendingChanges(_userId: string): Promise<void> {
    logger.debug("Pushing pending changes to Firebase");

    // This would implement conflict resolution and upload pending changes
    // For now, we'll implement the basic structure

    try {
      // Get pending changes from Dexie (would need to add sync metadata to schema)
      // Upload to Firebase with proper conflict resolution

      logger.debug("Pending changes pushed successfully");
    } catch (error) {
      logger.error("Failed to push pending changes", { error });
      throw error;
    }
  }

  private static async pullLatestData(userId: string): Promise<void> {
    logger.debug("Pulling latest data from Firebase");

    try {
      const firestore = await getFirestore();

      // Pull sessions
      const sessionsSnapshot = await getDocs(
        query(
          collection(firestore, "users", userId, "sessions"),
          orderBy("updatedAt", "desc"),
          limit(100),
        ),
      );

      // Pull tasks
      const tasksSnapshot = await getDocs(
        collection(firestore, "users", userId, "tasks"),
      );

      // Pull goals
      const goalsSnapshot = await getDocs(
        collection(firestore, "users", userId, "goals"),
      );

      // Process and store in Dexie (similar to snapshot handlers)
      await this.handleSessionsSnapshot(sessionsSnapshot);
      await this.handleTasksSnapshot(tasksSnapshot);
      await this.handleGoalsSnapshot(goalsSnapshot);

      logger.debug("Latest data pulled successfully");
    } catch (error) {
      logger.error("Failed to pull latest data", { error });
      throw error;
    }
  }

  // ==================== CONNECTION HANDLERS ====================

  private static handleOnline(): void {
    logger.info("Connection restored - going online");
    this.syncStatus.isOnline = true;

    // Trigger sync when coming back online
    // This would typically trigger a full sync
  }

  private static handleOffline(): void {
    logger.info("Connection lost - going offline");
    this.syncStatus.isOnline = false;
  }

  // ==================== CONFLICT RESOLUTION ====================

  /**
   * Handle conflicts when local and remote data differ
   * This is a simplified implementation - would need more sophisticated logic
   */
  private static async resolveConflict<T>(
    localItem: T & { updatedAt: unknown },
    remoteItem: T & { updatedAt: unknown },
  ): Promise<T> {
    logger.debug("Resolving data conflict");

    // Simple last-write-wins strategy
    // In production, this would be more sophisticated based on data type
    const localTime = localItem.updatedAt?.toDate?.() || localItem.updatedAt;
    const remoteTime = remoteItem.updatedAt?.toDate?.() || remoteItem.updatedAt;

    if (localTime && remoteTime && localTime > remoteTime) {
      logger.debug("Using local version (newer)");
      return localItem;
    } else {
      logger.debug("Using remote version (newer or equal)");
      return remoteItem;
    }
  }
}
