import * as functions from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { sendNotificationToUser } from "../notifications";

interface Session {
  startTime: Date;
  endTime?: Date;
  isPaused: boolean;
  pauseStartTime?: Date;
  accumulatedPauseTime: number;
  goalDuration?: number;
  isHardcoreMode: boolean;
  keyholderApprovalRequired: boolean;
  endReason?: string;
  isEmergencyUnlock?: boolean;
  emergencyReason?: string;
  userId: string;
  keyholderUserId?: string;
}

/**
 * Trigger when a session is completed (endTime is set)
 * Notifies both the submissive and keyholder
 */
export const onSessionCompleted = functions.onDocumentUpdated(
  "users/{userId}/sessions/{sessionId}",
  async (event) => {
    const beforeSession = event.data?.before.data() as Session | undefined;
    const afterSession = event.data?.after.data() as Session | undefined;
    const userId = event.params.userId;
    const sessionId = event.params.sessionId;

    if (!beforeSession || !afterSession) {
      logger.warn("Session data not found", { userId, sessionId });
      return;
    }

    // Check if session just completed
    if (!beforeSession.endTime && afterSession.endTime) {
      logger.info("Session completed trigger", {
        userId,
        sessionId,
        isEmergency: afterSession.isEmergencyUnlock,
      });

      const duration = afterSession.endTime.getTime() - afterSession.startTime.getTime();
      const durationHours = Math.floor(duration / (1000 * 60 * 60));
      const durationMinutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

      const durationStr = `${durationHours}h ${durationMinutes}m`;
      const reasonStr = afterSession.endReason ? ` (${afterSession.endReason})` : "";

      // Notify submissive
      await sendNotificationToUser(
        userId,
        "Session Completed",
        `Your chastity session has ended. Duration: ${durationStr}${reasonStr}`,
        {
          type: "session_completed",
          sessionId,
          userId,
          duration: duration.toString(),
        }
      );

      // Notify keyholder if exists and not emergency unlock
      if (afterSession.keyholderUserId && !afterSession.isEmergencyUnlock) {
        await sendNotificationToUser(
          afterSession.keyholderUserId,
          "Session Completed",
          `A session has ended. Duration: ${durationStr}`,
          {
            type: "session_completed",
            sessionId,
            userId,
            duration: duration.toString(),
          }
        );
      }
    }
  }
);

/**
 * Trigger when pause cooldown expires
 * This would typically be triggered by a scheduled function checking pause states
 */
export const onPauseCooldownExpired = functions.onDocumentUpdated(
  "users/{userId}/sessions/{sessionId}",
  async (event) => {
    const beforeSession = event.data?.before.data() as Session | undefined;
    const afterSession = event.data?.after.data() as Session | undefined;
    const userId = event.params.userId;
    const sessionId = event.params.sessionId;

    if (!beforeSession || !afterSession) {
      logger.warn("Session data not found", { userId, sessionId });
      return;
    }

    // Check if pause state changed from paused to not paused
    if (beforeSession.isPaused && !afterSession.isPaused) {
      logger.info("Pause cooldown expired trigger", {
        userId,
        sessionId,
      });

      await sendNotificationToUser(
        userId,
        "Session Resumed",
        "Your pause cooldown has expired. Session is now active again.",
        {
          type: "pause_cooldown_expired",
          sessionId,
          userId,
        }
      );
    }
  }
);
