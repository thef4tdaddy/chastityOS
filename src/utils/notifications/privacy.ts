/**
 * Notification Privacy Utilities
 * Handles privacy mode and sanitization of notifications
 */
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("NotificationPrivacy");

export interface PrivacySettings {
  privacyMode: boolean;
  stripPersonalInfo: boolean;
  anonymousMode: boolean;
}

/**
 * Sanitize notification content to remove sensitive information
 * @param content - Original notification content
 * @param privacyMode - Whether privacy mode is enabled
 * @param isAnonymous - Whether the user is anonymous
 * @returns Sanitized notification content
 */
export function sanitizeNotificationContent(
  content: {
    title?: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
  privacyMode: boolean,
  isAnonymous: boolean = false,
): {
  title?: string;
  message: string;
  metadata?: Record<string, unknown>;
} {
  // If privacy mode is disabled and not anonymous, return original content
  if (!privacyMode && !isAnonymous) {
    return content;
  }

  logger.debug("Sanitizing notification content", {
    privacyMode,
    isAnonymous,
    originalTitle: content.title,
  });

  const sanitized = {
    ...content,
    title: content.title
      ? sanitizeText(content.title, privacyMode, isAnonymous)
      : undefined,
    message: sanitizeText(content.message, privacyMode, isAnonymous),
    metadata: sanitizeMetadata(
      content.metadata || {},
      privacyMode,
      isAnonymous,
    ),
  };

  return sanitized;
}

/**
 * Sanitize text to remove sensitive information
 */
function sanitizeText(
  text: string,
  privacyMode: boolean,
  isAnonymous: boolean,
): string {
  if (!privacyMode && !isAnonymous) {
    return text;
  }

  let sanitized = text;

  // Strip personal names - replace with generic terms
  // Match patterns like "John's session" or "Jane completed"
  sanitized = sanitized.replace(/\b[A-Z][a-z]+'s\b/g, "User's");
  sanitized = sanitized.replace(
    /\b[A-Z][a-z]+\b(?=\s+(started|completed|paused|resumed|submitted|requested))/g,
    "User",
  );

  // Replace specific time references with generic ones
  sanitized = sanitized.replace(
    /\d+ (hour|minute|second|day|week|month)s?/g,
    (match) => {
      if (privacyMode) {
        return "some time";
      }
      return match;
    },
  );

  // Remove specific dates/times if in strict privacy mode
  if (privacyMode) {
    sanitized = sanitized.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, "[date]");
    sanitized = sanitized.replace(/\d{1,2}:\d{2}\s?(AM|PM|am|pm)?/g, "[time]");
  }

  // For anonymous users, use even more generic language
  if (isAnonymous) {
    sanitized = sanitized.replace(/Your submissive/gi, "User");
    sanitized = sanitized.replace(/Your keyholder/gi, "Keyholder");
    sanitized = sanitized.replace(/\byour\b/gi, "the");
  }

  return sanitized;
}

/**
 * Sanitize metadata to remove sensitive information
 */
function sanitizeMetadata(
  metadata: Record<string, unknown>,
  privacyMode: boolean,
  isAnonymous: boolean,
): Record<string, unknown> {
  if (!privacyMode && !isAnonymous) {
    return metadata;
  }

  const sanitized = { ...metadata };

  // Remove sensitive fields
  const sensitiveFields = [
    "submissiveName",
    "keyholderName",
    "userName",
    "displayName",
    "email",
    "phoneNumber",
    "reason", // Emergency reasons might be sensitive
    "notes", // User notes might contain sensitive info
  ];

  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  // Keep non-sensitive metadata that's useful for functionality
  // (e.g., sessionId, links, type)
  return sanitized;
}

// Notification type to preference mapping
const NOTIFICATION_TYPE_MAP: Record<
  string,
  | "sessionNotifications"
  | "taskNotifications"
  | "keyholderNotifications"
  | "systemNotifications"
> = {
  session: "sessionNotifications",
  session_started: "sessionNotifications",
  session_ended: "sessionNotifications",
  session_paused: "sessionNotifications",
  session_resumed: "sessionNotifications",
  session_ending_soon: "sessionNotifications",
  task: "taskNotifications",
  task_assigned: "taskNotifications",
  task_deadline: "taskNotifications",
  task_approved: "taskNotifications",
  task_rejected: "taskNotifications",
  keyholder: "keyholderNotifications",
  keyholder_request: "keyholderNotifications",
  keyholder_message: "keyholderNotifications",
  system: "systemNotifications",
  sync_completed: "systemNotifications",
  sync_failed: "systemNotifications",
  update_available: "systemNotifications",
};

/**
 * Check if notification should be sent based on user preferences
 * @param notificationType - Type of notification (session, task, etc.)
 * @param userPreferences - User's notification preferences
 * @param privacySettings - User's privacy settings
 * @returns Whether the notification should be sent
 */
export function shouldSendNotification(
  notificationType: string,
  userPreferences: {
    sessionNotifications?: boolean;
    taskNotifications?: boolean;
    keyholderNotifications?: boolean;
    systemNotifications?: boolean;
    pushEnabled?: boolean;
  },
  privacySettings?: {
    privacyMode?: boolean;
    anonymousMode?: boolean;
    optedOut?: boolean;
  },
): boolean {
  // If user has globally opted out, don't send
  if (privacySettings?.optedOut) {
    logger.debug("Notification blocked: user opted out", { notificationType });
    return false;
  }

  // Get the preference key for this notification type
  const preferenceKey = NOTIFICATION_TYPE_MAP[notificationType];

  // If we have a preference key and it's set to false, don't send
  if (preferenceKey && userPreferences[preferenceKey] === false) {
    return false;
  }

  // Default to allowing if not explicitly disabled
  return true;
}

/**
 * Generate unsubscribe token for email notifications
 * @param userId - User ID
 * @param notificationType - Type of notification
 * @returns Unsubscribe token
 */
export function generateUnsubscribeToken(
  userId: string,
  notificationType: string,
): string {
  // Simple token generation - in production, this should be cryptographically secure
  // and stored in a database with expiration
  const timestamp = Date.now();
  const data = `${userId}:${notificationType}:${timestamp}`;

  // Base64 encode for URL safety
  return btoa(data);
}

/**
 * Parse unsubscribe token
 * @param token - Unsubscribe token
 * @returns Parsed token data or null if invalid
 */
export function parseUnsubscribeToken(token: string): {
  userId: string;
  notificationType: string;
  timestamp: number;
} | null {
  try {
    const decoded = atob(token);
    const [userId, notificationType, timestampStr] = decoded.split(":");

    if (!userId || !notificationType || !timestampStr) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      return null;
    }

    // Check if token is not too old (e.g., 30 days)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (Date.now() - timestamp > maxAge) {
      logger.warn("Unsubscribe token expired", { token });
      return null;
    }

    return { userId, notificationType, timestamp };
  } catch (error) {
    logger.error("Failed to parse unsubscribe token", { error, token });
    return null;
  }
}

/**
 * Check if user is in GDPR-covered region
 * This is a simplified check - in production, use proper geolocation
 */
export function isGDPRApplicable(): boolean {
  // For now, assume GDPR applies to all users
  // In production, this should check user's location
  return true;
}
