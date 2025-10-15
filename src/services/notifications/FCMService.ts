/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles FCM token management, registration, and lifecycle
 */
import { getFirebaseApp } from "@/services/firebase";
import { getFirestore } from "@/services/firebase";
import { doc, setDoc, deleteField } from "firebase/firestore";
import { serviceLogger } from "@/utils/logging";
import type { FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

const logger = serviceLogger("FCMService");

export interface FCMServiceConfig {
  vapidKey: string;
}

/**
 * FCM Service for managing push notification tokens
 */
export class FCMService {
  private static messaging: Messaging | null = null;
  private static isSupported = false;
  private static checkPromise: Promise<boolean> | null = null;

  /**
   * Check if push notifications are supported in this browser
   */
  static async isNotificationSupported(): Promise<boolean> {
    // Return cached result if already checked
    if (this.checkPromise) {
      return this.checkPromise;
    }

    this.checkPromise = (async () => {
      try {
        // Check for required APIs
        if (!("Notification" in window)) {
          logger.info("Notifications API not available");
          return false;
        }

        if (!("serviceWorker" in navigator)) {
          logger.info("Service Worker not available");
          return false;
        }

        // Check if Firebase Messaging is supported
        const { isSupported } = await import("firebase/messaging");

        const supported = await isSupported();
        if (!supported) {
          logger.info("Firebase Messaging not supported");
          return false;
        }

        this.isSupported = true;
        logger.debug("Push notifications are supported");
        return true;
      } catch (error) {
        logger.warn("Error checking notification support", { error });
        return false;
      }
    })();

    return this.checkPromise;
  }

  /**
   * Initialize FCM messaging instance
   */
  private static async getMessagingInstance(): Promise<Messaging> {
    if (!this.isSupported) {
      throw new Error("Push notifications not supported");
    }

    if (this.messaging) {
      return this.messaging;
    }

    try {
      const app = await getFirebaseApp();
      const { getMessaging } = await import("firebase/messaging");
      this.messaging = getMessaging(app as FirebaseApp);
      return this.messaging;
    } catch (error) {
      logger.error("Failed to initialize FCM messaging", { error });
      throw error;
    }
  }

  /**
   * Request FCM token with VAPID key
   */
  static async requestToken(userId: string): Promise<string | null> {
    try {
      const supported = await this.isNotificationSupported();
      if (!supported) {
        logger.info("Cannot request token - notifications not supported");
        return null;
      }

      // Check permission state
      const permission = Notification.permission;
      if (permission !== "granted") {
        logger.info("Cannot request token - permission not granted", {
          permission,
        });
        return null;
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        logger.error("VAPID key not configured");
        return null;
      }

      const messaging = await this.getMessagingInstance();
      const { getToken } = await import("firebase/messaging");

      logger.debug("Requesting FCM token");

      const token = await getToken(messaging, {
        vapidKey,
      });

      if (token) {
        logger.info("FCM token obtained successfully");
        await this.saveTokenToFirestore(userId, token);
        return token;
      } else {
        logger.warn("No FCM token received");
        return null;
      }
    } catch (error) {
      logger.error("Error requesting FCM token", { error });
      return null;
    }
  }

  /**
   * Save FCM token to user's Firestore document
   */
  private static async saveTokenToFirestore(
    userId: string,
    token: string,
  ): Promise<void> {
    try {
      const db = await getFirestore();
      const userDocRef = doc(db, "users", userId);

      await setDoc(
        userDocRef,
        {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date(),
        },
        { merge: true },
      );

      logger.debug("FCM token saved to Firestore", { userId });
    } catch (error) {
      logger.error("Failed to save FCM token to Firestore", { error });
      throw error;
    }
  }

  /**
   * Delete FCM token from Firestore
   */
  static async deleteToken(userId: string): Promise<void> {
    try {
      const supported = await this.isNotificationSupported();
      if (!supported) {
        logger.debug("Skipping token deletion - notifications not supported");
        return;
      }

      // Delete from FCM
      const messaging = await this.getMessagingInstance();
      const { deleteToken } = await import("firebase/messaging");

      await deleteToken(messaging);
      logger.debug("FCM token deleted from device");

      // Delete from Firestore
      const db = await getFirestore();
      const userDocRef = doc(db, "users", userId);

      await setDoc(
        userDocRef,
        {
          fcmToken: deleteField(),
          fcmTokenUpdatedAt: deleteField(),
        },
        { merge: true },
      );

      logger.info("FCM token deleted from Firestore", { userId });
    } catch (error) {
      logger.error("Error deleting FCM token", { error });
      throw error;
    }
  }

  /**
   * Refresh FCM token and update Firestore
   */
  static async refreshToken(userId: string): Promise<string | null> {
    try {
      logger.debug("Refreshing FCM token");
      return await this.requestToken(userId);
    } catch (error) {
      logger.error("Error refreshing FCM token", { error });
      return null;
    }
  }

  /**
   * Setup token refresh listener
   * Called when token is refreshed by Firebase
   */
  static async setupTokenRefreshListener(
    userId: string,
    onTokenRefresh?: (token: string) => void,
  ): Promise<() => void> {
    try {
      const supported = await this.isNotificationSupported();
      if (!supported) {
        return () => {}; // Return no-op cleanup function
      }

      const messaging = await this.getMessagingInstance();
      const { onMessage } = await import("firebase/messaging");

      // Listen for token refresh
      return onMessage(messaging, async (payload) => {
        logger.debug("FCM message received", { payload });

        // Check if this is a token refresh notification
        if (payload.data?.tokenRefresh) {
          logger.info("Token refresh detected");
          const newToken = await this.refreshToken(userId);
          if (newToken && onTokenRefresh) {
            onTokenRefresh(newToken);
          }
        }
      });
    } catch (error) {
      logger.error("Error setting up token refresh listener", { error });
      return () => {}; // Return no-op cleanup function
    }
  }
}
