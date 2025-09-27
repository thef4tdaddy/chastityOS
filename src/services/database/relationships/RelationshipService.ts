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

  subscribeToUserRelationships(userId: string, callback: any) {
    return relationshipCRUDService.subscribeToUserRelationships(
      userId,
      callback,
    );
  }

  // Invitation Operations
  async sendRelationshipRequest(
    fromUserId: string,
    toUserId: string,
    fromRole: any,
    message?: string,
  ) {
    return relationshipInviteService.sendRelationshipRequest(
      fromUserId,
      toUserId,
      fromRole,
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
    permissions: any,
    updatingUserId: string,
  ) {
    return relationshipRoleService.updateRelationshipPermissions(
      relationshipId,
      permissions,
      updatingUserId,
    );
  }

  async checkPermission(relationshipId: string, userId: string, action: any) {
    return relationshipRoleService.checkPermission(
      relationshipId,
      userId,
      action,
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

  validatePermissions(permissions: any) {
    return relationshipValidationService.validatePermissions(permissions);
  }

  validateStatusTransition(currentStatus: any, newStatus: any) {
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
    filters: any = {},
    pageSize: number = 20,
    lastDoc?: any,
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
    lastDoc?: any,
  ) {
    return relationshipSearchService.getRelationshipHistory(
      userId,
      pageSize,
      lastDoc,
    );
  }

  async searchRelationshipRequests(
    userId: string,
    direction: any = "both",
    status?: any,
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
    status?: any,
  ) {
    return relationshipSearchService.findRelationshipsByParticipants(
      participantIds,
      status,
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
