import { FirebaseSync } from "./FirebaseSync";
import { FirebaseListeners } from "./FirebaseListeners";
import { offlineQueue } from "./OfflineQueue";

// Export main orchestrator (backward compatibility)
export const firebaseSync = new FirebaseSync();
export const firebaseListeners = new FirebaseListeners(firebaseSync);
export { offlineQueue };

// Export individual sync services for direct use
export { FirebaseSync } from "./FirebaseSync";
export { FirebaseSyncCore } from "./FirebaseSyncCore";
export { UserSettingsSync, userSettingsSync } from "./UserSettingsSync";
export { SessionDataSync, sessionDataSync } from "./SessionDataSync";
export { EventDataSync, eventDataSync } from "./EventDataSync";
export { TaskDataSync, taskDataSync } from "./TaskDataSync";
export {
  AchievementDataSync,
  achievementDataSync,
} from "./AchievementDataSync";
export {
  RelationshipDataSync,
  relationshipDataSync,
} from "./RelationshipDataSync";
export {
  SyncConflictResolver,
  syncConflictResolver,
} from "./SyncConflictResolver";
