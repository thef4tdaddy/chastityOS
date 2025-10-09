/**
 * Example: Optimized App Component
 * Demonstrates how to integrate Phase 4 optimizations into App.tsx
 *
 * This is an example file showing the integration pattern.
 * Copy relevant parts to your actual App.tsx implementation.
 *
 * Key Optimizations Demonstrated:
 * 1. Progressive loading with priority levels
 * 2. Skeleton screens for loading states
 * 3. Route prefetching
 * 4. Lazy-loaded components
 */

import React, { useEffect } from "react";

// Phase 4: Import performance services
import {
  loadingPriorityService,
  LoadingPriority,
  prefetchService,
} from "@/services/performance";
import { useCoreLoading } from "@/hooks/performance/useProgressiveLoading";
import { SkeletonDashboard } from "@/components/loading/SkeletonScreen";

function OptimizedApp(): React.ReactElement {
  const { isCoreLoaded } = useCoreLoading();

  useEffect(() => {
    // Setup progressive loading on mount
    setupProgressiveLoading();
  }, []);

  // Show skeleton while core features are loading
  if (!isCoreLoaded) {
    return <SkeletonDashboard showCharts={false} showStats />;
  }

  return (
    // Your app content
    <div>App loaded</div>
  );
}

/**
 * Setup Progressive Loading with 4 Priority Levels
 */
function setupProgressiveLoading() {
  // Priority 1: CRITICAL - Auth, Navigation, Core UI
  loadingPriorityService.registerFeature({
    name: "auth",
    priority: LoadingPriority.CRITICAL,
    loader: async () => {
      return Promise.resolve();
    },
  });

  // Priority 2: HIGH - Dashboard, Tracker
  loadingPriorityService.registerFeature({
    name: "dashboard",
    priority: LoadingPriority.HIGH,
    loader: async () => {
      await import("@/pages/Dashboard");
    },
    dependencies: ["auth"],
  });

  // Priority 3: MEDIUM - Charts, Tasks
  loadingPriorityService.registerFeature({
    name: "charts",
    priority: LoadingPriority.MEDIUM,
    loader: async () => {
      await import("chart.js");
    },
    dependencies: ["dashboard"],
  });

  // Priority 4: LOW - Analytics
  loadingPriorityService.registerFeature({
    name: "achievements",
    priority: LoadingPriority.LOW,
    loader: async () => {
      await import("@/pages/AchievementPage");
    },
  });

  // Start progressive loading
  loadingPriorityService
    .loadByPriority(LoadingPriority.CRITICAL)
    .then(() => loadingPriorityService.loadByPriority(LoadingPriority.HIGH))
    .then(() => {
      loadingPriorityService.loadOnIdle(LoadingPriority.MEDIUM);
      loadingPriorityService.loadOnIdle(LoadingPriority.LOW);
      setupRoutePrefetching();
    })
    .catch((error) => console.error("Loading failed:", error));
}

/**
 * Setup Route Prefetching
 */
function setupRoutePrefetching() {
  prefetchService.prefetchRoute("/", { when: "idle", priority: "low" });
  prefetchService.prefetchRoute("/chastity-tracking", {
    when: "idle",
    priority: "low",
  });
}

export default OptimizedApp;
