# Phase 4 Implementation Guide

This guide explains how to integrate the Phase 4 advanced optimizations into the ChastityOS application.

## Table of Contents

1. [Progressive Loading](#progressive-loading)
2. [Database Query Optimization](#database-query-optimization)
3. [Firebase Query Optimization](#firebase-query-optimization)
4. [Network Optimization](#network-optimization)
5. [Data Prefetching](#data-prefetching)
6. [Long Task Optimization](#long-task-optimization)
7. [Component Updates](#component-updates)

## Progressive Loading

### 1. Update App.tsx to use Progressive Loading

```typescript
import { useEffect } from 'react';
import { loadingPriorityService, LoadingPriority } from '@/services/performance';
import { useCoreLoading } from '@/hooks/performance/useProgressiveLoading';
import { SkeletonDashboard } from '@/components/loading/SkeletonScreen';

function App() {
  const { isCoreLoaded } = useCoreLoading();

  useEffect(() => {
    // Priority 1: Critical features (Auth, Navigation, Core UI)
    loadingPriorityService.registerFeature({
      name: 'auth',
      priority: LoadingPriority.CRITICAL,
      loader: async () => {
        // Auth is already loaded, mark as complete
        return Promise.resolve();
      },
    });

    loadingPriorityService.registerFeature({
      name: 'navigation',
      priority: LoadingPriority.CRITICAL,
      loader: async () => {
        // Navigation is already loaded, mark as complete
        return Promise.resolve();
      },
    });

    // Priority 2: High priority features (Dashboard, Tracker)
    loadingPriorityService.registerFeature({
      name: 'dashboard',
      priority: LoadingPriority.HIGH,
      loader: async () => {
        await import('./pages/Dashboard');
      },
      dependencies: ['auth', 'navigation'],
    });

    loadingPriorityService.registerFeature({
      name: 'tracker',
      priority: LoadingPriority.HIGH,
      loader: async () => {
        await import('./pages/ChastityTracking');
      },
      dependencies: ['auth', 'navigation'],
    });

    // Priority 3: Medium priority (Charts, Advanced features)
    loadingPriorityService.registerFeature({
      name: 'charts',
      priority: LoadingPriority.MEDIUM,
      loader: async () => {
        await import('chart.js');
      },
      dependencies: ['dashboard'],
    });

    // Priority 4: Low priority (Analytics, Non-critical)
    loadingPriorityService.registerFeature({
      name: 'analytics',
      priority: LoadingPriority.LOW,
      loader: async () => {
        // Load analytics lazily
      },
    });

    // Start loading by priority
    loadingPriorityService.loadByPriority(LoadingPriority.CRITICAL)
      .then(() => loadingPriorityService.loadByPriority(LoadingPriority.HIGH))
      .then(() => {
        // Load medium priority on idle
        loadingPriorityService.loadOnIdle(LoadingPriority.MEDIUM);
        // Load low priority on idle
        loadingPriorityService.loadOnIdle(LoadingPriority.LOW);
      });
  }, []);

  if (!isCoreLoaded) {
    return <SkeletonDashboard />;
  }

  return (
    // Your app content
  );
}
```

### 2. Use Skeleton Screens in Components

Replace loading spinners with skeleton screens:

```typescript
import { SkeletonCard, SkeletonList } from '@/components/loading/SkeletonScreen';

function TasksPage() {
  const { isLoading, tasks } = useTasks();

  if (isLoading) {
    return <SkeletonList items={5} />;
  }

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

### 3. Use Progressive Images

Replace standard images with progressive loading:

```typescript
import { ProgressiveImage } from '@/components/loading/ProgressiveImage';

function UserAvatar({ user }) {
  return (
    <ProgressiveImage
      src={user.avatarUrl}
      placeholder={user.avatarThumbnail}
      alt={user.name}
      width={48}
      height={48}
      className="rounded-full"
    />
  );
}
```

## Database Query Optimization

### 1. Wrap Dexie Queries with Caching

```typescript
import { db } from '@/services/storage/dexie';
import { queryCacheService } from '@/services/performance';

// Before:
async function getTasks(userId: string) {
  return await db.tasks
    .where('[userId+status]')
    .equals([userId, 'active'])
    .toArray();
}

// After:
async function getTasks(userId: string) {
  const cacheKey = queryCacheService.generateCacheKey(
    'tasks',
    { userId, status: 'active' }
  );

  return await queryCacheService.getOrSet(
    cacheKey,
    async () => {
      return await db.tasks
        .where('[userId+status]')
        .equals([userId, 'active'])
        .toArray();
    },
    { ttl: 300000 } // 5 minutes
  );
}

// Invalidate cache on updates
async function updateTask(taskId: string, updates: Partial<Task>) {
  await db.tasks.update(taskId, updates);
  queryCacheService.invalidatePattern('tasks:');
}
```

### 2. Implement Pagination

```typescript
import { db } from '@/services/storage/dexie';

async function getTasksPaginated(userId: string, page: number, pageSize: number = 20) {
  const offset = page * pageSize;

  const tasks = await db.tasks
    .where('[userId+createdAt]')
    .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
    .offset(offset)
    .limit(pageSize)
    .toArray();

  const total = await db.tasks
    .where('userId')
    .equals(userId)
    .count();

  return {
    tasks,
    total,
    page,
    pageSize,
    hasMore: (offset + tasks.length) < total,
  };
}
```

## Firebase Query Optimization

### 1. Use FirebaseQueryOptimizer for Queries

```typescript
import { collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { firebaseQueryOptimizer } from '@/services/performance';

// Before:
async function getUserTasks(userId: string) {
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return await getDocs(q);
}

// After:
async function getUserTasks(userId: string, page: number = 0) {
  const baseQuery = collection(db, 'tasks');
  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  ];

  const cacheKey = firebaseQueryOptimizer.generateCacheKey(
    'tasks',
    { userId, page }
  );

  const paginatedQuery = firebaseQueryOptimizer.createPaginatedQuery(
    baseQuery,
    constraints,
    {
      pagination: { pageSize: 20, direction: 'forward' },
      cache: true
    }
  );

  return await firebaseQueryOptimizer.executeWithCache(
    cacheKey,
    async () => await getDocs(paginatedQuery),
    { cacheTTL: 300000 }
  );
}
```

### 2. Optimize Real-time Listeners

```typescript
import { onSnapshot } from 'firebase/firestore';
import { firebaseQueryOptimizer } from '@/services/performance';

// Before:
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    setTasks(snapshot.docs.map(doc => doc.data()));
  });

  return unsubscribe;
}, []);

// After:
useEffect(() => {
  const { update, cleanup } = firebaseQueryOptimizer.optimizeRealtimeListener(
    'tasks-listener',
    (data) => setTasks(data),
    (error) => console.error(error)
  );

  const unsubscribe = onSnapshot(query, (snapshot) => {
    update(snapshot.docs.map(doc => doc.data()));
  });

  return () => {
    unsubscribe();
    cleanup();
  };
}, []);
```

## Network Optimization

### 1. Use Request Batching

```typescript
import { requestBatchingService } from '@/services/performance';

// Instead of making multiple individual API calls:
async function loadUserData(userId: string) {
  const [profile, settings, tasks] = await Promise.all([
    requestBatchingService.batchRequest('/api/user/profile', { userId }),
    requestBatchingService.batchRequest('/api/user/settings', { userId }),
    requestBatchingService.batchRequest('/api/tasks', { userId }),
  ]);

  return { profile, settings, tasks };
}
```

### 2. Add Resource Hints

Already added to `index.html`:
```html
<!-- Resource Hints for Performance Optimization (Phase 4) -->
<link rel="preconnect" href="https://firestore.googleapis.com" />
<link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
<link rel="dns-prefetch" href="https://firebase.googleapis.com" />
```

## Data Prefetching

### 1. Setup Route Prefetching

```typescript
import { prefetchService } from '@/services/performance';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Prefetch likely next routes based on current location
    prefetchService.predictivePrefetch(location.pathname);
  }, [location]);

  return <Router />;
}
```

### 2. Setup Hover Prefetching on Links

```typescript
import { prefetchService } from '@/services/performance';
import { useRef, useEffect } from 'react';

function NavigationLink({ to, children }) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (linkRef.current) {
      prefetchService.setupHoverPrefetch(linkRef.current, to);
    }
  }, [to]);

  return (
    <a ref={linkRef} href={to}>
      {children}
    </a>
  );
}
```

### 3. Setup Viewport Prefetching

```typescript
import { prefetchService } from '@/services/performance';
import { useRef, useEffect } from 'react';

function TaskCard({ taskId }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      prefetchService.setupViewportPrefetch(
        cardRef.current,
        `/tasks/${taskId}`,
        { when: 'visible', priority: 'low' }
      );
    }
  }, [taskId]);

  return <div ref={cardRef}>...</div>;
}
```

## Long Task Optimization

### 1. Break Up Long Tasks

```typescript
import { taskScheduler } from '@/services/performance';

// Before:
function processAllTasks(tasks: Task[]) {
  tasks.forEach(task => {
    // Heavy processing
    processTask(task);
  });
}

// After:
async function processAllTasks(tasks: Task[]) {
  await taskScheduler.breakUpTask(
    tasks,
    async (task) => {
      await processTask(task);
    },
    {
      chunkSize: 10,
      onProgress: (progress) => {
        console.log(`Processing: ${progress}%`);
      }
    }
  );
}
```

### 2. Use Idle Task Scheduling

```typescript
import { taskScheduler } from '@/services/performance';

// Schedule non-critical work on idle
function scheduleAnalytics() {
  taskScheduler.scheduleIdleTask(
    async () => {
      await sendAnalyticsData();
    },
    { priority: 'low', timeout: 5000 }
  );
}
```

### 3. Use Automatic Yielding

```typescript
import { taskScheduler } from '@/services/performance';

async function processLargeDataset(items: Item[]) {
  await taskScheduler.runWithYield(
    items,
    async (item) => {
      await processItem(item);
    },
    50 // Yield every 50ms
  );
}
```

## Component Updates

### Required Changes to Existing Components

1. **Dashboard.tsx**: Add skeleton screens for loading states
2. **ChastityTracking.tsx**: Use progressive loading for charts
3. **TasksPage.tsx**: Implement pagination and caching
4. **UserAvatar components**: Replace with ProgressiveImage
5. **Navigation components**: Add hover prefetching

### Example: Update Dashboard

```typescript
// src/pages/Dashboard.tsx
import { SkeletonDashboard } from '@/components/loading/SkeletonScreen';
import { useProgressiveLoading, LoadingPriority } from '@/hooks/performance/useProgressiveLoading';

function Dashboard() {
  const { isLoaded: chartsLoaded } = useProgressiveLoading(
    'dashboard-charts',
    async () => {
      await import('chart.js');
    },
    { priority: LoadingPriority.MEDIUM }
  );

  if (!chartsLoaded) {
    return <SkeletonDashboard showCharts showStats />;
  }

  return (
    // Your dashboard content
  );
}
```

## Testing

After implementing these optimizations, test:

1. **Loading Performance**: Use Chrome DevTools Performance tab
2. **Cache Hit Rate**: Check browser console for cache logs
3. **Network Requests**: Verify request batching in Network tab
4. **Long Tasks**: Look for tasks >50ms in Performance tab
5. **Bundle Size**: Compare before/after bundle sizes

## Performance Metrics to Monitor

- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cache hit/miss ratios
- Average query execution time
- Number of long tasks (>50ms)

## Next Steps

1. Gradually implement optimizations in existing components
2. Monitor performance metrics in production
3. Adjust caching TTLs based on real usage patterns
4. Profile and optimize specific slow queries
5. Consider implementing Web Workers for heavy computations
