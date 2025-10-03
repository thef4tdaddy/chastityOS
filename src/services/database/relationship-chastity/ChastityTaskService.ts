/**
 * Chastity Task Service
 * Handles task creation, updates, and management
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  Firestore,
  FieldValue,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import {
  RelationshipTask,
  RelationshipTaskStatus,
} from "@/types/relationships";
import { relationshipService } from "../relationships/RelationshipService";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";
import { relationshipCoreService } from "./RelationshipCoreService";

const logger = serviceLogger("ChastityTaskService");

class ChastityTaskService {
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
      throw new Error("Failed to initialize Firestore");
    }
    return this.db;
  }

  private getDb(): Firestore {
    if (!this.db) {
      throw new Error("Firestore not initialized. Call ensureDb() first.");
    }
    return this.db;
  }

  // ==================== TASK MANAGEMENT ====================

  /**
   * Create a new task
   */
  async createTask(
    relationshipId: string,
    taskData: {
      text: string;
      dueDate?: Date;
      consequence?: RelationshipTask["consequence"];
    },
    userId: string,
  ): Promise<string> {
    try {
      const db = await this.ensureDb();

      // Check permissions
      const hasPermission = await relationshipService.checkPermission(
        relationshipId,
        userId,
        "tasks",
      );

      if (!hasPermission) {
        throw new Error("Insufficient permissions to create tasks");
      }

      const taskId = generateUUID();
      const isKeyholder =
        userId ===
        (await relationshipCoreService.getKeyholderId(relationshipId));

      const task: Omit<RelationshipTask, "createdAt" | "updatedAt"> = {
        id: taskId,
        relationshipId,
        text: taskData.text,
        assignedBy: isKeyholder ? "keyholder" : "submissive",
        assignedTo: "submissive",
        dueDate: taskData.dueDate
          ? (serverTimestamp() as unknown as Timestamp)
          : undefined,
        status: RelationshipTaskStatus.PENDING,
        consequence: taskData.consequence,
      };

      await addDoc(collection(db, "chastityData", relationshipId, "tasks"), {
        ...task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      logger.info("Created task", {
        taskId,
        relationshipId,
        userId,
        isKeyholder,
      });

      return taskId;
    } catch (error) {
      logger.error("Failed to create task", {
        error: error as Error,
        relationshipId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    relationshipId: string,
    taskId: string,
    status: RelationshipTaskStatus,
    userId: string,
    note?: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      const updateData: Record<string, FieldValue | string | number | boolean> =
        {
          status,
          updatedAt: serverTimestamp(),
        };

      // Add role-specific fields
      const isKeyholder =
        userId ===
        (await relationshipCoreService.getKeyholderId(relationshipId));

      if (status === RelationshipTaskStatus.SUBMITTED && !isKeyholder) {
        updateData.submittedAt = serverTimestamp();
        if (note) {
          updateData.submissiveNote = note;
        }
      } else if (
        (status === RelationshipTaskStatus.APPROVED ||
          status === RelationshipTaskStatus.REJECTED) &&
        isKeyholder
      ) {
        updateData.approvedAt = serverTimestamp();
        if (note) {
          updateData.keyholderFeedback = note;
        }
      } else if (status === RelationshipTaskStatus.COMPLETED) {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(
        doc(db, "chastityData", relationshipId, "tasks", taskId),
        updateData,
      );

      logger.info("Updated task status", {
        taskId,
        relationshipId,
        status,
        userId,
        isKeyholder,
      });
    } catch (error) {
      logger.error("Failed to update task status", {
        error: error as Error,
        taskId,
        relationshipId,
        status,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get tasks for a relationship
   */
  async getTasks(
    relationshipId: string,
    limitCount: number = 50,
  ): Promise<RelationshipTask[]> {
    try {
      const db = await this.ensureDb();

      const tasksSnapshot = await getDocs(
        query(
          collection(db, "chastityData", relationshipId, "tasks"),
          orderBy("createdAt", "desc"),
          limit(limitCount),
        ),
      );

      const tasks = tasksSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as RelationshipTask[];

      logger.debug("Retrieved tasks", {
        relationshipId,
        count: tasks.length,
      });

      return tasks;
    } catch (error) {
      logger.error("Failed to get tasks", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  /**
   * Subscribe to task changes
   */
  subscribeToTasks(
    relationshipId: string,
    callback: (tasks: RelationshipTask[]) => void,
  ): Unsubscribe {
    const db = this.getDb();
    return onSnapshot(
      query(
        collection(db, "chastityData", relationshipId, "tasks"),
        orderBy("createdAt", "desc"),
      ),
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as RelationshipTask[];
        callback(tasks);
      },
      (error) => {
        logger.error("Error in tasks subscription", {
          error,
          relationshipId,
        });
      },
    );
  }
}

export const chastityTaskService = new ChastityTaskService();
