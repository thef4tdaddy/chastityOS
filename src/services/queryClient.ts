import { QueryClient } from '@tanstack/react-query';

// As defined in the architecture documentation
export const cacheConfig = {
  currentSession: {
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  },
  sessionHistory: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  },
  userSettings: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: cacheConfig.sessionHistory.staleTime, // Default to warm data settings
      gcTime: cacheConfig.sessionHistory.gcTime,
      refetchOnWindowFocus: false,
    },
  },
});
