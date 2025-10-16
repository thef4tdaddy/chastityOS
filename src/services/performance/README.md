# Performance Services

This directory contains advanced performance optimization services implemented as part of **Phase 4: Advanced Optimizations** (Issue #477).

## Services Overview

### 1. LoadingPriorityService

Manages progressive loading of application features based on priority levels.

**Features:**

- 4 priority levels: CRITICAL, HIGH, MEDIUM, LOW
- Dependency management between features
- Automatic loading on idle for low-priority features
- Core loading state tracking

**Usage:**

```typescript
import {
  loadingPriorityService,
  LoadingPriority,
} from "@/services/performance";

// Register a feature
loadingPriorityService.registerFeature({
  name: "charts",
  priority: LoadingPriority.MEDIUM,
  loader: async () => {
    await import("./charts");
  },
  dependencies: ["dashboard"],
});

// Load by priority
await loadingPriorityService.loadByPriority(LoadingPriority.CRITICAL);

// Load on idle (for low-priority features)
loadingPriorityService.loadOnIdle(LoadingPriority.LOW);
```

### 2. QueryCacheService

Provides TTL-based caching for database queries with pattern invalidation.

**Features:**

- TTL-based expiration (default: 5 minutes)
- Pattern-based invalidation
- LRU eviction (max 100 entries)
- Automatic cleanup
- `getOrSet` and `withCache` helpers

**Usage:**

```typescript
import { queryCacheService } from "@/services/performance";

// Simple caching
queryCacheService.set("user:123", userData, { ttl: 60000 });
const user = queryCacheService.get("user:123");

// Get or set with loader
const data = await queryCacheService.getOrSet(
  "tasks:active",
  async () => await fetchActiveTasks(),
  { ttl: 300000 },
);

// Wrap a function with caching
const getCachedUser = queryCacheService.withCache(
  "user",
  async (id: string) => await fetchUser(id),
);

// Invalidate by pattern
queryCacheService.invalidatePattern("user:");
```

### 3. RequestBatchingService

Batches multiple API calls and deduplicates identical requests.

**Features:**

- Automatic request batching (50ms window)
- Request deduplication (1s window)
- Configurable batch size (default: 10)
- Per-endpoint batching

**Usage:**

```typescript
import { requestBatchingService } from "@/services/performance";

// Queue a request (will be automatically batched)
const result = await requestBatchingService.batchRequest("/api/user", {
  id: "123",
});

// Duplicate requests in the deduplication window will share the same promise
```

### 4. PrefetchService

Prefetches routes and data based on user behavior and predictions.

**Features:**

- Route prefetching
- Data prefetching
- Viewport-based prefetching (Intersection Observer)
- Hover-based prefetching
- Predictive prefetching based on current route

**Usage:**

```typescript
import { prefetchService } from "@/services/performance";

// Prefetch a route
await prefetchService.prefetchRoute("/dashboard", {
  priority: "high",
  when: "idle",
});

// Prefetch data
await prefetchService.prefetchData(
  "user-profile",
  async () => await fetchUserProfile(),
  { when: "idle" },
);

// Setup viewport prefetching
prefetchService.setupViewportPrefetch(element, "/tasks");

// Setup hover prefetching
prefetchService.setupHoverPrefetch(linkElement, "/keyholder");

// Predictive prefetching
prefetchService.predictivePrefetch("/dashboard");
```

### 5. FirebaseQueryOptimizer

Optimizes Firestore queries with caching and performance best practices.

**Features:**

- Pagination helpers (forward/backward)
- Query result caching
- Batch query execution
- Performance monitoring
- Real-time listener optimization

**Usage:**

```typescript
import { firebaseQueryOptimizer } from "@/services/performance";
import { collection, where, orderBy } from "firebase/firestore";

// Create a paginated query
const baseQuery = collection(db, "tasks");
const constraints = [where("userId", "==", userId), orderBy("createdAt")];
const paginatedQuery = firebaseQueryOptimizer.createPaginatedQuery(
  baseQuery,
  constraints,
  {
    pagination: { pageSize: 20, direction: "forward" },
    cache: true,
  },
);

// Execute with caching
const result = await firebaseQueryOptimizer.executeWithCache(
  "tasks:active",
  async () => await getDocs(paginatedQuery),
  { cacheTTL: 300000 },
);

// Monitor query performance
const data = await firebaseQueryOptimizer.monitorQuery(
  "fetch-user-tasks",
  async () => await getDocs(query),
);

// Optimize real-time listeners
const { update, cleanup } = firebaseQueryOptimizer.optimizeRealtimeListener(
  "tasks-listener",
  (data) => setTasks(data),
  (error) => console.error(error),
);
```

### 6. TaskScheduler

Breaks up long tasks and schedules work efficiently using `requestIdleCallback`.

**Features:**

- Idle task scheduling
- Priority-based queue (high/normal/low)
- Task chunking
- Automatic yielding
- Long task detection and warnings

**Usage:**

```typescript
import { taskScheduler } from "@/services/performance";

// Schedule an idle task
const taskId = taskScheduler.scheduleIdleTask(
  async () => {
    // Heavy computation
    await processData();
  },
  { priority: "low", timeout: 5000 },
);

// Break up a long task
await taskScheduler.breakUpTask(
  largeArray,
  async (item) => {
    await processItem(item);
  },
  {
    chunkSize: 10,
    onProgress: (progress) => console.log(`${progress}% complete`),
  },
);

// Run with automatic yielding
await taskScheduler.runWithYield(
  items,
  async (item) => {
    await processItem(item);
  },
  50, // Yield every 50ms
);

// Cancel a task
taskScheduler.cancelTask(taskId);
```

## React Hooks

### useProgressiveLoading

Hook for progressive loading of features in React components.

```typescript
import { useProgressiveLoading, LoadingPriority } from '@/hooks/performance/useProgressiveLoading';

function MyComponent() {
  const { isLoaded, isLoading, error } = useProgressiveLoading(
    'my-feature',
    async () => {
      await import('./heavy-component');
    },
    { priority: LoadingPriority.MEDIUM }
  );

  if (isLoading) return <Skeleton />;
  if (error) return <Error error={error} />;
  if (!isLoaded) return null;

  return <HeavyComponent />;
}
```

### useCoreLoading

Hook to check if core features are loaded.

```typescript
import { useCoreLoading } from '@/hooks/performance/useProgressiveLoading';

function App() {
  const { isCoreLoaded } = useCoreLoading();

  if (!isCoreLoaded) {
    return <CoreLoadingScreen />;
  }

  return <MainApp />;
}
```

## Components

### SkeletonScreen

Skeleton loading components for better perceived performance.

```typescript
import { Skeleton, SkeletonCard, SkeletonList, SkeletonDashboard } from '@/components/loading/SkeletonScreen';

// Basic skeleton
<Skeleton width="100%" height={20} />

// Skeleton card
<SkeletonCard lines={3} showAvatar showActions />

// Skeleton list
<SkeletonList items={5} showAvatar />

// Full dashboard skeleton
<SkeletonDashboard showCharts showStats />
```

## Testing

All services include comprehensive unit tests:

```bash
npm run test:unit -- src/services/performance/__tests__
```

## Performance Metrics

All services log performance metrics using the logging system:

- Query durations
- Cache hit/miss rates
- Task execution times
- Long task warnings (>50ms)

Check the browser console or use the logging utilities to monitor performance.

## Best Practices

1. **Progressive Loading**: Load critical features first, defer non-critical features
2. **Caching**: Use appropriate TTL values based on data volatility
3. **Request Batching**: Group related API calls when possible
4. **Prefetching**: Prefetch predictable user journeys
5. **Task Scheduling**: Break up long tasks to avoid blocking the main thread
6. **Firebase Queries**: Use pagination and caching for large datasets

## Configuration

Most services have sensible defaults but can be configured:

- **QueryCacheService**: Max cache size (100 entries), default TTL (5 minutes)
- **RequestBatchingService**: Batch delay (50ms), max batch size (10)
- **PrefetchService**: Predictable routes configuration
- **TaskScheduler**: Chunk size (10 items), yield interval (50ms)

## Related Issues

- Issue #477: Phase 4 - Advanced Optimizations (Progressive Loading & Database)
- Issue #97: Performance and Bundle Optimization (Parent Issue)
- Issue #474: Phase 1 - Core Optimizations
- Issue #475: Phase 2 - Build Optimizations
- Issue #476: Phase 3 - Asset Optimizations
