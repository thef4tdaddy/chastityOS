/**
 * Notification Permission Prompt Component
 * User-friendly prompt to request push notification permissions
 */
import React, { useState, useEffect } from "react";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { FCMService } from "@/services/notifications/FCMService";
import { serviceLogger } from "@/utils/logging";

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
  const {
    permission,
    isSupported,
    hasPrompted,
    canPrompt,
    requestPermission,
  } = useNotificationPermission();

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

        {/* Description */}
        {!showExplanation ? (
          <div className="space-y-3 mb-6">
            <p className="text-purple-300 text-center text-sm">
              Get notified about important updates:
            </p>
            <ul className="space-y-2 text-purple-300 text-sm">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Task assignments from your Keyholder</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Task approvals and feedback</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Upcoming task deadlines</span>
              </li>
            </ul>
            <button
              onClick={handleShowExplanation}
              className="text-purple-400 hover:text-purple-300 text-xs underline mt-2 w-full text-center"
            >
              Why do we need this permission?
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <p className="text-purple-300 text-sm">
              Push notifications allow us to send you timely updates even when
              you're not actively using the app. This helps you stay on top of:
            </p>
            <ul className="space-y-2 text-purple-300 text-sm list-disc list-inside">
              <li>New tasks assigned by your Keyholder</li>
              <li>Task review results (approved/rejected)</li>
              <li>Approaching and overdue task deadlines</li>
              <li>Important system updates</li>
            </ul>
            <p className="text-purple-400 text-xs italic">
              You can disable notifications at any time in your device settings
              or app settings.
            </p>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-purple-400 hover:text-purple-300 text-xs underline mt-2 w-full text-center"
            >
              Back
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-900 focus:ring-purple-400"
          >
            {isRequesting ? "Requesting..." : "Enable Notifications"}
          </button>
          <button
            onClick={handleDismiss}
            disabled={isRequesting}
            className="w-full bg-transparent hover:bg-purple-800 text-purple-300 font-semibold py-2 px-4 rounded-lg border border-purple-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-900 focus:ring-purple-400"
          >
            Maybe Later
          </button>
        </div>

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
