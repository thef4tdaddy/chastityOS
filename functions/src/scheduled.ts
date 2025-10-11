import * as functions from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { sendNotificationToUser } from "./notifications";

interface Session {
  startTime: Date;
  endTime?: Date;
  isPaused: boolean;
  goalDuration?: number;
  userId: string;
  keyholderUserId?: string;
}

/**
 * Scheduled function that runs every minute to check for sessions ending soon
 * Notifies users when their session is ending in 5 minutes
 */
export const checkSessionsEndingSoon = functions.onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "UTC",
  },
  async () => {
    logger.info("Running checkSessionsEndingSoon");

    try {
      const db = admin.firestore();
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);

      // Query all users (we need to check their sessions)
      const usersSnapshot = await db.collection("users").get();

      let notificationCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Get active sessions for this user
        const sessionsSnapshot = await db
          .collection("users")
          .doc(userId)
          .collection("sessions")
          .where("isPaused", "==", false)
          .where("endTime", "==", null)
          .get();

        for (const sessionDoc of sessionsSnapshot.docs) {
          const session = sessionDoc.data() as Session;
          const sessionId = sessionDoc.id;

          // Skip if no goal duration is set
          if (!session.goalDuration) {
            continue;
          }

          // Calculate when session should end
          const startTime = session.startTime instanceof admin.firestore.Timestamp
            ? session.startTime.toDate()
            : new Date(session.startTime);
          
          const expectedEndTime = new Date(
            startTime.getTime() + session.goalDuration * 1000
          );

          // Check if session ends between 5 and 6 minutes from now
          if (
            expectedEndTime >= fiveMinutesFromNow &&
            expectedEndTime < sixMinutesFromNow
          ) {
            logger.info("Session ending soon", {
              userId,
              sessionId,
              expectedEndTime: expectedEndTime.toISOString(),
            });

            // Send notification
            await sendNotificationToUser(
              userId,
              "Session Ending Soon",
              "Your chastity session will end in approximately 5 minutes.",
              {
                type: "session_ending_soon",
                sessionId,
                userId,
                expectedEndTime: expectedEndTime.toISOString(),
              }
            );

            notificationCount++;

            // Also notify keyholder if exists
            if (session.keyholderUserId) {
              await sendNotificationToUser(
                session.keyholderUserId,
                "Session Ending Soon",
                "A session you're monitoring will end in approximately 5 minutes.",
                {
                  type: "session_ending_soon",
                  sessionId,
                  userId,
                  expectedEndTime: expectedEndTime.toISOString(),
                }
              );
            }
          }
        }
      }

      logger.info("checkSessionsEndingSoon completed", {
        notificationCount,
        usersChecked: usersSnapshot.size,
      });
    } catch (error) {
      logger.error("Error in checkSessionsEndingSoon", { error });
    }
  }
);
