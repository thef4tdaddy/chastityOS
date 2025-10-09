/**
 * Progressive Loading Hook
 * Hook for managing progressive loading in React components
 * Phase 4: Advanced Optimizations - Progressive Loading
 */

import { useState, useEffect, useCallback } from "react";
import {
  loadingPriorityService,
  LoadingPriority,
  LoadableFeature,
} from "@/services/performance/LoadingPriorityService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useProgressiveLoading");

interface ProgressiveLoadingOptions {
  priority: LoadingPriority;
  autoLoad?: boolean;
  dependencies?: string[];
}

/**
 * Hook for progressive loading of features
 */
export function useProgressiveLoading(
  featureName: string,
  loader: () => Promise<unknown>,
  options: ProgressiveLoadingOptions,
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { priority, autoLoad = true, dependencies = [] } = options;

  useEffect(() => {
    // Register the feature
    const feature: LoadableFeature = {
      name: featureName,
      priority,
      loader: async () => {
        setIsLoading(true);
        try {
          await loader();
          setIsLoaded(true);
          setError(null);
        } catch (err) {
          setError(err as Error);
          logger.error("Feature loading failed", {
            feature: featureName,
            error: err as Error,
          });
        } finally {
          setIsLoading(false);
        }
      },
      dependencies,
    };

    loadingPriorityService.registerFeature(feature);

    // Auto-load if enabled
    if (autoLoad) {
      if (priority === LoadingPriority.LOW) {
        loadingPriorityService.loadOnIdle(priority);
      } else {
        loadingPriorityService
          .loadByPriority(priority)
          .catch((err) =>
            logger.error("Failed to load priority", { priority, error: err }),
          );
      }
    }
  }, [featureName, priority, autoLoad, dependencies, loader]);

  const load = useCallback(() => {
    loadingPriorityService.loadFeature(featureName);
  }, [featureName]);

  return { isLoaded, isLoading, error, load };
}

/**
 * Hook for core loading state
 */
export function useCoreLoading() {
  const [isCoreLoaded, setIsCoreLoaded] = useState(
    loadingPriorityService.isCoreReady(),
  );

  useEffect(() => {
    loadingPriorityService.onCoreLoaded(() => {
      setIsCoreLoaded(true);
    });
  }, []);

  return { isCoreLoaded };
}

/**
 * Hook for loading statistics
 */
export function useLoadingStats() {
  const [stats, setStats] = useState(loadingPriorityService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(loadingPriorityService.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
