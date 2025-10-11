/**
 * Notification Permission Prompt Component
 * User-friendly prompt to request push notification permissions
 */
import React, { useState, useEffect } from "react";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { FCMService } from "@/services/notifications/FCMService";
import { serviceLogger } from "@/utils/logging";
import { InitialPromptStep, ExplanationStep } from "./NotificationPromptSteps";

const logger = serviceLogger("NotificationPermissionPrompt");

export interface NotificationPermissionPromptProps {
  userId: string | null;
  /** When to show the prompt - don't show on first app load */
  showAfterDelay?: number; // milliseconds
  /** Optional callback when permission is granted */
  onPermissionGranted?: (token: string | null) => void;
  /** Optional callback when permission is denied */
  onPermissionDenied?: () => void;
  /** Force show the prompt (for settings page) */
  forceShow?: boolean;
}

/**
 * Notification Permission Prompt Component
 * Shows a user-friendly prompt to enable push notifications
 */
export const NotificationPermissionPrompt: React.FC<
  NotificationPermissionPromptProps
> = ({
  userId,
  showAfterDelay = 30000, // Default: 30 seconds after app load
  onPermissionGranted,
  onPermissionDenied,
  forceShow = false,
}) => {
  const { permission, isSupported, hasPrompted, canPrompt, requestPermission } =
    useNotificationPermission();

  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Show prompt after delay if user hasn't been prompted yet
  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    if (!isSupported || !canPrompt || hasPrompted) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      logger.debug("Showing notification permission prompt after delay");
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [isSupported, canPrompt, hasPrompted, showAfterDelay, forceShow]);

  // Handle permission request
  const handleRequestPermission = async () => {
    if (!userId) {
      logger.warn("Cannot request permission - user not authenticated");
      return;
    }

    setIsRequesting(true);

    try {
      const result = await requestPermission();

      if (result === "granted") {
        logger.info("Permission granted, requesting FCM token");

        // Request FCM token
        const token = await FCMService.requestToken(userId);

        if (token) {
          logger.info("FCM token obtained after permission grant");
          if (onPermissionGranted) {
            onPermissionGranted(token);
          }
        }

        setIsVisible(false);
      } else if (result === "denied") {
        logger.info("Permission denied by user");
        if (onPermissionDenied) {
          onPermissionDenied();
        }
        setIsVisible(false);
      }
    } catch (error) {
      logger.error("Error requesting permission", { error });
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    logger.debug("User dismissed notification prompt");
  };

  // Handle show explanation
  const handleShowExplanation = () => {
    setShowExplanation(true);
  };

  // Don't render if not visible or not supported
  if (!isVisible || !isSupported) {
    return null;
  }

  // Don't show if already granted
  if (permission === "granted") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-purple-900 border-2 border-purple-500 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-purple-700 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-purple-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center text-purple-200 mb-3">
          Enable Push Notifications
        </h3>

        {/* Description and Actions */}
        {!showExplanation ? (
          <InitialPromptStep
            onRequestPermission={handleRequestPermission}
            onDismiss={handleDismiss}
            onShowExplanation={handleShowExplanation}
            isRequesting={isRequesting}
          />
        ) : (
          <ExplanationStep onBack={() => setShowExplanation(false)} />
        )}

        {/* Privacy note */}
        <p className="text-purple-500 text-xs text-center mt-4">
          Your privacy is important. We only send relevant notifications and
          never spam.
        </p>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
