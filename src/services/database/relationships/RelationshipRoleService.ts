/**
 * Relationship Role Service
 * Handles role and permission management for relationships
 */
import { doc, updateDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import { RelationshipPermissions } from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";
import { relationshipCRUDService } from "./RelationshipCRUDService";

const logger = serviceLogger("RelationshipRoleService");

export class RelationshipRoleService {
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
   * Update relationship permissions
   */
  async updateRelationshipPermissions(
    relationshipId: string,
    permissions: RelationshipPermissions,
    updatingUserId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Get the relationship to verify the user can update permissions
      const relationship =
        await relationshipCRUDService.getRelationship(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Only keyholder can modify permissions
      if (relationship.keyholderId !== updatingUserId) {
        throw new Error("Only keyholder can modify permissions");
      }

      await updateDoc(doc(db, "relationships", relationshipId), {
        permissions,
        updatedAt: serverTimestamp(),
      });

      logger.info("Updated relationship permissions", {
        relationshipId,
        updatingUserId,
      });
    } catch (error) {
      logger.error("Failed to update relationship permissions", {
        error: error as Error,
        relationshipId,
        updatingUserId,
      });
      throw error;
    }
  }

  /**
   * Check if a user has permission to perform an action in a relationship
   */
  async checkPermission(
    relationshipId: string,
    userId: string,
    action:
      | keyof RelationshipPermissions["keyholderCanEdit"]
      | "pauseSession"
      | "emergencyUnlock",
  ): Promise<boolean> {
    try {
      const relationship =
        await relationshipCRUDService.getRelationship(relationshipId);
      if (!relationship) {
        return false;
      }

      const isSubmissive = relationship.submissiveId === userId;
      const isKeyholder = relationship.keyholderId === userId;

      if (!isSubmissive && !isKeyholder) {
        return false;
      }

      // Check specific permissions
      if (action === "pauseSession") {
        return isSubmissive && relationship.permissions.submissiveCanPause;
      }

      if (action === "emergencyUnlock") {
        return isSubmissive && relationship.permissions.emergencyUnlock;
      }

      // For keyholder edit permissions
      if (isKeyholder && action in relationship.permissions.keyholderCanEdit) {
        return relationship.permissions.keyholderCanEdit[
          action as keyof RelationshipPermissions["keyholderCanEdit"]
        ];
      }

      return false;
    } catch (error) {
      logger.error("Failed to check permission", {
        error: error as Error,
        relationshipId,
        userId,
        action,
      });
      return false;
    }
  }
}

export const relationshipRoleService = new RelationshipRoleService();
