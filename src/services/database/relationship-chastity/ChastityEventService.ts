/**
 * Chastity Event Service
 * Handles event logging and history retrieval
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Firestore,
  FieldValue,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import { RelationshipEvent } from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";
import { relationshipCoreService } from "./RelationshipCoreService";

const logger = serviceLogger("ChastityEventService");

class ChastityEventService {
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
        userId ===
        (await relationshipCoreService.getKeyholderId(relationshipId));

      const event: Omit<RelationshipEvent, "createdAt"> = {
        id: eventId,
        relationshipId,
        type: eventData.type,
        timestamp: serverTimestamp() as FieldValue,
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
}

export const chastityEventService = new ChastityEventService();
