import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
admin.initializeApp();

logger.info("Firebase Admin SDK initialized");

// Export all cloud functions
export { sendPushNotification } from "./notifications";

// Task triggers
export {
  onTaskAssigned,
  onTaskSubmitted,
  onTaskApproved,
  onTaskRejected,
} from "./triggers/tasks";

// Session triggers
export {
  onSessionCompleted,
  onPauseCooldownExpired,
} from "./triggers/sessions";

// Relationship triggers
export {
  onKeyholderRequest,
  onEmergencyUnlock,
} from "./triggers/relationships";

// Scheduled functions
export { checkSessionsEndingSoon } from "./scheduled";
