/**
 * Relationship Validation Service
 * Handles business rules and validation for relationships
 */
import { serviceLogger } from "@/utils/logging";
import {
  Relationship,
  RelationshipStatus,
  RelationshipPermissions,
} from "@/types/relationships";
import { relationshipCRUDService } from "./RelationshipCRUDService";

const logger = serviceLogger("RelationshipValidationService");

export class RelationshipValidationService {
  /**
   * Validate if two users can establish a relationship
   */
  async validateRelationshipCreation(
    user1Id: string,
    user2Id: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Users cannot have relationships with themselves
      if (user1Id === user2Id) {
        return {
          valid: false,
          error: "Users cannot establish relationships with themselves",
        };
      }

      // Check if they already have an active relationship
      const existingRelationship =
        await relationshipCRUDService.getRelationshipBetweenUsers(
          user1Id,
          user2Id,
        );

      if (existingRelationship) {
        if (existingRelationship.status === RelationshipStatus.ACTIVE) {
          return {
            valid: false,
            error: "An active relationship already exists between these users",
          };
        }

        if (existingRelationship.status === RelationshipStatus.PAUSED) {
          return {
            valid: false,
            error:
              "A paused relationship exists between these users. Resume it instead.",
          };
        }
      }

      return { valid: true };
    } catch (error) {
      logger.error("Failed to validate relationship creation", {
        error: error as Error,
        user1Id,
        user2Id,
      });
      return {
        valid: false,
        error: "Unable to validate relationship creation",
      };
    }
  }

  /**
   * Validate relationship permissions
   */
  validatePermissions(permissions: RelationshipPermissions): {
    valid: boolean;
    error?: string;
  } {
    try {
      // Ensure all required permission fields are present
      if (
        !permissions.keyholderCanEdit ||
        typeof permissions.keyholderCanEdit !== "object"
      ) {
        return {
          valid: false,
          error: "Invalid keyholderCanEdit permissions structure",
        };
      }

      if (
        !permissions.requireApproval ||
        typeof permissions.requireApproval !== "object"
      ) {
        return {
          valid: false,
          error: "Invalid requireApproval permissions structure",
        };
      }

      // Validate boolean fields
      if (typeof permissions.submissiveCanPause !== "boolean") {
        return {
          valid: false,
          error: "submissiveCanPause must be a boolean",
        };
      }

      if (typeof permissions.emergencyUnlock !== "boolean") {
        return {
          valid: false,
          error: "emergencyUnlock must be a boolean",
        };
      }

      // Validate keyholder edit permissions
      const keyholderEditFields = [
        "sessions",
        "tasks",
        "goals",
        "punishments",
        "settings",
      ];
      for (const field of keyholderEditFields) {
        if (
          typeof permissions.keyholderCanEdit[
            field as keyof typeof permissions.keyholderCanEdit
          ] !== "boolean"
        ) {
          return {
            valid: false,
            error: `keyholderCanEdit.${field} must be a boolean`,
          };
        }
      }

      // Validate approval requirements
      const approvalFields = ["sessionEnd", "taskCompletion", "goalChanges"];
      for (const field of approvalFields) {
        if (
          typeof permissions.requireApproval[
            field as keyof typeof permissions.requireApproval
          ] !== "boolean"
        ) {
          return {
            valid: false,
            error: `requireApproval.${field} must be a boolean`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      logger.error("Failed to validate permissions", {
        error: error as Error,
        permissions,
      });
      return {
        valid: false,
        error: "Unable to validate permissions structure",
      };
    }
  }

  /**
   * Validate relationship status transition
   */
  validateStatusTransition(
    currentStatus: RelationshipStatus,
    newStatus: RelationshipStatus,
  ): { valid: boolean; error?: string } {
    const validTransitions: Record<RelationshipStatus, RelationshipStatus[]> = {
      [RelationshipStatus.PENDING]: [
        RelationshipStatus.ACTIVE,
        RelationshipStatus.ENDED,
      ],
      [RelationshipStatus.ACTIVE]: [
        RelationshipStatus.PAUSED,
        RelationshipStatus.ENDED,
      ],
      [RelationshipStatus.PAUSED]: [
        RelationshipStatus.ACTIVE,
        RelationshipStatus.ENDED,
      ],
      [RelationshipStatus.ENDED]: [], // Ended relationships cannot transition to other states
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return {
        valid: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate user access to relationship
   */
  async validateUserAccess(
    relationshipId: string,
    userId: string,
  ): Promise<{ valid: boolean; error?: string; relationship?: Relationship }> {
    try {
      const relationship =
        await relationshipCRUDService.getRelationship(relationshipId);

      if (!relationship) {
        return {
          valid: false,
          error: "Relationship not found",
        };
      }

      const isParticipant =
        relationship.submissiveId === userId ||
        relationship.keyholderId === userId;

      if (!isParticipant) {
        return {
          valid: false,
          error: "User is not a participant in this relationship",
        };
      }

      return {
        valid: true,
        relationship,
      };
    } catch (error) {
      logger.error("Failed to validate user access", {
        error: error as Error,
        relationshipId,
        userId,
      });
      return {
        valid: false,
        error: "Unable to validate user access",
      };
    }
  }
}

export const relationshipValidationService =
  new RelationshipValidationService();
