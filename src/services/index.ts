/**
 * Services Index
 * Re-exports all services for easy importing
 */

// Database services
export * from "./database";

// Achievement services
export { achievementEngine } from "./AchievementEngine";

// Session Persistence service
export { sessionPersistenceService } from "./SessionPersistenceService";

// Goal Tracker service
export { GoalTrackerService } from "./GoalTrackerService";

// Other services
import { db as firebaseDB, getFirebaseAuth, getFirestore } from "./firebase";
export { firebaseDB, getFirebaseAuth, getFirestore };

// Auth / migration helpers
export { accountMigrationService } from "./auth/AccountMigrationService";
