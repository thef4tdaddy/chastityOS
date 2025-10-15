/**
 * Unsubscribe Page
 * GDPR-compliant email notification unsubscribe page
 */
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Alert } from "@/components/ui";
import { parseUnsubscribeToken } from "@/utils/notifications/privacy";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("UnsubscribePage");

interface UnsubscribePageProps {
  token?: string;
}

// Helper to get notification updates based on type
function getNotificationUpdates(
  notificationType: string,
): Record<string, boolean> {
  const updates: Record<string, boolean> = {
    emailNotifications: false,
    emailOptOut: true,
  };

  if (notificationType === "session") {
    updates.sessionNotifications = false;
  } else if (notificationType === "task") {
    updates.taskNotifications = false;
  } else if (notificationType === "keyholder") {
    updates.keyholderNotifications = false;
  }

  return updates;
}

export const UnsubscribePage: React.FC<UnsubscribePageProps> = ({ token }) => {
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "invalid"
  >("loading");
  const [message, setMessage] = useState("");
  const [tokenData, setTokenData] = useState<{
    userId: string;
    notificationType: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("No unsubscribe token provided.");
      return;
    }

    const parsedToken = parseUnsubscribeToken(token);
    if (!parsedToken) {
      setStatus("invalid");
      setMessage("Invalid or expired unsubscribe token.");
      return;
    }

    setTokenData({
      userId: parsedToken.userId,
      notificationType: parsedToken.notificationType,
    });
    setStatus("loading");
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!tokenData) {
      setStatus("error");
      setMessage("Cannot unsubscribe: invalid token data.");
      return;
    }

    try {
      setStatus("loading");

      // Update notification settings in Firestore
      const settingsDoc = doc(
        db,
        "users",
        tokenData.userId,
        "settings",
        "notifications",
      );

      const updates = getNotificationUpdates(tokenData.notificationType);
      await updateDoc(settingsDoc, updates);

      logger.info("User unsubscribed from email notifications", {
        userId: tokenData.userId,
        notificationType: tokenData.notificationType,
      });

      setStatus("success");
      setMessage(
        "You have successfully unsubscribed from email notifications. You can still receive in-app notifications by adjusting your settings.",
      );
    } catch (error) {
      logger.error("Failed to unsubscribe user", { error, tokenData });
      setStatus("error");
      setMessage(
        "Failed to process your unsubscribe request. Please try again or contact support.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-nightly-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <h1 className="text-2xl font-bold text-nightly-honeydew">
            Unsubscribe from Email Notifications
          </h1>
        </CardHeader>

        <CardBody className="space-y-4">
          {status === "loading" && tokenData && (
            <>
              <Alert variant="info">
                <p>
                  You are about to unsubscribe from{" "}
                  {tokenData.notificationType === "all"
                    ? "all email notifications"
                    : `${tokenData.notificationType} email notifications`}
                  .
                </p>
              </Alert>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleUnsubscribe}
                  className="w-full"
                >
                  Unsubscribe from Email Notifications
                </Button>

                <p className="text-sm text-nightly-celadon/70">
                  Note: You can re-enable email notifications at any time in
                  your account settings. In-app notifications will not be
                  affected.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <Alert variant="success">
              <p className="font-semibold">Successfully Unsubscribed</p>
              <p className="mt-2">{message}</p>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="error">
              <p className="font-semibold">Error</p>
              <p className="mt-2">{message}</p>
              <Button
                variant="secondary"
                onClick={handleUnsubscribe}
                className="mt-3 w-full"
              >
                Try Again
              </Button>
            </Alert>
          )}

          {status === "invalid" && (
            <Alert variant="error">
              <p className="font-semibold">Invalid Link</p>
              <p className="mt-2">{message}</p>
            </Alert>
          )}

          <div className="mt-6 pt-4 border-t border-nightly-celadon/30">
            <h3 className="text-sm font-semibold text-nightly-celadon mb-2">
              GDPR Compliance
            </h3>
            <p className="text-xs text-nightly-celadon/70">
              In compliance with GDPR regulations, you have the right to opt out
              of email notifications at any time. This action is immediate and
              can be reversed in your account settings.
            </p>
          </div>

          <div className="text-center">
            <a
              href="/"
              className="text-sm text-nightly-spring-green hover:underline"
            >
              Return to ChastityOS
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default UnsubscribePage;
