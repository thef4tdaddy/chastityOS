/**
 * Relationship Status Service
 * Handles status updates and transitions for relationships
 */
import { doc, updateDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import { RelationshipStatus } from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";
import { relationshipCRUDService } from "./RelationshipCRUDService";

const logger = serviceLogger("RelationshipStatusService");

export class RelationshipStatusService {
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

  /**
   * End a relationship
   */
  async endRelationship(
    relationshipId: string,
    endingUserId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Get the relationship to verify the user can end it
      const relationship =
        await relationshipCRUDService.getRelationship(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Both parties can end the relationship
      if (
        relationship.submissiveId !== endingUserId &&
        relationship.keyholderId !== endingUserId
      ) {
        throw new Error(
          "Only relationship participants can end the relationship",
        );
      }

      await updateDoc(doc(db, "relationships", relationshipId), {
        status: RelationshipStatus.ENDED,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      logger.info("Relationship ended", {
        relationshipId,
        endingUserId,
      });
    } catch (error) {
      logger.error("Failed to end relationship", {
        error: error as Error,
        relationshipId,
        endingUserId,
      });
      throw error;
    }
  }

  /**
   * Pause a relationship
   */
  async pauseRelationship(
    relationshipId: string,
    pausingUserId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Get the relationship to verify the user can pause it
      const relationship =
        await relationshipCRUDService.getRelationship(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Both parties can pause the relationship
      if (
        relationship.submissiveId !== pausingUserId &&
        relationship.keyholderId !== pausingUserId
      ) {
        throw new Error(
          "Only relationship participants can pause the relationship",
        );
      }

      await updateDoc(doc(db, "relationships", relationshipId), {
        status: RelationshipStatus.PAUSED,
        updatedAt: serverTimestamp(),
      });

      logger.info("Relationship paused", {
        relationshipId,
        pausingUserId,
      });
    } catch (error) {
      logger.error("Failed to pause relationship", {
        error: error as Error,
        relationshipId,
        pausingUserId,
      });
      throw error;
    }
  }

  /**
   * Resume a paused relationship
   */
  async resumeRelationship(
    relationshipId: string,
    resumingUserId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Get the relationship to verify the user can resume it
      const relationship =
        await relationshipCRUDService.getRelationship(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Verify relationship is currently paused
      if (relationship.status !== RelationshipStatus.PAUSED) {
        throw new Error("Relationship is not currently paused");
      }

      // Both parties can resume the relationship
      if (
        relationship.submissiveId !== resumingUserId &&
        relationship.keyholderId !== resumingUserId
      ) {
        throw new Error(
          "Only relationship participants can resume the relationship",
        );
      }

      await updateDoc(doc(db, "relationships", relationshipId), {
        status: RelationshipStatus.ACTIVE,
        updatedAt: serverTimestamp(),
      });

      logger.info("Relationship resumed", {
        relationshipId,
        resumingUserId,
      });
    } catch (error) {
      logger.error("Failed to resume relationship", {
        error: error as Error,
        relationshipId,
        resumingUserId,
      });
      throw error;
    }
  }
}

export const relationshipStatusService = new RelationshipStatusService();
