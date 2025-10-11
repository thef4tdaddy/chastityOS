/**
 * Periodic Sync Service
 * Handles periodic background sync for refreshing app data
 */
import { serviceLogger } from "@/utils/logging";
import { db } from "../firebase";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";

const logger = serviceLogger("PeriodicSyncService");

export interface PeriodicSyncSettings {
  enabled: boolean;
  intervalMinutes: number;
  lastSyncTime?: number;
  batteryAware: boolean;
}

/**
 * Periodic Sync Service
 * Manages periodic background data refresh
 */
export class PeriodicSyncService {
  private static instance: PeriodicSyncService;
  private registration: ServiceWorkerRegistration | null = null;
  private settings: PeriodicSyncSettings = {
    enabled: false,
    intervalMinutes: 15, // Minimum allowed by browsers
    batteryAware: true,
  };

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): PeriodicSyncService {
    if (!PeriodicSyncService.instance) {
      PeriodicSyncService.instance = new PeriodicSyncService();
    }
    return PeriodicSyncService.instance;
  }

  /**
   * Check if periodic sync is supported
   */
  isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      "periodicSync" in (window.ServiceWorkerRegistration || {}).prototype
    );
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem("periodicSyncSettings");
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error("Failed to load periodic sync settings", error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(
        "periodicSyncSettings",
        JSON.stringify(this.settings),
      );
    } catch (error) {
      logger.error("Failed to save periodic sync settings", error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): PeriodicSyncSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  async updateSettings(
    newSettings: Partial<PeriodicSyncSettings>,
  ): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // If enabled, register periodic sync
    if (this.settings.enabled) {
      await this.register();
    } else {
      await this.unregister();
    }
  }

  /**
   * Register periodic sync
   */
  async register(): Promise<void> {
    if (!this.isSupported()) {
      logger.warn("Periodic sync not supported");
      return;
    }

    try {
      // Check battery status if battery-aware is enabled
      if (this.settings.batteryAware && "getBattery" in navigator) {
        // @ts-expect-error - Battery API types not available
        const battery = await navigator.getBattery();
        if (battery.charging === false && battery.level < 0.2) {
          logger.info("Battery low, skipping periodic sync registration");
          return;
        }
      }

      this.registration = await navigator.serviceWorker.ready;

      // Convert minutes to milliseconds for the minimum interval
      const minInterval = this.settings.intervalMinutes * 60 * 1000;

      await this.registration.periodicSync.register("refresh-app-data", {
        minInterval,
      });

      this.settings.lastSyncTime = Date.now();
      this.saveSettings();

      logger.info("Periodic sync registered successfully");
    } catch (error) {
      logger.error("Failed to register periodic sync", error);
      throw error;
    }
  }

  /**
   * Unregister periodic sync
   */
  async unregister(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.periodicSync.unregister("refresh-app-data");
      logger.info("Periodic sync unregistered");
    } catch (error) {
      logger.error("Failed to unregister periodic sync", error);
    }
  }

  /**
   * Get list of registered periodic syncs
   */
  async getTags(): Promise<string[]> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.periodicSync.getTags();
    } catch (error) {
      logger.error("Failed to get periodic sync tags", error);
      return [];
    }
  }

  /**
   * Refresh app data
   * This is called by the service worker during periodic sync
   */
  async refreshAppData(userId: string | null): Promise<void> {
    if (!userId) {
      logger.warn("No user ID provided, skipping data refresh");
      return;
    }

    try {
      logger.info("Starting data refresh");

      // Update last sync time
      this.settings.lastSyncTime = Date.now();
      this.saveSettings();

      // Fetch latest data from Firebase
      const updates = await this.fetchLatestData(userId);

      // Update local cache with fresh data
      await this.updateLocalCache(updates);

      // Update badge count if needed
      await this.updateBadgeCount(updates);

      logger.info("Data refresh completed successfully");
    } catch (error) {
      logger.error("Failed to refresh app data", error);
      throw error;
    }
  }

  /**
   * Fetch latest data from Firebase
   */
  private async fetchLatestData(userId: string): Promise<{
    tasks: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
    notifications: Array<Record<string, unknown>>;
  }> {
    try {
      // Fetch pending tasks
      const tasksRef = collection(db, "users", userId, "tasks");
      const tasksQuery = query(
        tasksRef,
        orderBy("createdAt", "desc"),
        limit(10),
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch recent events
      const eventsRef = collection(db, "users", userId, "events");
      const eventsQuery = query(
        eventsRef,
        orderBy("timestamp", "desc"),
        limit(10),
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch notifications (if collection exists)
      const notificationsRef = collection(db, "users", userId, "notifications");
      const notificationsQuery = query(
        notificationsRef,
        orderBy("createdAt", "desc"),
        limit(10),
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { tasks, events, notifications };
    } catch (error) {
      logger.error("Failed to fetch latest data", error);
      throw error;
    }
  }

  /**
   * Update local cache with fresh data
   */
  private async updateLocalCache(updates: {
    tasks: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
    notifications: Array<Record<string, unknown>>;
  }): Promise<void> {
    try {
      // Store in localStorage for quick access
      localStorage.setItem(
        "cachedData",
        JSON.stringify({
          tasks: updates.tasks,
          events: updates.events,
          notifications: updates.notifications,
          lastUpdate: Date.now(),
        }),
      );

      logger.debug("Local cache updated");
    } catch (error) {
      logger.error("Failed to update local cache", error);
    }
  }

  /**
   * Update badge count
   */
  private async updateBadgeCount(updates: {
    tasks: Array<Record<string, unknown>>;
    notifications: Array<Record<string, unknown>>;
  }): Promise<void> {
    try {
      // Count pending tasks and unread notifications
      const pendingTasks = updates.tasks.filter(
        (task) => task.status === "pending",
      );
      const unreadNotifications = updates.notifications.filter(
        (notif) => !notif.read,
      );

      const badgeCount = pendingTasks.length + unreadNotifications.length;

      // Update badge if supported
      if ("setAppBadge" in navigator) {
        if (badgeCount > 0) {
          await navigator.setAppBadge(badgeCount);
        } else {
          await navigator.clearAppBadge();
        }
      }

      logger.debug(`Badge count updated: ${badgeCount}`);
    } catch (error) {
      logger.error("Failed to update badge count", error);
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number | undefined {
    return this.settings.lastSyncTime;
  }
}

export const periodicSyncService = PeriodicSyncService.getInstance();
