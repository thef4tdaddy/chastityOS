/**
 * Relationship Hooks Index
 * Re-exports all focused relationship hooks for easy importing
 */

// Types and utilities
export * from "./types";
export * from "./utils";

// Focused hooks
export { useRelationshipList } from "./useRelationshipList";
export { useRelationshipInvites } from "./useRelationshipInvites";
export { useRelationshipActions } from "./useRelationshipActions";
export { useRelationshipStatus } from "./useRelationshipStatus";
export { useRelationshipPermissions } from "./useRelationshipPermissions";
export { useRelationshipTasks } from "./useRelationshipTasks";
export { useRelationshipValidation } from "./useRelationshipValidation";

// Composed hook (the main useRelationships hook will import and compose these)
export { useRelationships } from "../useRelationships";
