/**
 * Query client setup for TanStack Query
 * Hooks layer - handles React Query integration
 */
import { QueryClient } from "@tanstack/react-query";
import { defaultQueryConfig } from "@/services/cache-config";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: defaultQueryConfig.staleTime,
      gcTime: defaultQueryConfig.gcTime,
      refetchOnWindowFocus: defaultQueryConfig.refetchOnWindowFocus,
    },
  },
});
