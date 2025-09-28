/**
 * Relationship Core Service
 * Handles basic chastity data CRUD operations
 */
import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Firestore,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import { RelationshipChastityData } from "@/types/relationships";
import { relationshipService } from "../relationships/RelationshipService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RelationshipCoreService");

class RelationshipCoreService {
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

  // ==================== REAL-TIME LISTENERS ====================

  /**
   * Subscribe to chastity data changes
   */
  subscribeToChastityData(
    relationshipId: string,
    callback: (data: RelationshipChastityData | null) => void,
  ): Unsubscribe {
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
    }) as Unsubscribe;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get keyholder ID for a relationship
   */
  async getKeyholderId(relationshipId: string): Promise<string> {
    const relationship =
      await relationshipService.getRelationship(relationshipId);
    if (!relationship) {
      throw new Error("Relationship not found");
    }
    return relationship.keyholderId;
  }
}

export const relationshipCoreService = new RelationshipCoreService();
