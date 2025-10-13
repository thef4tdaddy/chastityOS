/**
 * Relationship Service - Composite Service
 *
 * This service composes all relationship operation services to maintain
 * backward compatibility while providing access to modular functionality.
 */
import { relationshipCRUDService } from "./RelationshipCRUDService";
import { relationshipInviteService } from "./RelationshipInviteService";
import { relationshipRoleService } from "./RelationshipRoleService";
import { relationshipStatusService } from "./RelationshipStatusService";
import { relationshipValidationService } from "./RelationshipValidationService";
import { relationshipSearchService } from "./RelationshipSearchService";
import { relationshipStatsService } from "./RelationshipStatsService";
import { serviceLogger } from "@/utils/logging";
import {
  Relationship,
  RelationshipPermissions,
  RelationshipStatus,
  UserRole,
  RelationshipRequestStatus,
} from "@/types";
import { DocumentSnapshot, Unsubscribe } from "firebase/firestore";

const _logger = serviceLogger("RelationshipService");

/**
 * Main Relationship Service that delegates to specialized services
 * Maintains backward compatibility with existing code
 */
class RelationshipService {
  // CRUD Operations
  async getUserRelationships(userId: string) {
    return relationshipCRUDService.getUserRelationships(userId);
  }

  async getRelationship(relationshipId: string) {
    return relationshipCRUDService.getRelationship(relationshipId);
  }

  async getRelationshipBetweenUsers(user1Id: string, user2Id: string) {
    return relationshipCRUDService.getRelationshipBetweenUsers(
      user1Id,
      user2Id,
    );
  }

  subscribeToUserRelationships(
    userId: string,
    callback: (relationships: Relationship[]) => void,
  ): Unsubscribe {
    return relationshipCRUDService.subscribeToUserRelationships(
      userId,
      callback,
    );
  }

  // Invitation Operations
  async sendRelationshipRequest(
    fromUserId: string,
    toUserId: string,
    fromRole: UserRole,
    message?: string,
  ) {
    return relationshipInviteService.sendRelationshipRequest(
      fromUserId,
      toUserId,
      fromRole as "submissive" | "keyholder",
      message,
    );
  }

  async acceptRelationshipRequest(requestId: string, acceptingUserId: string) {
    return relationshipInviteService.acceptRelationshipRequest(
      requestId,
      acceptingUserId,
    );
  }

  async rejectRelationshipRequest(requestId: string, rejectingUserId: string) {
    return relationshipInviteService.rejectRelationshipRequest(
      requestId,
      rejectingUserId,
    );
  }

  async getPendingRequests(userId: string) {
    return relationshipInviteService.getPendingRequests(userId);
  }

  // Role and Permission Operations
  async updateRelationshipPermissions(
    relationshipId: string,
    permissions: Partial<RelationshipPermissions>,
    updatingUserId: string,
  ) {
    return relationshipRoleService.updateRelationshipPermissions(
      relationshipId,
      {
        ...permissions,
        keyholderCanEdit: permissions.keyholderCanEdit || {
          sessions: false,
          tasks: false,
          goals: false,
          punishments: false,
          settings: false,
        },
      } as RelationshipPermissions,
      updatingUserId,
    );
  }

  async checkPermission(
    relationshipId: string,
    userId: string,
    action: string,
  ) {
    return relationshipRoleService.checkPermission(
      relationshipId,
      userId,
      action as
        | "sessions"
        | "tasks"
        | "goals"
        | "settings"
        | "punishments"
        | "pauseSession"
        | "emergencyUnlock",
    );
  }

  // Status Operations
  async endRelationship(relationshipId: string, endingUserId: string) {
    return relationshipStatusService.endRelationship(
      relationshipId,
      endingUserId,
    );
  }

  async pauseRelationship(relationshipId: string, pausingUserId: string) {
    return relationshipStatusService.pauseRelationship(
      relationshipId,
      pausingUserId,
    );
  }

  async resumeRelationship(relationshipId: string, resumingUserId: string) {
    return relationshipStatusService.resumeRelationship(
      relationshipId,
      resumingUserId,
    );
  }

  // Validation Operations
  async validateRelationshipCreation(user1Id: string, user2Id: string) {
    return relationshipValidationService.validateRelationshipCreation(
      user1Id,
      user2Id,
    );
  }

  validatePermissions(permissions: Partial<RelationshipPermissions>) {
    return relationshipValidationService.validatePermissions(
      permissions as RelationshipPermissions,
    );
  }

  validateStatusTransition(
    currentStatus: RelationshipStatus,
    newStatus: RelationshipStatus,
  ) {
    return relationshipValidationService.validateStatusTransition(
      currentStatus,
      newStatus,
    );
  }

  async validateUserAccess(relationshipId: string, userId: string) {
    return relationshipValidationService.validateUserAccess(
      relationshipId,
      userId,
    );
  }

  // Search Operations
  async searchRelationships(
    filters: Record<string, unknown> = {},
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
  ) {
    return relationshipSearchService.searchRelationships(
      filters,
      pageSize,
      lastDoc,
    );
  }

  async getActiveRelationships(userId: string) {
    return relationshipSearchService.getActiveRelationships(userId);
  }

  async getRelationshipHistory(
    userId: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
  ) {
    return relationshipSearchService.getRelationshipHistory(
      userId,
      pageSize,
      lastDoc,
    );
  }

  async searchRelationshipRequests(
    userId: string,
    direction: "sent" | "received" | "both" = "both",
    status?: RelationshipRequestStatus[],
    pageSize: number = 20,
  ) {
    return relationshipSearchService.searchRelationshipRequests(
      userId,
      direction,
      status,
      pageSize,
    );
  }

  async findRelationshipsByParticipants(
    participantIds: string[],
    status?: RelationshipStatus,
  ) {
    return relationshipSearchService.findRelationshipsByParticipants(
      participantIds,
      status ? [status] : undefined,
    );
  }

  // Statistics Operations
  async getUserRelationshipStats(userId: string) {
    return relationshipStatsService.getUserRelationshipStats(userId);
  }

  async getRecentActivity(userId: string, limitCount: number = 10) {
    return relationshipStatsService.getRecentActivity(userId, limitCount);
  }

  // Direct access to specialized services for advanced usage
  get crud() {
    return relationshipCRUDService;
  }

  get invites() {
    return relationshipInviteService;
  }

  get roles() {
    return relationshipRoleService;
  }

  get status() {
    return relationshipStatusService;
  }

  get validation() {
    return relationshipValidationService;
  }

  get search() {
    return relationshipSearchService;
  }

  get stats() {
    return relationshipStatsService;
  }
}

export const relationshipService = new RelationshipService();

// Also export individual services for direct access
export {
  relationshipCRUDService,
  relationshipInviteService,
  relationshipRoleService,
  relationshipStatusService,
  relationshipValidationService,
  relationshipSearchService,
  relationshipStatsService,
};
