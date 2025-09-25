/**
 * Database Services Index
 * Exports all database services for easy importing
 */

// Database instance
export { db, ChastityDB } from "../storage/ChastityDB";

// Base service
export { BaseDBService } from "./BaseDBService";

// Specialized services
export { sessionDBService } from "./SessionDBService";
export { eventDBService } from "./EventDBService";
export { taskDBService } from "./TaskDBService";
export { goalDBService } from "./GoalDBService";
export { settingsDBService } from "./SettingsDBService";

// Utility services
export { DBMigrationService } from "./MigrationService";
export { DBPerformanceService } from "./PerformanceService";

// Re-export types for convenience
export type * from "../../types/database";
export { emergencyService } from "./EmergencyService";
