/**
 * Comprehensive Statistics Hook
 * Provides analytics and insights for both users and keyholders
 * with appropriate privacy controls
 *
 * @deprecated This file re-exports from the refactored hooks/data/statistics/ directory
 */

// Re-export all types from the types file
export type * from "./types/statistics";

// Re-export the composed hook from the new structure
export { useStatistics } from "./statistics";
