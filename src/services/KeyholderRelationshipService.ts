/**
 * Keyholder Relationship Service
 * Business logic layer for keyholder-submissive relationships
 *
 * PERFORMANCE NOTE: This service is now wrapped by TanStack Query hooks
 * for automatic caching and request deduplication. Use the hooks from
 * `src/hooks/api/useKeyholderRelationshipQueries.ts` instead of calling
 * these methods directly from React components.
 *
 * @see src/hooks/api/useKeyholderRelationshipQueries.ts
 * @see docs/KEYHOLDER_PERFORMANCE_OPTIMIZATIONS.md
 */
import {
  keyholderRelationshipDBService,
  InviteCode,
} from "./database/KeyholderRelationshipDBService";
import { KeyholderRelationship, KeyholderPermissions } from "../types/core";
import { serviceLogger } from "../utils/logging";
import { NotificationService } from "./notifications";

const logger = serviceLogger("KeyholderRelationshipService");

export class KeyholderRelationshipService {
  /**
   * Create an invite code for account linking
   */
  static async createInviteCode(
    submissiveUserId: string,
    submissiveName?: string,
    expirationHours = 24,
  ): Promise<InviteCode> {
    try {
      logger.debug("Creating invite code for submissive", {
        submissiveUserId,
        expirationHours,
      });

      // Validate input
      if (!submissiveUserId) {
        throw new Error("User ID is required to create an invite code");
      }

      // Check for existing active invite codes (max 3 at a time)
      const activeInvites =
        await keyholderRelationshipDBService.getActiveInviteCodes(
          submissiveUserId,
        );

      if (activeInvites.length >= 3) {
        throw new Error(
          "Maximum of 3 active invite codes allowed at once. Please revoke an existing code first.",
        );
      }

      const inviteCode = await keyholderRelationshipDBService.createInviteCode({
        submissiveUserId,
        submissiveName,
        expirationHours,
      });

      logger.info("Invite code created", {
        code: inviteCode.code,
        submissiveUserId,
      });

      return inviteCode;
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to create invite code", {
        error: err,
        submissiveUserId,
        errorMessage: err.message,
      });

      // Re-throw with more context if it's a generic error
      if (err.message.includes("permission-denied")) {
        throw new Error(
          "Permission denied: You don't have access to create invite codes",
        );
      } else if (err.message.includes("network")) {
        throw new Error(
          "Network error: Please check your internet connection and try again",
        );
      }

      throw error;
    }
  }

  /**
   * Accept an invite code and establish relationship
   */
  static async acceptInviteCode(
    inviteCode: string,
    keyholderUserId: string,
    keyholderName?: string,
  ): Promise<KeyholderRelationship> {
    try {
      logger.debug("Accepting invite code", {
        code: inviteCode,
        keyholderUserId,
      });

      // Validate input
      if (!inviteCode || !keyholderUserId) {
        throw new Error("Invite code and user ID are required");
      }

      if (!this.validateInviteCodeFormat(inviteCode)) {
        throw new Error(
          "Invalid invite code format. Code must be 6 alphanumeric characters.",
        );
      }

      const relationship =
        await keyholderRelationshipDBService.acceptInviteCode({
          inviteCode,
          keyholderUserId,
          keyholderName,
        });

      logger.info("Relationship established", {
        relationshipId: relationship.id,
        submissiveUserId: relationship.submissiveUserId,
        keyholderUserId: relationship.keyholderUserId,
      });

      // Notify keyholder about the accepted invitation
      NotificationService.notifyKeyholderRequest({
        userId: relationship.submissiveUserId,
        keyholderUserId: relationship.keyholderUserId,
        requestType: "invite",
      }).catch((error) => {
        logger.warn("Failed to send keyholder request notification", { error });
      });

      return relationship;
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to accept invite code", {
        error: err,
        keyholderUserId,
        errorMessage: err.message,
      });

      // Provide user-friendly error messages
      if (
        err.message.includes("not found") ||
        err.message.includes("invalid")
      ) {
        throw new Error(
          "Invalid or expired invite code. Please check the code and try again.",
        );
      } else if (err.message.includes("already used")) {
        throw new Error("This invite code has already been used.");
      } else if (err.message.includes("expired")) {
        throw new Error(
          "This invite code has expired. Please request a new one.",
        );
      } else if (err.message.includes("permission-denied")) {
        throw new Error(
          "Permission denied: You don't have access to accept this invite code.",
        );
      } else if (err.message.includes("network")) {
        throw new Error(
          "Network error: Please check your internet connection and try again.",
        );
      }

      throw error;
    }
  }

  /**
   * Get all relationships for a user
   */
  static async getUserRelationships(userId: string): Promise<{
    asSubmissive: KeyholderRelationship[];
    asKeyholder: KeyholderRelationship[];
  }> {
    try {
      const relationships =
        await keyholderRelationshipDBService.getRelationshipsForUser(userId);

      logger.debug("Retrieved user relationships", {
        userId,
        submissiveCount: relationships.asSubmissive.length,
        keyholderCount: relationships.asKeyholder.length,
      });

      return relationships;
    } catch (error) {
      logger.error("Failed to get user relationships", {
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Get active keyholder for a submissive
   */
  static async getActiveKeyholder(
    submissiveUserId: string,
  ): Promise<KeyholderRelationship | null> {
    try {
      const relationships =
        await keyholderRelationshipDBService.getRelationshipsForUser(
          submissiveUserId,
        );

      // Return the first active relationship as submissive
      // (Currently supporting single keyholder, multi-keyholder is future enhancement)
      const activeRelationship = relationships.asSubmissive.find(
        (rel: KeyholderRelationship) => rel.status === "active",
      );

      return activeRelationship || null;
    } catch (error) {
      logger.error("Failed to get active keyholder", {
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Check if user has keyholder permissions for a submissive
   */
  static async hasPermission(
    keyholderUserId: string,
    submissiveUserId: string,
    permission: keyof KeyholderPermissions,
  ): Promise<boolean> {
    try {
      const relationships =
        await keyholderRelationshipDBService.getRelationshipsForUser(
          keyholderUserId,
        );

      const relationship = relationships.asKeyholder.find(
        (rel: KeyholderRelationship) =>
          rel.submissiveUserId === submissiveUserId && rel.status === "active",
      );

      if (!relationship) {
        return false;
      }

      return relationship.permissions[permission] === true;
    } catch (error) {
      logger.error("Failed to check permission", { error: error as Error });
      return false;
    }
  }

  /**
   * Update keyholder permissions (submissive only)
   */
  static async updatePermissions(
    relationshipId: string,
    permissions: KeyholderPermissions,
    submissiveUserId: string,
  ): Promise<void> {
    try {
      // Validate input
      if (!relationshipId || !submissiveUserId) {
        throw new Error("Relationship ID and user ID are required");
      }

      if (!permissions || typeof permissions !== "object") {
        throw new Error("Valid permissions object is required");
      }

      await keyholderRelationshipDBService.updatePermissions(
        relationshipId,
        permissions,
        submissiveUserId,
      );

      logger.info("Permissions updated", { relationshipId, permissions });
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to update permissions", {
        error: err,
        relationshipId,
        submissiveUserId,
        errorMessage: err.message,
      });

      // Provide user-friendly error messages
      if (err.message.includes("permission-denied")) {
        throw new Error(
          "Permission denied: Only the submissive can update permissions.",
        );
      } else if (err.message.includes("not found")) {
        throw new Error("Relationship not found. It may have been deleted.");
      } else if (err.message.includes("network")) {
        throw new Error(
          "Network error: Please check your internet connection and try again.",
        );
      }

      throw error;
    }
  }

  /**
   * End a keyholder relationship
   */
  static async endRelationship(
    relationshipId: string,
    userId: string,
  ): Promise<void> {
    try {
      await keyholderRelationshipDBService.endRelationship(
        relationshipId,
        userId,
      );

      logger.info("Relationship ended", { relationshipId, userId });
    } catch (error) {
      logger.error("Failed to end relationship", { error: error as Error });
      throw error;
    }
  }

  /**
   * Get active invite codes for a submissive
   */
  static async getActiveInviteCodes(
    submissiveUserId: string,
  ): Promise<InviteCode[]> {
    try {
      const inviteCodes =
        await keyholderRelationshipDBService.getActiveInviteCodes(
          submissiveUserId,
        );

      logger.debug("Retrieved active invite codes", {
        submissiveUserId,
        count: inviteCodes.length,
      });

      return inviteCodes;
    } catch (error) {
      logger.error("Failed to get active invite codes", {
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Revoke an invite code
   */
  static async revokeInviteCode(
    codeId: string,
    submissiveUserId: string,
  ): Promise<void> {
    try {
      await keyholderRelationshipDBService.revokeInviteCode(
        codeId,
        submissiveUserId,
      );

      logger.info("Invite code revoked", { codeId });
    } catch (error) {
      logger.error("Failed to revoke invite code", { error: error as Error });
      throw error;
    }
  }

  /**
   * Validate invite code format
   */
  static validateInviteCodeFormat(code: string): boolean {
    // 6-character alphanumeric code
    const pattern = /^[A-Z0-9]{6}$/;
    return pattern.test(code);
  }

  /**
   * Check if user can create relationships (not already linked as submissive)
   */
  static async canCreateInviteCode(userId: string): Promise<boolean> {
    try {
      const relationships =
        await keyholderRelationshipDBService.getRelationshipsForUser(userId);

      // Check if user already has an active relationship as submissive
      const hasActiveSubmissiveRelationship = relationships.asSubmissive.some(
        (rel: KeyholderRelationship) => rel.status === "active",
      );

      // Currently supporting single keyholder per submissive
      return !hasActiveSubmissiveRelationship;
    } catch (error) {
      logger.error("Failed to check invite code creation eligibility", {
        error: error as Error,
      });
      return false;
    }
  }

  /**
   * Get relationship summary for user
   */
  static async getRelationshipSummary(userId: string): Promise<{
    hasActiveKeyholder: boolean;
    hasSubmissives: boolean;
    activeKeyholderCount: number;
    submissiveCount: number;
  }> {
    try {
      const relationships =
        await keyholderRelationshipDBService.getRelationshipsForUser(userId);

      const activeAsSubmissive = relationships.asSubmissive.filter(
        (rel: KeyholderRelationship) => rel.status === "active",
      );
      const activeAsKeyholder = relationships.asKeyholder.filter(
        (rel: KeyholderRelationship) => rel.status === "active",
      );

      return {
        hasActiveKeyholder: activeAsSubmissive.length > 0,
        hasSubmissives: activeAsKeyholder.length > 0,
        activeKeyholderCount: activeAsSubmissive.length,
        submissiveCount: activeAsKeyholder.length,
      };
    } catch (error) {
      logger.error("Failed to get relationship summary", {
        error: error as Error,
      });
      throw error;
    }
  }
}

export default KeyholderRelationshipService;
