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
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import { relationshipService } from "@/services/database/RelationshipService";
import {
  Relationship,
  RelationshipStatus,
  RelationshipChastityData,
  RelationshipSession,
  RelationshipTask,
  RelationshipEvent,
} from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

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
  private db: any = null;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    this.db = await getFirestore();
  }

  private async ensureDb() {
    if (!this.db) {
      await this.initializeDb();
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

      // Check if user already has relationships
      const existingRelationships = await relationshipService.getUserRelationships(userId);
      if (existingRelationships.length > 0) {
        result.errors.push("User already has relationships - migration not needed");
        return result;
      }

      // Create a self-relationship (user as both submissive and keyholder)
      const relationshipId = generateUUID();
      const relationship: Omit<Relationship, "createdAt" | "updatedAt" | "establishedAt"> = {
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

      const batch = writeBatch(db);

      // Create the relationship
      batch.set(doc(db, "relationships", relationshipId), {
        ...relationship,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        establishedAt: serverTimestamp(),
      });

      // Initialize chastity data
      const chastityData: Omit<RelationshipChastityData, "createdAt" | "updatedAt"> = {
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

      batch.set(doc(db, "chastityData", relationshipId), {
        ...chastityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Migrate existing sessions
      try {
        const sessionsSnapshot = await getDocs(collection(db, "users", userId, "sessions"));
        for (const sessionDoc of sessionsSnapshot.docs) {
          const oldSession = sessionDoc.data();
          
          const newSession: Omit<RelationshipSession, "createdAt" | "updatedAt"> = {
            id: sessionDoc.id,
            relationshipId,
            startTime: oldSession.startTime || serverTimestamp(),
            endTime: oldSession.endTime,
            duration: oldSession.duration || 0,
            effectiveDuration: oldSession.effectiveDuration || oldSession.duration || 0,
            events: [], // Legacy sessions won't have detailed events
            goalMet: oldSession.goalMet || false,
            keyholderApproval: {
              required: false,
              granted: true,
            },
          };

          batch.set(
            doc(db, "chastityData", relationshipId, "sessions", sessionDoc.id),
            {
              ...newSession,
              createdAt: oldSession.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
          );

          result.migratedSessions++;
        }
      } catch (error) {
        result.errors.push(`Failed to migrate sessions: ${(error as Error).message}`);
      }

      // Migrate existing tasks
      try {
        const tasksSnapshot = await getDocs(collection(db, "users", userId, "tasks"));
        for (const taskDoc of tasksSnapshot.docs) {
          const oldTask = taskDoc.data();
          
          const newTask: Omit<RelationshipTask, "createdAt" | "updatedAt"> = {
            id: taskDoc.id,
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

          batch.set(
            doc(db, "chastityData", relationshipId, "tasks", taskDoc.id),
            {
              ...newTask,
              createdAt: oldTask.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
          );

          result.migratedTasks++;
        }
      } catch (error) {
        result.errors.push(`Failed to migrate tasks: ${(error as Error).message}`);
      }

      // Migrate existing events
      try {
        const eventsSnapshot = await getDocs(collection(db, "users", userId, "events"));
        for (const eventDoc of eventsSnapshot.docs) {
          const oldEvent = eventDoc.data();
          
          const newEvent: Omit<RelationshipEvent, "createdAt"> = {
            id: eventDoc.id,
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

          batch.set(
            doc(db, "chastityData", relationshipId, "events", eventDoc.id),
            {
              ...newEvent,
              createdAt: oldEvent.createdAt || serverTimestamp(),
            }
          );

          result.migratedEvents++;
        }
      } catch (error) {
        result.errors.push(`Failed to migrate events: ${(error as Error).message}`);
      }

      // Commit all changes
      await batch.commit();

      result.success = true;
      result.relationshipId = relationshipId;

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
   * Check if a user needs data migration
   */
  async needsMigration(userId: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();

      // Check if user has relationships
      const relationships = await relationshipService.getUserRelationships(userId);
      if (relationships.length > 0) {
        return false; // Already has relationships
      }

      // Check if user has legacy data
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        return false; // No data to migrate
      }

      // Check for legacy collections
      const sessionsSnapshot = await getDocs(collection(db, "users", userId, "sessions"));
      const tasksSnapshot = await getDocs(collection(db, "users", userId, "tasks"));
      const eventsSnapshot = await getDocs(collection(db, "users", userId, "events"));

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
  private mapTaskStatus(oldStatus: any): any {
    const statusMap: Record<string, any> = {
      'pending': 'pending',
      'in_progress': 'pending',
      'submitted': 'submitted',
      'approved': 'approved',
      'rejected': 'rejected',
      'completed': 'completed',
      'overdue': 'pending', // Reset overdue to pending
    };

    return statusMap[oldStatus] || 'pending';
  }

  /**
   * Map legacy event type to new event type
   */
  private mapEventType(oldType: any): any {
    const typeMap: Record<string, any> = {
      'orgasm': 'orgasm',
      'sexual_activity': 'sexual_activity',
      'milestone': 'milestone',
      'note': 'note',
      'session_start': 'note', // Convert to note
      'session_end': 'note',   // Convert to note
      'session_pause': 'note', // Convert to note
      'session_resume': 'note',// Convert to note
    };

    return typeMap[oldType] || 'note';
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
      const collections = ['sessions', 'tasks', 'events', 'eventLog'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, "users", userId, collectionName));
        snapshot.docs.forEach(doc => {
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