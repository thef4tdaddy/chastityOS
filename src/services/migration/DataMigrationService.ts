/**
 * Data Migration Service
 * Handles migration from single-user to relationship-based architecture
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { getFirestore } from "../firebase";
import { relationshipService } from "../database/relationships";
import {
  Relationship,
  RelationshipStatus,
  RelationshipChastityData,
  RelationshipSession,
  RelationshipTask,
  RelationshipEvent,
  RelationshipTaskStatus,
} from "../../types/relationships";
import { serviceLogger } from "../../utils/logging";
import { generateUUID } from "../../utils";

const logger = serviceLogger("DataMigrationService");

export interface MigrationResult {
  success: boolean;
  relationshipId?: string;
  migratedSessions: number;
  migratedTasks: number;
  migratedEvents: number;
  errors: string[];
}

class DataMigrationService {
  private db: Firestore | null = null;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    this.db = await getFirestore();
  }

  private async ensureDb(): Promise<Firestore> {
    if (!this.db) {
      await this.initializeDb();
    }
    if (!this.db) {
      throw new Error("Failed to initialize Firestore database");
    }
    return this.db;
  }

  /**
   * Migrate single-user data to relationship-based architecture
   * This creates a "self-relationship" where user is both submissive and keyholder
   */
  async migrateSingleUserData(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedSessions: 0,
      migratedTasks: 0,
      migratedEvents: 0,
      errors: [],
    };

    try {
      const db = await this.ensureDb();

      // Check if migration is needed
      const validationResult = await this.validateMigrationEligibility(userId);
      if (!validationResult.isEligible) {
        result.errors.push(validationResult.reason);
        return result;
      }

      // Set up relationship and chastity data
      const relationshipId = generateUUID();
      const batch = writeBatch(db);
      await this.setupRelationshipAndChastityData(
        batch,
        userId,
        relationshipId,
      );

      // Migrate data collections
      const sessionCount = await this.migrateSessionsData(
        batch,
        userId,
        relationshipId,
        result,
      );
      const taskCount = await this.migrateTasksData(
        batch,
        userId,
        relationshipId,
        result,
      );
      const eventCount = await this.migrateEventsData(
        batch,
        userId,
        relationshipId,
        result,
      );

      // Commit all changes
      await this.executeMigrationBatch(batch);

      // Update results
      result.success = true;
      result.relationshipId = relationshipId;
      result.migratedSessions = sessionCount;
      result.migratedTasks = taskCount;
      result.migratedEvents = eventCount;

      logger.info("Successfully migrated single-user data", {
        userId,
        relationshipId,
        result,
      });
    } catch (error) {
      result.errors.push(`Migration failed: ${(error as Error).message}`);
      logger.error("Failed to migrate single-user data", {
        error: error as Error,
        userId,
      });
    }

    return result;
  }

  /**
   * Validate if user is eligible for migration
   */
  private async validateMigrationEligibility(
    userId: string,
  ): Promise<{ isEligible: boolean; reason: string }> {
    const existingRelationships =
      await relationshipService.getUserRelationships(userId);
    if (existingRelationships.length > 0) {
      return {
        isEligible: false,
        reason: "User already has relationships - migration not needed",
      };
    }
    return { isEligible: true, reason: "" };
  }

  /**
   * Set up relationship and chastity data structures
   */
  private async setupRelationshipAndChastityData(
    batch: any,
    userId: string,
    relationshipId: string,
  ): Promise<void> {
    const db = await this.ensureDb();

    // Create relationship
    const relationship = this.createSelfRelationship(userId, relationshipId);
    batch.set(doc(db, "relationships", relationshipId), {
      ...relationship,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      establishedAt: serverTimestamp(),
    });

    // Create chastity data
    const chastityData = this.createChastityData(userId, relationshipId);
    batch.set(doc(db, "chastityData", relationshipId), {
      ...chastityData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Create self-relationship configuration
   */
  private createSelfRelationship(
    userId: string,
    relationshipId: string,
  ): Omit<Relationship, "createdAt" | "updatedAt" | "establishedAt"> {
    return {
      id: relationshipId,
      submissiveId: userId,
      keyholderId: userId, // Self-relationship
      status: RelationshipStatus.ACTIVE,
      permissions: {
        keyholderCanEdit: {
          sessions: true,
          tasks: true,
          goals: true,
          punishments: true,
          settings: true,
        },
        submissiveCanPause: true,
        emergencyUnlock: true,
        requireApproval: {
          sessionEnd: false,
          taskCompletion: false,
          goalChanges: false,
        },
      },
      notes: "Migrated from single-user system",
    };
  }

  /**
   * Create chastity data configuration
   */
  private createChastityData(
    userId: string,
    relationshipId: string,
  ): Omit<RelationshipChastityData, "createdAt" | "updatedAt"> {
    return {
      relationshipId,
      submissiveId: userId,
      keyholderId: userId,
      currentSession: {
        id: "",
        isActive: false,
        startTime: serverTimestamp() as any,
        accumulatedPauseTime: 0,
        keyholderApprovalRequired: false,
      },
      goals: {
        personal: {
          duration: 0,
          type: "soft",
          setBy: "submissive",
        },
        keyholder: {
          minimumDuration: 0,
          canBeModified: true,
        },
      },
      settings: {
        allowPausing: true,
        pauseCooldown: 300,
        requireReasonForEnd: false,
        trackingEnabled: true,
      },
    };
  }

  /**
   * Migrate sessions data to new relationship structure
   */
  private async migrateSessionsData(
    batch: any,
    userId: string,
    relationshipId: string,
    result: MigrationResult,
  ): Promise<number> {
    try {
      const db = await this.ensureDb();
      const sessionsSnapshot = await getDocs(
        collection(db, "users", userId, "sessions"),
      );
      let migratedCount = 0;

      for (const sessionDoc of sessionsSnapshot.docs) {
        const oldSession = sessionDoc.data();
        const newSession = this.transformSessionData(
          sessionDoc.id,
          relationshipId,
          oldSession,
        );

        batch.set(
          doc(db, "chastityData", relationshipId, "sessions", sessionDoc.id),
          {
            ...newSession,
            createdAt: oldSession.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );
        migratedCount++;
      }

      return migratedCount;
    } catch (error) {
      result.errors.push(
        `Failed to migrate sessions: ${(error as Error).message}`,
      );
      return 0;
    }
  }

  /**
   * Transform session data to new format
   */
  private transformSessionData(
    sessionId: string,
    relationshipId: string,
    oldSession: any,
  ): Omit<RelationshipSession, "createdAt" | "updatedAt"> {
    return {
      id: sessionId,
      relationshipId,
      startTime: oldSession.startTime || serverTimestamp(),
      endTime: oldSession.endTime,
      duration: oldSession.duration || 0,
      effectiveDuration:
        oldSession.effectiveDuration || oldSession.duration || 0,
      events: [], // Legacy sessions won't have detailed events
      goalMet: oldSession.goalMet || false,
      keyholderApproval: {
        required: false,
        granted: true,
      },
    };
  }

  /**
   * Migrate tasks data to new relationship structure
   */
  private async migrateTasksData(
    batch: any,
    userId: string,
    relationshipId: string,
    result: MigrationResult,
  ): Promise<number> {
    try {
      const db = await this.ensureDb();
      const tasksSnapshot = await getDocs(
        collection(db, "users", userId, "tasks"),
      );
      let migratedCount = 0;

      for (const taskDoc of tasksSnapshot.docs) {
        const oldTask = taskDoc.data();
        const newTask = this.transformTaskData(
          taskDoc.id,
          relationshipId,
          oldTask,
        );

        batch.set(
          doc(db, "chastityData", relationshipId, "tasks", taskDoc.id),
          {
            ...newTask,
            createdAt: oldTask.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );
        migratedCount++;
      }

      return migratedCount;
    } catch (error) {
      result.errors.push(
        `Failed to migrate tasks: ${(error as Error).message}`,
      );
      return 0;
    }
  }

  /**
   * Transform task data to new format
   */
  private transformTaskData(
    taskId: string,
    relationshipId: string,
    oldTask: any,
  ): Omit<RelationshipTask, "createdAt" | "updatedAt"> {
    return {
      id: taskId,
      relationshipId,
      text: oldTask.text || "Migrated task",
      assignedBy: "submissive", // Assume self-assigned for migration
      assignedTo: "submissive",
      dueDate: oldTask.dueDate,
      status: this.mapTaskStatus(oldTask.status),
      submittedAt: oldTask.submittedAt,
      approvedAt: oldTask.approvedAt,
      completedAt: oldTask.completedAt,
      submissiveNote: oldTask.submissiveNote,
      keyholderFeedback: oldTask.keyholderFeedback,
      consequence: oldTask.consequence,
    };
  }

  /**
   * Migrate events data to new relationship structure
   */
  private async migrateEventsData(
    batch: any,
    userId: string,
    relationshipId: string,
    result: MigrationResult,
  ): Promise<number> {
    try {
      const db = await this.ensureDb();
      const eventsSnapshot = await getDocs(
        collection(db, "users", userId, "events"),
      );
      let migratedCount = 0;

      for (const eventDoc of eventsSnapshot.docs) {
        const oldEvent = eventDoc.data();
        const newEvent = this.transformEventData(
          eventDoc.id,
          relationshipId,
          oldEvent,
        );

        batch.set(
          doc(db, "chastityData", relationshipId, "events", eventDoc.id),
          {
            ...newEvent,
            createdAt: oldEvent.createdAt || serverTimestamp(),
          },
        );
        migratedCount++;
      }

      return migratedCount;
    } catch (error) {
      result.errors.push(
        `Failed to migrate events: ${(error as Error).message}`,
      );
      return 0;
    }
  }

  /**
   * Transform event data to new format
   */
  private transformEventData(
    eventId: string,
    relationshipId: string,
    oldEvent: any,
  ): Omit<RelationshipEvent, "createdAt"> {
    return {
      id: eventId,
      relationshipId,
      type: this.mapEventType(oldEvent.type),
      timestamp: oldEvent.timestamp || serverTimestamp(),
      details: {
        duration: oldEvent.details?.duration,
        notes: oldEvent.details?.notes || oldEvent.notes,
        mood: oldEvent.details?.mood,
        participants: ["submissive"], // Default for migration
      },
      loggedBy: "submissive",
      isPrivate: oldEvent.isPrivate || false,
      tags: oldEvent.tags || [],
    };
  }

  /**
   * Execute the migration batch commit
   */
  private async executeMigrationBatch(batch: any): Promise<void> {
    await batch.commit();
  }

  /**
   * Check if a user needs data migration
   */
  async needsMigration(userId: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();

      // Check if user has relationships
      const relationships =
        await relationshipService.getUserRelationships(userId);
      if (relationships.length > 0) {
        return false; // Already has relationships
      }

      // Check if user has legacy data
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        return false; // No data to migrate
      }

      // Check for legacy collections
      const sessionsSnapshot = await getDocs(
        collection(db, "users", userId, "sessions"),
      );
      const tasksSnapshot = await getDocs(
        collection(db, "users", userId, "tasks"),
      );
      const eventsSnapshot = await getDocs(
        collection(db, "users", userId, "events"),
      );

      const hasLegacyData =
        !sessionsSnapshot.empty ||
        !tasksSnapshot.empty ||
        !eventsSnapshot.empty;

      logger.debug("Checked migration status", {
        userId,
        hasLegacyData,
        sessionsCount: sessionsSnapshot.size,
        tasksCount: tasksSnapshot.size,
        eventsCount: eventsSnapshot.size,
      });

      return hasLegacyData;
    } catch (error) {
      logger.error("Failed to check migration status", {
        error: error as Error,
        userId,
      });
      return false;
    }
  }

  /**
   * Create a relationship invitation for migrated users
   * This allows them to invite a keyholder after migration
   */
  async createPostMigrationInvitation(
    userId: string,
    keyholderEmail: string,
    message?: string,
  ): Promise<string> {
    try {
      // This would create a special invitation type for post-migration
      // The keyholder would join the existing self-relationship
      // For now, use the standard relationship request system

      // First, get user's email from their profile
      const userDoc = await getDoc(doc(await this.ensureDb(), "users", userId));
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      // This is a placeholder for the actual invitation system
      // In a real implementation, you'd send an email invitation
      // with a special link to join the existing relationship

      logger.info("Created post-migration invitation", {
        userId,
        keyholderEmail,
        message,
      });

      return generateUUID(); // Return invitation ID
    } catch (error) {
      logger.error("Failed to create post-migration invitation", {
        error: error as Error,
        userId,
        keyholderEmail,
      });
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Map legacy task status to new status
   */
  private mapTaskStatus(oldStatus: string | unknown): RelationshipTaskStatus {
    const statusMap: Record<string, RelationshipTaskStatus> = {
      pending: RelationshipTaskStatus.PENDING,
      in_progress: RelationshipTaskStatus.PENDING,
      submitted: RelationshipTaskStatus.SUBMITTED,
      approved: RelationshipTaskStatus.APPROVED,
      rejected: RelationshipTaskStatus.REJECTED,
      completed: RelationshipTaskStatus.COMPLETED,
      overdue: RelationshipTaskStatus.PENDING, // Reset overdue to pending
    };

    if (typeof oldStatus === "string" && statusMap[oldStatus]) {
      return statusMap[oldStatus];
    }

    return RelationshipTaskStatus.PENDING; // Default fallback
  }

  /**
   * Map legacy event type to new event type
   */
  private mapEventType(
    oldType: string | unknown,
  ): "orgasm" | "sexual_activity" | "milestone" | "note" {
    const typeMap: Record<
      string,
      "orgasm" | "sexual_activity" | "milestone" | "note"
    > = {
      orgasm: "orgasm",
      sexual_activity: "sexual_activity",
      milestone: "milestone",
      note: "note",
      session_start: "note", // Convert to note
      session_end: "note", // Convert to note
      session_pause: "note", // Convert to note
      session_resume: "note", // Convert to note
    };

    if (typeof oldType === "string" && typeMap[oldType]) {
      return typeMap[oldType];
    }

    return "note"; // Default fallback
  }

  /**
   * Clean up legacy data after successful migration
   * WARNING: This permanently deletes old data
   */
  async cleanupLegacyData(userId: string): Promise<void> {
    try {
      const db = await this.ensureDb();
      const batch = writeBatch(db);

      // Delete legacy collections
      const collections = ["sessions", "tasks", "events", "eventLog"];

      for (const collectionName of collections) {
        const snapshot = await getDocs(
          collection(db, "users", userId, collectionName),
        );
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      await batch.commit();

      logger.info("Cleaned up legacy data", {
        userId,
        collectionsDeleted: collections.length,
      });
    } catch (error) {
      logger.error("Failed to cleanup legacy data", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

export const dataMigrationService = new DataMigrationService();
