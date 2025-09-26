/**
 * Offline Queue Hook
 * Provides access to offline queue state and operations
 */
import { useQuery } from "@tanstack/react-query";
import { offlineQueue } from "@/services/sync";

/**
 * Hook to get offline queue statistics
 */
export function useOfflineQueueStats() {
  return useQuery({
    queryKey: ["offlineQueue", "stats"],
    queryFn: () => offlineQueue.getQueueStats(),
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    staleTime: 5 * 1000, // Consider stale after 5 seconds
  });
}

/**
 * Hook to get pending operations in the queue
 */
export function useOfflineQueueOperations() {
  return useQuery({
    queryKey: ["offlineQueue", "operations"],
    queryFn: () => offlineQueue.getQueuedOperations(),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // Consider stale after 10 seconds
  });
}

/**
 * Hook to get retryable operations
 */
export function useRetryableOperations() {
  return useQuery({
    queryKey: ["offlineQueue", "retryable"],
    queryFn: () => offlineQueue.getRetryableOperations(),
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });
}
