/**
 * Loading Priority Service
 * Manages progressive loading of application features based on priority
 * Phase 4: Advanced Optimizations - Progressive Loading
 */

import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("LoadingPriority");

export enum LoadingPriority {
  CRITICAL = 1, // Auth, Navigation, Core UI
  HIGH = 2, // Dashboard, Tracker
  MEDIUM = 3, // Charts, Advanced features
  LOW = 4, // Analytics, Non-critical features
}

export interface LoadableFeature {
  name: string;
  priority: LoadingPriority;
  loader: () => Promise<unknown>;
  dependencies?: string[];
}

class LoadingPriorityService {
  private loadedFeatures: Set<string> = new Set();
  private loadingFeatures: Map<string, Promise<unknown>> = new Map();
  private features: Map<string, LoadableFeature> = new Map();
  private coreLoadedCallbacks: (() => void)[] = [];
  private isCoreLoaded = false;

  /**
   * Register a feature for progressive loading
   */
  registerFeature(feature: LoadableFeature): void {
    this.features.set(feature.name, feature);
    logger.debug("Registered feature", {
      name: feature.name,
      priority: feature.priority,
    });
  }

  /**
   * Load features by priority
   */
  async loadByPriority(priority: LoadingPriority): Promise<void> {
    const featuresToLoad = Array.from(this.features.values()).filter(
      (f) => f.priority === priority && !this.loadedFeatures.has(f.name),
    );

    logger.info("Loading features by priority", {
      priority,
      count: featuresToLoad.length,
    });

    const loadPromises = featuresToLoad.map((feature) =>
      this.loadFeature(feature.name),
    );

    await Promise.all(loadPromises);

    // Mark core as loaded after Priority 1 is complete
    if (priority === LoadingPriority.CRITICAL && !this.isCoreLoaded) {
      this.isCoreLoaded = true;
      this.coreLoadedCallbacks.forEach((cb) => cb());
      this.coreLoadedCallbacks = [];
    }
  }

  /**
   * Load a specific feature
   */
  async loadFeature(name: string): Promise<void> {
    const feature = this.features.get(name);
    if (!feature) {
      logger.warn("Feature not found", { name });
      return;
    }

    // Return existing loading promise if already loading
    if (this.loadingFeatures.has(name)) {
      return this.loadingFeatures.get(name) as Promise<void>;
    }

    // Already loaded
    if (this.loadedFeatures.has(name)) {
      return Promise.resolve();
    }

    // Check and load dependencies first
    if (feature.dependencies) {
      const depPromises = feature.dependencies.map((dep) =>
        this.loadFeature(dep),
      );
      await Promise.all(depPromises);
    }

    // Load the feature
    const loadPromise = (async () => {
      try {
        logger.debug("Loading feature", { name });
        const startTime = performance.now();

        await feature.loader();

        const duration = performance.now() - startTime;
        this.loadedFeatures.add(name);
        this.loadingFeatures.delete(name);

        logger.info("Feature loaded successfully", { name, duration });
      } catch (error) {
        logger.error("Failed to load feature", {
          name,
          error: error as Error,
        });
        this.loadingFeatures.delete(name);
        throw error;
      }
    })();

    this.loadingFeatures.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Load features on idle (for low-priority features)
   */
  loadOnIdle(priority: LoadingPriority): void {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        () => {
          this.loadByPriority(priority).catch((error) => {
            logger.error("Failed to load idle features", {
              priority,
              error: error as Error,
            });
          });
        },
        { timeout: 5000 },
      );
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        this.loadByPriority(priority).catch((error) => {
          logger.error("Failed to load idle features", {
            priority,
            error: error as Error,
          });
        });
      }, 1000);
    }
  }

  /**
   * Check if a feature is loaded
   */
  isFeatureLoaded(name: string): boolean {
    return this.loadedFeatures.has(name);
  }

  /**
   * Check if core features are loaded
   */
  isCoreReady(): boolean {
    return this.isCoreLoaded;
  }

  /**
   * Register callback for when core is loaded
   */
  onCoreLoaded(callback: () => void): void {
    if (this.isCoreLoaded) {
      callback();
    } else {
      this.coreLoadedCallbacks.push(callback);
    }
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      total: this.features.size,
      loaded: this.loadedFeatures.size,
      loading: this.loadingFeatures.size,
      pending: this.features.size - this.loadedFeatures.size,
      coreLoaded: this.isCoreLoaded,
    };
  }

  /**
   * Reset the service (for testing)
   */
  reset(): void {
    this.loadedFeatures.clear();
    this.loadingFeatures.clear();
    this.features.clear();
    this.coreLoadedCallbacks = [];
    this.isCoreLoaded = false;
  }
}

// Export singleton instance
export const loadingPriorityService = new LoadingPriorityService();
