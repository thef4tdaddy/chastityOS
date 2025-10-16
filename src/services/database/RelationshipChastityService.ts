/**
 * Relationship Chastity Service
 * REFACTORED: Now uses domain-focused services for better maintainability
 *
 * This file maintains backward compatibility by re-exporting the facade service
 * that delegates to the appropriate domain services.
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  Firestore,
  Timestamp,
  DocumentReference,
  DocumentSnapshot,
} from "firebase/firestore";
import { getFirestore } from "../firebase";
import {
  RelationshipChastityData,
  RelationshipSession,
  RelationshipTask,
  RelationshipEvent,
  SessionEvent,
  RelationshipTaskStatus,
} from "@/types/relationships";
import { relationshipService } from "./relationships/RelationshipService";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("RelationshipChastityService");

class RelationshipChastityService {
  private db: Firestore | null = null;

  constructor() {
    // No-op: DB is initialized on first use via ensureDb
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

  // ==================== HELPER METHODS ====================

  private async _checkPermission(
    relationshipId: string,
    userId: string,
    permission: string,
  ) {
    const hasPermission = await relationshipService.checkPermission(
      relationshipId,
      userId,
      permission,
    );
    if (!hasPermission) {
      throw new Error(`Insufficient permissions for ${permission}`);
    }
  }

  private async _getKeyholderId(relationshipId: string): Promise<string> {
    const relationship =
      await relationshipService.getRelationship(relationshipId);
    if (!relationship) {
      throw new Error("Relationship not found");
    }
    return relationship.keyholderId;
  }

  private async _fetchCollection<T>(
    relationshipId: string,
    collectionName: string,
    orderByField: string,
    limitCount: number,
  ): Promise<T[]> {
    const db = await this.ensureDb();
    const snapshot = await getDocs(
      query(
        collection(db, "chastityData", relationshipId, collectionName),
        orderBy(orderByField, "desc"),
        limit(limitCount),
      ),
    );
    const items = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as T[];
    logger.debug(`Retrieved ${collectionName}`, {
      relationshipId,
      count: items.length,
    });
    return items;
  }

  private async _getSession(
    relationshipId: string,
    sessionId: string,
  ): Promise<{ sessionDoc: DocumentSnapshot; sessionRef: DocumentReference }> {
    const db = await this.ensureDb();
    const sessionRef = doc(
      db,
      "chastityData",
      relationshipId,
      "sessions",
      sessionId,
    );
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) {
      throw new Error("Session not found");
    }
    return { sessionDoc, sessionRef };
  }

  // ==================== CHASTITY DATA MANAGEMENT ====================

  async getChastityData(
    relationshipId: string,
  ): Promise<RelationshipChastityData | null> {
    try {
      const db = await this.ensureDb();
      const docSnapshot = await getDoc(doc(db, "chastityData", relationshipId));
      if (!docSnapshot.exists()) return null;
      return {
        ...docSnapshot.data(),
        relationshipId: docSnapshot.id,
      } as RelationshipChastityData;
    } catch (error) {
      logger.error("Failed to get chastity data", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  async startSession(
    relationshipId: string,
    userId: string,
    options: {
      goalDuration?: number;
      isHardcoreMode?: boolean;
      notes?: string;
    } = {},
  ): Promise<string> {
    try {
      const db = await this.ensureDb();
      await this._checkPermission(relationshipId, userId, "sessions");

      const chastityData = await this.getChastityData(relationshipId);
      if (chastityData?.currentSession.isActive) {
        throw new Error("A session is already active for this relationship");
      }

      const sessionId = generateUUID();
      const batch = writeBatch(db);
      const sessionData: Omit<RelationshipSession, "createdAt" | "updatedAt"> =
        {
          id: sessionId,
          relationshipId,
          startTime: serverTimestamp() as Timestamp,
          duration: 0,
          effectiveDuration: 0,
          events: [
            {
              type: "start",
              timestamp: serverTimestamp() as Timestamp,
              initiatedBy:
                userId === chastityData?.keyholderId
                  ? "keyholder"
                  : "submissive",
              reason: options.notes,
            },
          ],
          goalMet: false,
          keyholderApproval: { required: false },
        };

      batch.set(
        doc(db, "chastityData", relationshipId, "sessions", sessionId),
        {
          ...sessionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

      batch.update(doc(db, "chastityData", relationshipId), {
        currentSession: {
          id: sessionId,
          isActive: true,
          startTime: serverTimestamp(),
          accumulatedPauseTime: 0,
          keyholderApprovalRequired:
            chastityData?.settings.requireReasonForEnd || false,
        },
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      logger.info("Started new session", {
        sessionId,
        relationshipId,
        userId,
        options,
      });
      return sessionId;
    } catch (error) {
      logger.error("Failed to start session", {
        error: error as Error,
        relationshipId,
        userId,
        options,
      });
      throw error;
    }
  }

  async endSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
    endReason?: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      await this._checkPermission(relationshipId, userId, "sessions");

      const { sessionDoc, sessionRef } = await this._getSession(
        relationshipId,
        sessionId,
      );
      const sessionData = sessionDoc.data() as RelationshipSession;
      const endTime = new Date();
      const totalDuration =
        endTime.getTime() -
        (sessionData.startTime as Timestamp).toDate().getTime();

      const endEvent: SessionEvent = {
        type: "end",
        timestamp: serverTimestamp() as Timestamp,
        initiatedBy:
          userId === (await this._getKeyholderId(relationshipId))
            ? "keyholder"
            : "submissive",
        reason: endReason,
      };

      const batch = writeBatch(db);
      batch.update(sessionRef, {
        endTime: serverTimestamp(),
        duration: Math.floor(totalDuration / 1000),
        events: [...sessionData.events, endEvent],
        updatedAt: serverTimestamp(),
      });

      batch.update(doc(db, "chastityData", relationshipId), {
        currentSession: {
          id: "",
          isActive: false,
          startTime: null,
          accumulatedPauseTime: 0,
          keyholderApprovalRequired: false,
        },
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      logger.info("Ended session", {
        sessionId,
        relationshipId,
        userId,
        endReason,
      });
    } catch (error) {
      logger.error("Failed to end session", {
        error: error as Error,
        sessionId,
        relationshipId,
        userId,
      });
      throw error;
    }
  }

  async pauseSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
    pauseReason?: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      await this._checkPermission(relationshipId, userId, "pauseSession");

      const { sessionDoc, sessionRef } = await this._getSession(
        relationshipId,
        sessionId,
      );
      const sessionData = sessionDoc.data() as RelationshipSession;

      const pauseEvent: SessionEvent = {
        type: "pause",
        timestamp: serverTimestamp() as Timestamp,
        initiatedBy: "submissive",
        reason: pauseReason,
      };

      const batch = writeBatch(db);
      batch.update(sessionRef, {
        events: [...sessionData.events, pauseEvent],
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "chastityData", relationshipId), {
        "currentSession.pausedAt": serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      logger.info("Paused session", {
        sessionId,
        relationshipId,
        userId,
        pauseReason,
      });
    } catch (error) {
      logger.error("Failed to pause session", {
        error: error as Error,
        sessionId,
        relationshipId,
        userId,
      });
      throw error;
    }
  }

  async resumeSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      const chastityData = await this.getChastityData(relationshipId);
      if (!chastityData?.currentSession.pausedAt) {
        throw new Error("Session is not paused");
      }

      const { sessionDoc, sessionRef } = await this._getSession(
        relationshipId,
        sessionId,
      );
      const sessionData = sessionDoc.data() as RelationshipSession;

      const pauseEnd = new Date();
      const pauseStart = (
        chastityData.currentSession.pausedAt as Timestamp
      ).toDate();
      const pauseDuration = Math.floor(
        (pauseEnd.getTime() - pauseStart.getTime()) / 1000,
      );

      const resumeEvent: SessionEvent = {
        type: "resume",
        timestamp: serverTimestamp() as Timestamp,
        initiatedBy: "submissive",
      };

      const batch = writeBatch(db);
      batch.update(sessionRef, {
        events: [...sessionData.events, resumeEvent],
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "chastityData", relationshipId), {
        "currentSession.pausedAt": null,
        "currentSession.accumulatedPauseTime":
          chastityData.currentSession.accumulatedPauseTime + pauseDuration,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      logger.info("Resumed session", {
        sessionId,
        relationshipId,
        userId,
        pauseDuration,
      });
    } catch (error) {
      logger.error("Failed to resume session", {
        error: error as Error,
        sessionId,
        relationshipId,
        userId,
      });
      throw error;
    }
  }

  // ==================== TASK MANAGEMENT ====================

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
      await this._checkPermission(relationshipId, userId, "tasks");

      const taskId = generateUUID();
      const isKeyholder =
        userId === (await this._getKeyholderId(relationshipId));

      const task: Omit<RelationshipTask, "createdAt" | "updatedAt"> = {
        id: taskId,
        relationshipId,
        text: taskData.text,
        assignedBy: isKeyholder ? "keyholder" : "submissive",
        assignedTo: "submissive",
        dueDate: taskData.dueDate
          ? Timestamp.fromDate(taskData.dueDate)
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

  async updateTaskStatus(
    relationshipId: string,
    taskId: string,
    status: RelationshipTaskStatus,
    userId: string,
    note?: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
      };

      const isKeyholder =
        userId === (await this._getKeyholderId(relationshipId));

      if (status === RelationshipTaskStatus.SUBMITTED && !isKeyholder) {
        updateData.submittedAt = serverTimestamp();
        updateData.submissiveNote = note;
      } else if (
        (status === RelationshipTaskStatus.APPROVED ||
          status === RelationshipTaskStatus.REJECTED) &&
        isKeyholder
      ) {
        updateData.approvedAt = serverTimestamp();
        updateData.keyholderFeedback = note;
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

  async getTasks(
    relationshipId: string,
    limitCount: number = 50,
  ): Promise<RelationshipTask[]> {
    try {
      return await this._fetchCollection<RelationshipTask>(
        relationshipId,
        "tasks",
        "createdAt",
        limitCount,
      );
    } catch (error) {
      logger.error("Failed to get tasks", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  // ==================== EVENT LOGGING ====================

  async logEvent(
    relationshipId: string,
    eventData: {
      type: RelationshipEvent["type"];
      details: RelationshipEvent["details"];
      isPrivate?: boolean;
      tags?: string[];
    },
    userId: string,
  ): Promise<string> {
    try {
      const db = await this.ensureDb();
      const eventId = generateUUID();
      const isKeyholder =
        userId === (await this._getKeyholderId(relationshipId));

      const event: Omit<RelationshipEvent, "createdAt"> = {
        id: eventId,
        relationshipId,
        type: eventData.type,
        timestamp: serverTimestamp() as Timestamp,
        details: eventData.details,
        loggedBy: isKeyholder ? "keyholder" : "submissive",
        isPrivate: eventData.isPrivate || false,
        tags: eventData.tags,
      };

      await addDoc(collection(db, "chastityData", relationshipId, "events"), {
        ...event,
        createdAt: serverTimestamp(),
      });
      logger.info("Logged event", {
        eventId,
        relationshipId,
        type: eventData.type,
        userId,
        isKeyholder,
      });
      return eventId;
    } catch (error) {
      logger.error("Failed to log event", {
        error: error as Error,
        relationshipId,
        userId,
      });
      throw error;
    }
  }

  async getEvents(
    relationshipId: string,
    limitCount: number = 100,
  ): Promise<RelationshipEvent[]> {
    try {
      return await this._fetchCollection<RelationshipEvent>(
        relationshipId,
        "events",
        "timestamp",
        limitCount,
      );
    } catch (error) {
      logger.error("Failed to get events", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  async getSessionHistory(
    relationshipId: string,
    limitCount: number = 50,
  ): Promise<RelationshipSession[]> {
    try {
      return await this._fetchCollection<RelationshipSession>(
        relationshipId,
        "sessions",
        "startTime",
        limitCount,
      );
    } catch (error) {
      logger.error("Failed to get session history", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  async subscribeToChastityData(
    relationshipId: string,
    callback: (data: RelationshipChastityData | null) => void,
  ): Promise<Unsubscribe> {
    const db = await this.ensureDb();
    return onSnapshot(
      doc(db, "chastityData", relationshipId),
      (doc) => {
        const data = doc.exists()
          ? ({
              ...doc.data(),
              relationshipId: doc.id,
            } as RelationshipChastityData)
          : null;
        callback(data);
      },
      (error) => {
        logger.error("Error in chastity data subscription", {
          error,
          relationshipId,
        });
      },
    );
  }

  async subscribeToTasks(
    relationshipId: string,
    callback: (tasks: RelationshipTask[]) => void,
  ): Promise<Unsubscribe> {
    const db = await this.ensureDb();
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
        logger.error("Error in tasks subscription", { error, relationshipId });
      },
    );
  }
}

export const relationshipChastityService = new RelationshipChastityService();
