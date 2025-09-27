/**
 * Relationship Services - Modular Architecture
 *
 * This index file re-exports all relationship operation services
 * to maintain backward compatibility while providing modular structure.
 */

export { RelationshipCRUDService } from "./RelationshipCRUDService";
export { RelationshipInviteService } from "./RelationshipInviteService";
export { RelationshipRoleService } from "./RelationshipRoleService";
export { RelationshipStatusService } from "./RelationshipStatusService";
export { RelationshipValidationService } from "./RelationshipValidationService";
export { RelationshipSearchService } from "./RelationshipSearchService";
export { RelationshipStatsService } from "./RelationshipStatsService";

// Main service that composes all operations - backward compatibility
export { relationshipService } from "./RelationshipService";
