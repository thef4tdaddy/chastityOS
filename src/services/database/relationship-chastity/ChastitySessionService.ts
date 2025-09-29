/**
 * Chastity Session Service
 * Handles session lifecycle management (start/end/pause/resume)
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Firestore,
  Timestamp,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import { RelationshipSession, SessionEvent } from "@/types/relationships";
import { relationshipService } from "../relationships/RelationshipService";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";
import { relationshipCoreService } from "./RelationshipCoreService";

const logger = serviceLogger("ChastitySessionService");

class ChastitySessionService {
  private db: Firestore | null = null;

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
      const chastityData =
        await relationshipCoreService.getChastityData(relationshipId);
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
          userId ===
          (await relationshipCoreService.getKeyholderId(relationshipId))
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

      // Get current chastity data to calculate pause time
      const chastityData =
        await relationshipCoreService.getChastityData(relationshipId);
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
}

export const chastitySessionService = new ChastitySessionService();
