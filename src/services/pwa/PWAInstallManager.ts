/**
 * PWA Install Manager
 * Handles Progressive Web App installation prompts and events
 */
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("PWAInstallManager");

// BeforeInstallPromptEvent interface (not in TypeScript by default)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAInstallManager {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private installListeners: Array<(canInstall: boolean) => void> = [];
  private installedListeners: Array<() => void> = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize PWA install event listeners
   */
  private initialize(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      logger.info("Install prompt available");

      // Notify listeners that install is available
      this.notifyInstallAvailable(true);
    });

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      logger.info("PWA installed successfully");
      this.installPrompt = null;

      // Notify listeners that app was installed
      this.notifyAppInstalled();
    });
  }

  /**
   * Check if the app can be installed
   */
  public canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Prompt the user to install the app
   */
  public async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      logger.warn("No install prompt available");
      return false;
    }

    try {
      // Show the install prompt
      await this.installPrompt.prompt();

      // Wait for the user to respond
      const result = await this.installPrompt.userChoice;

      if (result.outcome === "accepted") {
        logger.info("User accepted install prompt");
        return true;
      } else {
        logger.info("User dismissed install prompt");
        return false;
      }
    } catch (error) {
      logger.error("Error showing install prompt", error);
      return false;
    } finally {
      // Clear the prompt after use
      this.installPrompt = null;
      this.notifyInstallAvailable(false);
    }
  }

  /**
   * Subscribe to install availability changes
   */
  public onInstallAvailable(
    listener: (canInstall: boolean) => void,
  ): () => void {
    this.installListeners.push(listener);

    // Immediately notify with current state
    listener(this.canInstall());

    // Return unsubscribe function
    return () => {
      this.installListeners = this.installListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  /**
   * Subscribe to app installed events
   */
  public onAppInstalled(listener: () => void): () => void {
    this.installedListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.installedListeners = this.installedListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  /**
   * Notify listeners about install availability
   */
  private notifyInstallAvailable(canInstall: boolean): void {
    this.installListeners.forEach((listener) => listener(canInstall));
  }

  /**
   * Notify listeners about app installation
   */
  private notifyAppInstalled(): void {
    this.installedListeners.forEach((listener) => listener());
  }
}

export const pwaInstallManager = new PWAInstallManager();
