/**
 * Route Preloader Utility
 * Enables preloading of lazy-loaded routes on hover/focus for faster navigation
 */

// Map of route paths to their lazy import functions
const routePreloadMap: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Dashboard"),
  "/chastity-tracking": () => import("@/pages/ChastityTracking"),
  "/tasks": () => import("@/pages/TasksPage"),
  "/log-event": () => import("@/pages/LogEventPage"),
  "/rewards-punishments": () => import("@/pages/RewardsPunishmentsPage"),
  "/rules": () => import("@/pages/RulesPage"),
  "/full-report": () => import("@/pages/FullReportPage"),
  "/settings": () => import("@/pages/SettingsPage"),
  "/keyholder": () => import("@/pages/KeyholderPage"),
  "/keyholder-demo": () => import("@/pages/KeyholderDemo"),
  "/achievements": () => import("@/pages/AchievementPage"),
  "/relationships": () => import("@/pages/RelationshipsPage"),
};

// Track which routes have already been preloaded
const preloadedRoutes = new Set<string>();

/**
 * Preload a route's code chunk
 * @param path - The route path to preload
 */
export function preloadRoute(path: string): void {
  // Don't preload if already preloaded
  if (preloadedRoutes.has(path)) {
    return;
  }

  // Get the preload function for this route
  const preloadFn = routePreloadMap[path];
  if (!preloadFn) {
    return;
  }

  // Mark as preloaded and start loading
  preloadedRoutes.add(path);
  preloadFn().catch(() => {
    // If preload fails, remove from set so it can be retried
    preloadedRoutes.delete(path);
  });
}

/**
 * Preload multiple routes at once
 * @param paths - Array of route paths to preload
 */
export function preloadRoutes(paths: string[]): void {
  paths.forEach(preloadRoute);
}

/**
 * Create mouse/touch event handlers for preloading on hover/focus
 * @param path - The route path to preload
 * @returns Object with onMouseEnter and onFocus handlers
 */
export function useRoutePreload(path: string) {
  return {
    onMouseEnter: () => preloadRoute(path),
    onFocus: () => preloadRoute(path),
  };
}
