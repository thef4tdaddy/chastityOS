/**
 * Keyholder Relationship Database Service
 * Handles account linking between keyholders and submissives
 */
import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import { KeyholderRelationship, KeyholderPermissions } from "../../types/core";
import { generateBackupCode } from "../../utils/helpers/hash";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("KeyholderRelationshipDBService");

export interface InviteCode {
  id: string;
  code: string;
  submissiveUserId: string;
  submissiveName?: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  keyholderUserId?: string;
  keyholderName?: string;
}

export interface CreateInviteCodeData {
  submissiveUserId: string;
  submissiveName?: string;
  expirationHours?: number; // Default 24 hours
}

export interface AcceptInviteCodeData {
  inviteCode: string;
  keyholderUserId: string;
  keyholderName?: string;
}

// Since keyholderRelationships and inviteCodes tables don't exist in ChastityDB yet,
// we'll create a standalone service that can be extended later
class KeyholderRelationshipDBService {
  protected tableName = "keyholderRelationships";
  protected inviteCodesTable = "inviteCodes";

  // Database instance access
  protected db = db;

  /**
   * Get record by ID - placeholder implementation
   */
  async getById(id: string): Promise<KeyholderRelationship | undefined> {
    logger.warn(
      "KeyholderRelationship tables not yet implemented in database schema",
    );
    return undefined;
  }

  /**
   * Update record - placeholder implementation
   */
  async update(
    id: string,
    data: Partial<KeyholderRelationship>,
  ): Promise<void> {
    logger.warn(
      "KeyholderRelationship tables not yet implemented in database schema",
    );
  }

  /**
   * Generate a new invite code for a submissive
   */
  async createInviteCode(data: CreateInviteCodeData): Promise<InviteCode> {
    try {
      logger.debug("Creating invite code", {
        submissiveUserId: data.submissiveUserId,
      });

      // Generate unique 6-character code
      let code: string;
      let attempts = 0;
      do {
        code = generateBackupCode();
        attempts++;
        if (attempts > 10) {
          throw new Error("Failed to generate unique invite code");
        }
      } while (await this.isInviteCodeExists(code));

      const inviteCode: InviteCode = {
        id: crypto.randomUUID(),
        code,
        submissiveUserId: data.submissiveUserId,
        submissiveName: data.submissiveName,
        createdAt: new Date(),
        expiresAt: new Date(
          Date.now() + (data.expirationHours || 24) * 60 * 60 * 1000,
        ),
        isUsed: false,
      };

      await this.db.table(this.inviteCodesTable).add(inviteCode);

      logger.info("Invite code created successfully", {
        code: inviteCode.code,
        submissiveUserId: data.submissiveUserId,
      });

      return inviteCode;
    } catch (error) {
      logger.error("Failed to create invite code", { error: error as Error });
      throw error;
    }
  }

  /**
   * Accept an invite code and create keyholder relationship
   */
  async acceptInviteCode(
    data: AcceptInviteCodeData,
  ): Promise<KeyholderRelationship> {
    try {
      logger.debug("Accepting invite code", {
        code: data.inviteCode,
        keyholderUserId: data.keyholderUserId,
      });

      // Find and validate invite code
      const inviteCode = await this.db
        .table(this.inviteCodesTable)
        .where("code")
        .equals(data.inviteCode)
        .first();

      if (!inviteCode) {
        throw new Error("Invalid invite code");
      }

      if (inviteCode.isUsed) {
        throw new Error("Invite code has already been used");
      }

      if (inviteCode.expiresAt < new Date()) {
        throw new Error("Invite code has expired");
      }

      if (inviteCode.submissiveUserId === data.keyholderUserId) {
        throw new Error("Cannot link to yourself");
      }

      // Check if relationship already exists
      const existingRelationship = await this.db
        .table(this.tableName)
        .where("submissiveUserId")
        .equals(inviteCode.submissiveUserId)
        .and((rel) => rel.keyholderUserId === data.keyholderUserId)
        .and((rel) => rel.status !== "ended")
        .first();

      if (existingRelationship) {
        throw new Error("Relationship already exists between these users");
      }

      // Create the relationship
      const relationship: KeyholderRelationship = {
        id: crypto.randomUUID(),
        submissiveUserId: inviteCode.submissiveUserId,
        keyholderUserId: data.keyholderUserId,
        status: "active",
        permissions: this.getDefaultPermissions(),
        createdAt: new Date(),
        acceptedAt: new Date(),
      };

      // Start transaction to update both tables - placeholder implementation
      logger.warn("KeyholderRelationship database tables not yet implemented");
      // TODO: Implement actual database operations when tables are added to schema
      return relationship;
    } catch (error) {
      logger.error("Failed to accept invite code", { error: error as Error });
      throw error;
    }
  }

  /**
   * Get all relationships for a user (as submissive or keyholder)
   */
  async getRelationshipsForUser(userId: string): Promise<{
    asSubmissive: KeyholderRelationship[];
    asKeyholder: KeyholderRelationship[];
  }> {
    try {
      const [asSubmissive, asKeyholder] = await Promise.all([
        this.db
          .table(this.tableName)
          .where("submissiveUserId")
          .equals(userId)
          .and((rel) => rel.status !== "ended")
          .toArray(),
        this.db
          .table(this.tableName)
          .where("keyholderUserId")
          .equals(userId)
          .and((rel) => rel.status !== "ended")
          .toArray(),
      ]);

      return { asSubmissive, asKeyholder };
    } catch (error) {
      logger.error("Failed to get relationships for user", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * End a keyholder relationship
   */
  async endRelationship(
    relationshipId: string,
    endedByUserId: string,
  ): Promise<void> {
    try {
      logger.debug("Ending relationship", { relationshipId, endedByUserId });

      const relationship = await this.getById(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Verify user has permission to end relationship
      if (
        relationship.submissiveUserId !== endedByUserId &&
        relationship.keyholderUserId !== endedByUserId
      ) {
        throw new Error("User not authorized to end this relationship");
      }

      await this.update(relationshipId, {
        status: "ended",
        endedAt: new Date(),
      });

      logger.info("Relationship ended", { relationshipId });
    } catch (error) {
      logger.error("Failed to end relationship", { error: error as Error });
      throw error;
    }
  }

  /**
   * Update keyholder permissions
   */
  async updatePermissions(
    relationshipId: string,
    permissions: KeyholderPermissions,
    updatedByUserId: string,
  ): Promise<void> {
    try {
      const relationship = await this.getById(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Only submissive can update permissions
      if (relationship.submissiveUserId !== updatedByUserId) {
        throw new Error("Only submissive can update keyholder permissions");
      }

      await this.update(relationshipId, { permissions });

      logger.info("Permissions updated", { relationshipId });
    } catch (error) {
      logger.error("Failed to update permissions", { error: error as Error });
      throw error;
    }
  }

  /**
   * Get active invite codes for a user
   */
  async getActiveInviteCodes(submissiveUserId: string): Promise<InviteCode[]> {
    try {
      return await this.db
        .table(this.inviteCodesTable)
        .where("submissiveUserId")
        .equals(submissiveUserId)
        .and((invite) => !invite.isUsed && invite.expiresAt > new Date())
        .toArray();
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
  async revokeInviteCode(codeId: string, userId: string): Promise<void> {
    try {
      const inviteCode = await this.db.table(this.inviteCodesTable).get(codeId);
      if (!inviteCode) {
        throw new Error("Invite code not found");
      }

      if (inviteCode.submissiveUserId !== userId) {
        throw new Error("User not authorized to revoke this invite code");
      }

      await this.db.table(this.inviteCodesTable).delete(codeId);

      logger.info("Invite code revoked", { codeId });
    } catch (error) {
      logger.error("Failed to revoke invite code", { error: error as Error });
      throw error;
    }
  }

  /**
   * Check if an invite code already exists
   */
  private async isInviteCodeExists(code: string): Promise<boolean> {
    const existing = await this.db
      .table(this.inviteCodesTable)
      .where("code")
      .equals(code)
      .first();
    return !!existing;
  }

  /**
   * Get default permissions for new relationships
   */
  private getDefaultPermissions(): KeyholderPermissions {
    return {
      canLockSessions: true,
      canUnlockSessions: false, // Emergency only
      canCreateTasks: true,
      canApproveTasks: true,
      canViewFullHistory: true,
      canEditGoals: false,
      canSetRules: false,
    };
  }
}

export const keyholderRelationshipDBService =
  new KeyholderRelationshipDBService();
