/**
 * Performance Services
 * Central export for all performance optimization services
 * Phase 4: Advanced Optimizations
 */

// Loading and Progressive Enhancement
export {
  loadingPriorityService,
  LoadingPriority,
  type LoadableFeature,
} from "./LoadingPriorityService";

// Caching
export { queryCacheService } from "./QueryCacheService";

// Network Optimization
export { requestBatchingService } from "./RequestBatchingService";
export { prefetchService } from "./PrefetchService";

// Firebase Optimization
export { firebaseQueryOptimizer } from "./FirebaseQueryOptimizer";

// Task Scheduling
export { taskScheduler } from "./TaskScheduler";
