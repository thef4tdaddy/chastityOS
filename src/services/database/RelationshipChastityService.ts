/**
 * Relationship Chastity Service
 * REFACTORED: Now uses domain-focused services for better maintainability
 *
 * This file maintains backward compatibility by re-exporting the facade service
 * that delegates to the appropriate domain services.
 */

// Re-export the facade service and all domain services for backward compatibility
export { relationshipChastityService } from "./relationship-chastity";

// Also export individual services for direct access if needed
export {
  relationshipCoreService,
  chastitySessionService,
  chastityTaskService,
  chastityEventService,
  relationshipPermissionService,
} from "./relationship-chastity";
