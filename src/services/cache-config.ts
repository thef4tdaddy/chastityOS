/**
 * Cache configuration for TanStack Query
 * Services layer - pure configuration, no React dependencies
 */

export interface CacheConfig {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
}

export interface QueryCacheConfig {
  currentSession: CacheConfig;
  sessionHistory: CacheConfig;
  userSettings: CacheConfig;
  tasks: CacheConfig;
  events: CacheConfig;
  relationships: CacheConfig;
  permissions: CacheConfig;
}

// Cache configuration based on data freshness requirements
export const cacheConfig: QueryCacheConfig = {
  // Hot data - needs frequent updates
  currentSession: {
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  },

  // Warm data - moderately fresh
  // Optimized for report performance: longer stale time for historical data
  sessionHistory: {
    staleTime: 1000 * 60 * 10, // 10 minutes (increased from 5)
    gcTime: 1000 * 60 * 60, // 60 minutes (increased from 30)
    refetchOnWindowFocus: false,
  },

  tasks: {
    staleTime: 1000 * 60 * 5, // 5 minutes (increased from 3)
    gcTime: 1000 * 60 * 45, // 45 minutes (increased from 30)
    refetchOnWindowFocus: false, // Changed to false to reduce unnecessary refetches
  },

  events: {
    staleTime: 1000 * 60 * 10, // 10 minutes (increased from 5)
    gcTime: 1000 * 60 * 60, // 60 minutes (increased from 30)
    refetchOnWindowFocus: false,
  },

  // Cold data - can be cached longer
  userSettings: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  },

  // Relationship data - moderately fresh
  relationships: {
    staleTime: 1000 * 60 * 2, // 2 minutes - relationships can change
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: true, // Refetch to ensure fresh data
  },

  // Permission checks - can be cached longer
  permissions: {
    staleTime: 1000 * 60 * 5, // 5 minutes - permissions rarely change
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false, // No need to refetch permissions frequently
  },
};

// Default query configuration
export const defaultQueryConfig: CacheConfig = {
  staleTime: cacheConfig.sessionHistory.staleTime,
  gcTime: cacheConfig.sessionHistory.gcTime,
  refetchOnWindowFocus: false,
};
