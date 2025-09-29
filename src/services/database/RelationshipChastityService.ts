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
} from "firebase/firestore";
import { getFirestore } from "../firebase";
import {
  RelationshipChastityData,
  RelationshipSession,
  RelationshipTask,
  RelationshipEvent,
  SessionEvent,
  RelationshipTaskStatus,
} from "../../types/relationships";
import { relationshipService } from "./relationships/RelationshipService";
import { serviceLogger } from "../../utils/logging";
import { generateUUID } from "../../utils";

const logger = serviceLogger("RelationshipChastityService");

class RelationshipChastityService {
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

  // ==================== CHASTITY DATA MANAGEMENT ====================

  /**
   * Get chastity data for a relationship
   */
  async getChastityData(
    relationshipId: string,
  ): Promise<RelationshipChastityData | null> {
    try {
      const db = await this.ensureDb();
      const docSnapshot = await getDoc(doc(db, "chastityData", relationshipId));

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = {
        ...docSnapshot.data(),
        relationshipId: docSnapshot.id,
      } as RelationshipChastityData;

      logger.debug("Retrieved chastity data", { relationshipId });
      return data;
    } catch (error) {
      logger.error("Failed to get chastity data", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  /**
   * Update chastity data settings
   */
  async updateChastitySettings(
    relationshipId: string,
    settings: Partial<RelationshipChastityData["settings"]>,
    userId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Check permissions
      const hasPermission = await relationshipService.checkPermission(
        relationshipId,
        userId,
        "settings",
      );

      if (!hasPermission) {
        throw new Error("Insufficient permissions to update settings");
      }

      await updateDoc(doc(db, "chastityData", relationshipId), {
        settings,
        updatedAt: serverTimestamp(),
      });

      logger.info("Updated chastity settings", {
        relationshipId,
        userId,
        settings,
      });
    } catch (error) {
      logger.error("Failed to update chastity settings", {
        error: error as Error,
        relationshipId,
        userId,
      });
      throw error;
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Start a new chastity session
   */
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
      if (!db) {
        throw new Error("Database connection not available");
      }

      // Check if user has permission to start session
      const hasPermission = await relationshipService.checkPermission(
        relationshipId,
        userId,
        "sessions",
      );

      if (!hasPermission) {
        throw new Error("Insufficient permissions to start session");
      }

      // Check if there's already an active session
      const chastityData = await this.getChastityData(relationshipId);
      if (chastityData?.currentSession.isActive) {
        throw new Error("A session is already active for this relationship");
      }

      const sessionId = generateUUID();
      const batch = writeBatch(db);

      // Create session record
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
          keyholderApproval: {
            required: false,
          },
        };

      batch.set(
        doc(db, "chastityData", relationshipId, "sessions", sessionId),
        {
          ...sessionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

      // Update current session in chastity data
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

  /**
   * End a chastity session
   */
  async endSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
    endReason?: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      if (!db) {
        throw new Error("Database connection not available");
      }

      // Check permissions
      const hasPermission = await relationshipService.checkPermission(
        relationshipId,
        userId,
        "sessions",
      );

      if (!hasPermission) {
        throw new Error("Insufficient permissions to end session");
      }

      const batch = writeBatch(db);

      // Update session record
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

      const sessionData = sessionDoc.data() as RelationshipSession;
      const endTime = new Date();
      const totalDuration =
        endTime.getTime() - sessionData.startTime.toDate().getTime();

      // Add end event
      const endEvent: SessionEvent = {
        type: "end",
        timestamp: serverTimestamp() as Timestamp,
        initiatedBy:
          userId === (await this.getKeyholderId(relationshipId))
            ? "keyholder"
            : "submissive",
        reason: endReason,
      };

      batch.update(sessionRef, {
        endTime: serverTimestamp(),
        duration: Math.floor(totalDuration / 1000),
        events: [...sessionData.events, endEvent],
        updatedAt: serverTimestamp(),
      });

      // Update current session in chastity data
      batch.update(doc(db, "chastityData", relationshipId), {
        currentSession: {
          id: "",
          isActive: false,
          startTime: serverTimestamp(),
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

  /**
   * Pause a session
   */
  async pauseSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
    pauseReason?: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      if (!db) {
        throw new Error("Database connection not available");
      }

      // Check if submissive can pause
      const canPause = await relationshipService.checkPermission(
        relationshipId,
        userId,
        "pauseSession",
      );

      if (!canPause) {
        throw new Error("Insufficient permissions to pause session");
      }

      const batch = writeBatch(db);

      // Update session with pause event
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

      const sessionData = sessionDoc.data() as RelationshipSession;

      const pauseEvent: SessionEvent = {
        type: "pause",
        timestamp: serverTimestamp() as Timestamp,
        initiatedBy: "submissive",
        reason: pauseReason,
      };

      batch.update(sessionRef, {
        events: [...sessionData.events, pauseEvent],
        updatedAt: serverTimestamp(),
      });

      // Update current session
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

  /**
   * Resume a paused session
   */
  async resumeSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      if (!db) {
        throw new Error("Database connection not available");
      }

      // Get current chastity data to calculate pause time
      const chastityData = await this.getChastityData(relationshipId);
      if (!chastityData?.currentSession.pausedAt) {
        throw new Error("Session is not paused");
      }

      const batch = writeBatch(db);

      // Calculate pause duration
      const pauseEnd = new Date();
      const pauseStart = chastityData.currentSession.pausedAt.toDate();
      const pauseDuration = Math.floor(
        (pauseEnd.getTime() - pauseStart.getTime()) / 1000,
      );

      // Update session with resume event
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

      const sessionData = sessionDoc.data() as RelationshipSession;

      const resumeEvent: SessionEvent = {
        type: "resume",
        timestamp: serverTimestamp() as Timestamp,
        initiatedBy: "submissive",
      };

      batch.update(sessionRef, {
        events: [...sessionData.events, resumeEvent],
        updatedAt: serverTimestamp(),
      });

      // Update current session
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
        userId === (await this.getKeyholderId(relationshipId));

      const task: Omit<RelationshipTask, "createdAt" | "updatedAt"> = {
        id: taskId,
        relationshipId,
        text: taskData.text,
        assignedBy: isKeyholder ? "keyholder" : "submissive",
        assignedTo: "submissive",
        dueDate: taskData.dueDate ? (taskData.dueDate as Timestamp) : undefined,
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

      const updateData: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
      };

      // Add role-specific fields
      const isKeyholder =
        userId === (await this.getKeyholderId(relationshipId));

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

  // ==================== EVENT LOGGING ====================

  /**
   * Log an event
   */
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
        userId === (await this.getKeyholderId(relationshipId));

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

  /**
   * Get events for a relationship
   */
  async getEvents(
    relationshipId: string,
    limitCount: number = 100,
  ): Promise<RelationshipEvent[]> {
    try {
      const db = await this.ensureDb();

      const eventsSnapshot = await getDocs(
        query(
          collection(db, "chastityData", relationshipId, "events"),
          orderBy("timestamp", "desc"),
          limit(limitCount),
        ),
      );

      const events = eventsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as RelationshipEvent[];

      logger.debug("Retrieved events", {
        relationshipId,
        count: events.length,
      });

      return events;
    } catch (error) {
      logger.error("Failed to get events", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get keyholder ID for a relationship
   */
  private async getKeyholderId(relationshipId: string): Promise<string> {
    const relationship =
      await relationshipService.getRelationship(relationshipId);
    if (!relationship) {
      throw new Error("Relationship not found");
    }
    return relationship.keyholderId;
  }

  /**
   * Get session history for a relationship
   */
  async getSessionHistory(
    relationshipId: string,
    limitCount: number = 50,
  ): Promise<RelationshipSession[]> {
    try {
      const db = await this.ensureDb();

      const sessionsSnapshot = await getDocs(
        query(
          collection(db, "chastityData", relationshipId, "sessions"),
          orderBy("startTime", "desc"),
          limit(limitCount),
        ),
      );

      const sessions = sessionsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as RelationshipSession[];

      logger.debug("Retrieved session history", {
        relationshipId,
        count: sessions.length,
      });

      return sessions;
    } catch (error) {
      logger.error("Failed to get session history", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  /**
   * Subscribe to chastity data changes
   */
  subscribeToChastityData(
    relationshipId: string,
    callback: (data: RelationshipChastityData | null) => void,
  ): Promise<Unsubscribe> {
    return this.ensureDb().then((db) => {
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
    });
  }

  /**
   * Subscribe to task changes
   */
  subscribeToTasks(
    relationshipId: string,
    callback: (tasks: RelationshipTask[]) => void,
  ): Promise<Unsubscribe> {
    return this.ensureDb().then((db) => {
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
    });
  }
}

export const relationshipChastityService = new RelationshipChastityService();
