/**
 * Prefetch Service
 * Prefetches data and routes based on user behavior and predictions
 * Phase 4: Advanced Optimizations - Data Prefetching
 */

import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("Prefetch");

interface PrefetchConfig {
  priority?: "high" | "low";
  when?: "idle" | "visible" | "hover" | "immediate";
}

class PrefetchService {
  private prefetchedRoutes: Set<string> = new Set();
  private prefetchedData: Map<string, unknown> = new Map();
  private observers: Map<string, IntersectionObserver> = new Map();

  /**
   * Prefetch a route
   */
  async prefetchRoute(
    route: string,
    config: PrefetchConfig = {},
  ): Promise<void> {
    const { priority = "low", when = "idle" } = config;

    if (this.prefetchedRoutes.has(route)) {
      logger.debug("Route already prefetched", { route });
      return;
    }

    logger.debug("Prefetching route", { route, priority, when });

    const prefetch = async () => {
      try {
        // Use native link prefetch when available
        if ("requestIdleCallback" in window && when === "idle") {
          requestIdleCallback(() => this.createPrefetchLink(route, priority), {
            timeout: 2000,
          });
        } else {
          this.createPrefetchLink(route, priority);
        }

        this.prefetchedRoutes.add(route);
        logger.info("Route prefetched", { route });
      } catch (error) {
        logger.error("Failed to prefetch route", {
          route,
          error: error as Error,
        });
      }
    };

    if (when === "immediate") {
      await prefetch();
    } else if (when === "idle") {
      this.scheduleOnIdle(prefetch);
    }
  }

  /**
   * Prefetch data
   */
  async prefetchData<T>(
    key: string,
    loader: () => Promise<T>,
    config: PrefetchConfig = {},
  ): Promise<void> {
    const { when = "idle" } = config;

    if (this.prefetchedData.has(key)) {
      logger.debug("Data already prefetched", { key });
      return;
    }

    logger.debug("Prefetching data", { key, when });

    const prefetch = async () => {
      try {
        const data = await loader();
        this.prefetchedData.set(key, data);
        logger.info("Data prefetched", { key });
      } catch (error) {
        logger.error("Failed to prefetch data", {
          key,
          error: error as Error,
        });
      }
    };

    if (when === "immediate") {
      await prefetch();
    } else if (when === "idle") {
      this.scheduleOnIdle(prefetch);
    }
  }

  /**
   * Get prefetched data
   */
  getPrefetchedData<T>(key: string): T | null {
    return (this.prefetchedData.get(key) as T) || null;
  }

  /**
   * Setup viewport prefetching with Intersection Observer
   */
  setupViewportPrefetch(
    element: HTMLElement,
    route: string,
    config: PrefetchConfig = {},
  ): void {
    const observerKey = `viewport:${route}`;

    if (this.observers.has(observerKey)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.prefetchRoute(route, { ...config, when: "immediate" });
            observer.disconnect();
            this.observers.delete(observerKey);
          }
        });
      },
      {
        rootMargin: "50px", // Start prefetching 50px before element enters viewport
      },
    );

    observer.observe(element);
    this.observers.set(observerKey, observer);

    logger.debug("Viewport prefetch setup", { route });
  }

  /**
   * Setup hover prefetching
   */
  setupHoverPrefetch(element: HTMLElement, route: string): void {
    let timeout: NodeJS.Timeout;

    const handleMouseEnter = () => {
      // Debounce to avoid excessive prefetching
      timeout = setTimeout(() => {
        this.prefetchRoute(route, { when: "immediate", priority: "high" });
      }, 100);
    };

    const handleMouseLeave = () => {
      clearTimeout(timeout);
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    logger.debug("Hover prefetch setup", { route });
  }

  /**
   * Predictive prefetching based on current route
   */
  predictivePrefetch(currentRoute: string): void {
    const predictions = this.getPredictions(currentRoute);

    predictions.forEach((route) => {
      this.prefetchRoute(route, { when: "idle", priority: "low" });
    });

    logger.debug("Predictive prefetch", { currentRoute, predictions });
  }

  /**
   * Get route predictions based on current route
   */
  private getPredictions(currentRoute: string): string[] {
    const predictions: Record<string, string[]> = {
      "/": ["/chastity-tracking", "/tasks", "/log-event"],
      "/chastity-tracking": ["/", "/log-event", "/full-report"],
      "/tasks": ["/", "/chastity-tracking"],
      "/keyholder": ["/tasks", "/rewards-punishments", "/rules"],
      "/settings": ["/"],
    };

    return predictions[currentRoute] || [];
  }

  /**
   * Create a prefetch link element
   */
  private createPrefetchLink(route: string, priority: string): void {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = route;
    link.as = "document";

    if (priority === "high") {
      link.setAttribute("importance", "high");
    }

    document.head.appendChild(link);
  }

  /**
   * Schedule a task on idle
   */
  private scheduleOnIdle(callback: () => void | Promise<void>): void {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        () => {
          callback();
        },
        { timeout: 2000 },
      );
    } else {
      setTimeout(callback, 1000);
    }
  }

  /**
   * Clear prefetch cache
   */
  clear(): void {
    this.prefetchedRoutes.clear();
    this.prefetchedData.clear();

    // Disconnect all observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    logger.info("Prefetch cache cleared");
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      prefetchedRoutes: this.prefetchedRoutes.size,
      prefetchedData: this.prefetchedData.size,
      activeObservers: this.observers.size,
    };
  }
}

// Export singleton instance
export const prefetchService = new PrefetchService();
