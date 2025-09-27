/**
 * Relationship Permission Service
 * Handles access control and permission checking for chastity operations
 */
import { relationshipService } from "../relationships/RelationshipService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RelationshipPermissionService");

class RelationshipPermissionService {
  // ==================== PERMISSION CHECKING ====================

  /**
   * Check if user has permission to perform an action
   */
  async checkPermission(
    relationshipId: string,
    userId: string,
    action: string,
  ): Promise<boolean> {
    try {
      const hasPermission = await relationshipService.checkPermission(
        relationshipId,
        userId,
        action,
      );

      logger.debug("Permission check result", {
        relationshipId,
        userId,
        action,
        hasPermission,
      });

      return hasPermission;
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

  /**
   * Check if user is keyholder for relationship
   */
  async isKeyholder(relationshipId: string, userId: string): Promise<boolean> {
    try {
      const relationship =
        await relationshipService.getRelationship(relationshipId);
      if (!relationship) {
        return false;
      }

      const isKeyholder = relationship.keyholderId === userId;

      logger.debug("Keyholder check result", {
        relationshipId,
        userId,
        isKeyholder,
      });

      return isKeyholder;
    } catch (error) {
      logger.error("Failed to check keyholder status", {
        error: error as Error,
        relationshipId,
        userId,
      });
      return false;
    }
  }

  /**
   * Check if user is submissive for relationship
   */
  async isSubmissive(relationshipId: string, userId: string): Promise<boolean> {
    try {
      const relationship =
        await relationshipService.getRelationship(relationshipId);
      if (!relationship) {
        return false;
      }

      const isSubmissive = relationship.submissiveId === userId;

      logger.debug("Submissive check result", {
        relationshipId,
        userId,
        isSubmissive,
      });

      return isSubmissive;
    } catch (error) {
      logger.error("Failed to check submissive status", {
        error: error as Error,
        relationshipId,
        userId,
      });
      return false;
    }
  }

  /**
   * Check if user can start/end sessions
   */
  async canManageSessions(
    relationshipId: string,
    userId: string,
  ): Promise<boolean> {
    return this.checkPermission(relationshipId, userId, "sessions");
  }

  /**
   * Check if user can create/manage tasks
   */
  async canManageTasks(
    relationshipId: string,
    userId: string,
  ): Promise<boolean> {
    return this.checkPermission(relationshipId, userId, "tasks");
  }

  /**
   * Check if user can pause sessions
   */
  async canPauseSession(
    relationshipId: string,
    userId: string,
  ): Promise<boolean> {
    return this.checkPermission(relationshipId, userId, "pauseSession");
  }

  /**
   * Check if user can update settings
   */
  async canUpdateSettings(
    relationshipId: string,
    userId: string,
  ): Promise<boolean> {
    return this.checkPermission(relationshipId, userId, "settings");
  }
}

export const relationshipPermissionService =
  new RelationshipPermissionService();
