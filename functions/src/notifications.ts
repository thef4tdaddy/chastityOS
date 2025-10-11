import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: "high" | "normal";
}

/**
 * Callable function to send push notifications via FCM
 * 
 * @example
 * const sendNotification = httpsCallable(functions, 'sendPushNotification');
 * await sendNotification({
 *   token: 'fcm-device-token',
 *   title: 'Task Assigned',
 *   body: 'You have a new task',
 *   data: { taskId: '123' }
 * });
 */
export const sendPushNotification = functions.https.onCall(
  async (request): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const data = request.data as NotificationPayload;

    // Validate request
    if (!request.auth) {
      logger.error("Unauthorized request to sendPushNotification");
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send notifications"
      );
    }

    // Validate payload
    if (!data.token || !data.title || !data.body) {
      logger.error("Invalid notification payload", { data });
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: token, title, body"
      );
    }

    try {
      // Build FCM message
      const message: admin.messaging.Message = {
        token: data.token,
        notification: {
          title: data.title,
          body: data.body,
        },
        data: data.data || {},
        android: {
          priority: data.priority === "high" ? "high" : "normal",
          notification: {
            channelId: "chastity_notifications",
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: data.title,
                body: data.body,
              },
              sound: "default",
            },
          },
        },
        webpush: {
          notification: {
            title: data.title,
            body: data.body,
            icon: "/icon-192x192.png",
            badge: "/badge-icon.png",
          },
        },
      };

      // Send notification via FCM
      const messageId = await admin.messaging().send(message);

      logger.info("Notification sent successfully", {
        messageId,
        userId: request.auth.uid,
        title: data.title,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logger.error("Failed to send notification", {
        error,
        userId: request.auth.uid,
      });

      // Return error without exposing sensitive details
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Helper function to send notifications to a user
 * Retrieves FCM token from user document and sends notification
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    // Get user's FCM token from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      logger.warn("User document not found", { userId });
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      logger.info("User has no FCM token", { userId });
      return;
    }

    // Send notification
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          channelId: "chastity_notifications",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: "default",
          },
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icon-192x192.png",
          badge: "/badge-icon.png",
        },
      },
    };

    const messageId = await admin.messaging().send(message);

    logger.info("Notification sent to user", {
      userId,
      messageId,
      title,
    });
  } catch (error) {
    logger.error("Failed to send notification to user", {
      userId,
      error,
    });
  }
}
