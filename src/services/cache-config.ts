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
  sessionHistory: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  },

  tasks: {
    staleTime: 1000 * 60 * 3, // 3 minutes - tasks don't change that frequently
    gcTime: 1000 * 60 * 30, // 30 minutes - keep longer for better UX
    refetchOnWindowFocus: true, // Refetch when user returns to ensure fresh data
  },

  events: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  },

  // Cold data - can be cached longer
  userSettings: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  },
};

// Default query configuration
export const defaultQueryConfig: CacheConfig = {
  staleTime: cacheConfig.sessionHistory.staleTime,
  gcTime: cacheConfig.sessionHistory.gcTime,
  refetchOnWindowFocus: false,
};
