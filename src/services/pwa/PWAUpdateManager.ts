/**
 * PWA Update Manager
 * Handles Progressive Web App service worker updates
 */
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("PWAUpdateManager");

class PWAUpdateManager {
  private updateListeners: Array<() => void> = [];
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize service worker update detection
   */
  private initialize(): void {
    if (!("serviceWorker" in navigator)) {
      logger.warn("Service Worker not supported");
      return;
    }

    // Check if addEventListener is available (may not be in test environment)
    if (typeof navigator.serviceWorker.addEventListener !== "function") {
      logger.warn("Service Worker addEventListener not available");
      return;
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SW_UPDATE_AVAILABLE") {
        logger.info("Service worker update available");
        this.notifyUpdateAvailable();
      }
    });

    // Get the service worker registration
    navigator.serviceWorker.ready
      .then((registration) => {
        this.registration = registration;
        logger.info("Service worker ready");

        // Check for updates periodically (every 1 hour)
        setInterval(
          () => {
            this.checkForUpdates();
          },
          60 * 60 * 1000,
        );
      })
      .catch((error) => {
        logger.error("Service worker registration error", error);
      });
  }

  /**
   * Check for service worker updates
   */
  public async checkForUpdates(): Promise<void> {
    if (!this.registration) {
      logger.warn("No service worker registration available");
      return;
    }

    try {
      await this.registration.update();
      logger.debug("Checked for service worker updates");
    } catch (error) {
      logger.error("Error checking for updates", error);
    }
  }

  /**
   * Apply pending service worker update
   */
  public async applyUpdate(): Promise<void> {
    if (!this.registration?.waiting) {
      logger.warn("No waiting service worker");
      return;
    }

    try {
      // Tell the waiting service worker to skip waiting and become active
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // Reload the page to use the new service worker
      window.location.reload();
    } catch (error) {
      logger.error("Error applying update", error);
    }
  }

  /**
   * Subscribe to update available events
   */
  public onUpdateAvailable(listener: () => void): () => void {
    this.updateListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.updateListeners = this.updateListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify listeners about available updates
   */
  private notifyUpdateAvailable(): void {
    this.updateListeners.forEach((listener) => listener());
  }
}

export const pwaUpdateManager = new PWAUpdateManager();
