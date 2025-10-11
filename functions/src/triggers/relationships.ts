import * as functions from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { sendNotificationToUser } from "../notifications";

interface RelationshipRequest {
  fromUserId: string;
  toUserId: string;
  fromUserName?: string;
  toUserName?: string;
  status: "pending" | "accepted" | "rejected";
  requestType: "submissive_to_keyholder" | "keyholder_to_submissive";
  createdAt: Date;
  respondedAt?: Date;
}

interface Session {
  startTime: Date;
  endTime?: Date;
  isEmergencyUnlock?: boolean;
  emergencyReason?: string;
  emergencyNotes?: string;
  userId: string;
  keyholderUserId?: string;
}

/**
 * Trigger when a new relationship request is created
 * Notifies the recipient about the request
 */
export const onKeyholderRequest = functions.onDocumentCreated(
  "relationshipRequests/{requestId}",
  async (event) => {
    const request = event.data?.data() as RelationshipRequest | undefined;
    const requestId = event.params.requestId;

    if (!request) {
      logger.warn("Relationship request data not found", { requestId });
      return;
    }

    logger.info("Relationship request created trigger", {
      requestId,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      requestType: request.requestType,
    });

    // Notify the recipient
    const fromName = request.fromUserName || "Someone";
    const requestTypeText =
      request.requestType === "submissive_to_keyholder"
        ? "wants to be your submissive"
        : "wants to be your keyholder";

    await sendNotificationToUser(
      request.toUserId,
      "New Relationship Request",
      `${fromName} ${requestTypeText}`,
      {
        type: "relationship_request",
        requestId,
        fromUserId: request.fromUserId,
      }
    );
  }
);

/**
 * Trigger when an emergency unlock is triggered
 * Notifies the keyholder about the emergency unlock
 */
export const onEmergencyUnlock = functions.onDocumentUpdated(
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

    // Check if emergency unlock was just triggered
    if (!beforeSession.isEmergencyUnlock && afterSession.isEmergencyUnlock) {
      logger.warn("Emergency unlock triggered", {
        userId,
        sessionId,
        reason: afterSession.emergencyReason,
      });

      // Notify keyholder if exists
      if (afterSession.keyholderUserId) {
        const reasonStr = afterSession.emergencyReason
          ? ` Reason: ${afterSession.emergencyReason}`
          : "";

        await sendNotificationToUser(
          afterSession.keyholderUserId,
          "⚠️ Emergency Unlock",
          `Emergency unlock has been triggered.${reasonStr}`,
          {
            type: "emergency_unlock",
            sessionId,
            userId,
            reason: afterSession.emergencyReason || "Not specified",
          }
        );
      }

      // Also notify the user for confirmation
      await sendNotificationToUser(
        userId,
        "Emergency Unlock Confirmed",
        "Emergency unlock has been processed. Stay safe.",
        {
          type: "emergency_unlock_confirmed",
          sessionId,
          userId,
        }
      );
    }
  }
);
