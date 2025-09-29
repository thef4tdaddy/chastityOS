/**
 * Keyholder Relationship Service
 * Business logic layer for keyholder-submissive relationships
 */
import {
  keyholderRelationshipDBService,
  InviteCode,
} from "./database/KeyholderRelationshipDBService";
import { KeyholderRelationship, KeyholderPermissions } from "../types/core";
import { serviceLogger } from "../utils/logging";

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

      // Check for existing active invite codes (max 3 at a time)
      const activeInvites =
        await keyholderRelationshipDBService.getActiveInviteCodes(
          submissiveUserId,
        );

      if (activeInvites.length >= 3) {
        throw new Error("Maximum of 3 active invite codes allowed at once");
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
      logger.error("Failed to create invite code", { error: error as Error });
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

      return relationship;
    } catch (error) {
      logger.error("Failed to accept invite code", { error: error as Error });
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
      await keyholderRelationshipDBService.updatePermissions(
        relationshipId,
        permissions,
        submissiveUserId,
      );

      logger.info("Permissions updated", { relationshipId });
    } catch (error) {
      logger.error("Failed to update permissions", { error: error as Error });
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
