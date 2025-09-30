/**
 * Admin Dashboard Hook
 *
 * Extracts admin session logic and wearer management from AdminDashboard component.
 * Provides aggregated statistics and multi-wearer operations.
 */

import { useState, useCallback, useMemo } from "react";

// Types for admin dashboard
export interface WearerWithSession {
  id: string;
  name: string;
  email?: string;
  isActive: boolean;
  sessionStartTime?: Date;
  sessionDuration: number; // in seconds
  isPaused: boolean;
  taskCount: number;
}

export interface AdminStatistics {
  totalWearers: number;
  activeWearers: number;
  activeSessions: number;
  totalSessionTime: number; // in seconds
  averageSessionLength: number; // in seconds
  tasksCompleted: number;
  tasksPending: number;
}

export interface Activity {
  id: string;
  type: "session_start" | "session_end" | "task_completed" | "task_assigned";
  wearerId: string;
  wearerName: string;
  timestamp: Date;
  description: string;
}

export interface AdminFilter {
  showActive?: boolean;
  showInactive?: boolean;
  searchText?: string;
}

export interface UseAdminDashboardReturn {
  // Data
  wearers: WearerWithSession[];
  statistics: AdminStatistics;
  recentActivity: Activity[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  pauseAllSessions: () => Promise<void>;
  resumeAllSessions: () => Promise<void>;
  endSession: (wearerId: string) => Promise<void>;
  sendBulkNotification: (message: string, wearerIds: string[]) => Promise<void>;

  // Metrics
  activeSessions: number;
  totalWearers: number;
  averageSessionLength: number;

  // Filtering
  filterBy: (filter: AdminFilter) => void;
  currentFilter: AdminFilter;

  // Real-time
  refreshData: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Admin Dashboard Hook
 *
 * @returns Admin dashboard interface with wearer management and statistics
 */
export function useAdminDashboard(): UseAdminDashboardReturn {
  // State
  const [wearers, setWearers] = useState<WearerWithSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilter, setCurrentFilter] = useState<AdminFilter>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Calculate statistics
  const statistics = useMemo((): AdminStatistics => {
    const activeWearers = wearers.filter((w) => w.isActive).length;
    const activeSessions = wearers.filter(
      (w) => w.isActive && w.sessionStartTime,
    ).length;
    const totalSessionTime = wearers.reduce(
      (sum, w) => sum + w.sessionDuration,
      0,
    );
    const averageSessionLength =
      activeSessions > 0 ? totalSessionTime / activeSessions : 0;

    return {
      totalWearers: wearers.length,
      activeWearers,
      activeSessions,
      totalSessionTime,
      averageSessionLength,
      tasksCompleted: wearers.reduce((sum, w) => sum + (w.taskCount || 0), 0),
      tasksPending: 0, // Would be calculated from actual task data
    };
  }, [wearers]);

  // Pause all active sessions
  const pauseAllSessions = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      setWearers((prev) =>
        prev.map((w) =>
          w.isActive && !w.isPaused ? { ...w, isPaused: true } : w,
        ),
      );
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to pause sessions");
      setError(error);
      throw error;
    }
  }, []);

  // Resume all paused sessions
  const resumeAllSessions = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      setWearers((prev) =>
        prev.map((w) => (w.isPaused ? { ...w, isPaused: false } : w)),
      );
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to resume sessions");
      setError(error);
      throw error;
    }
  }, []);

  // End a specific wearer's session
  const endSession = useCallback(
    async (wearerId: string): Promise<void> => {
      setError(null);
      try {
        setWearers((prev) =>
          prev.map((w) =>
            w.id === wearerId
              ? {
                  ...w,
                  isActive: false,
                  sessionStartTime: undefined,
                  isPaused: false,
                }
              : w,
          ),
        );

        // Add activity log
        const wearer = wearers.find((w) => w.id === wearerId);
        if (wearer) {
          setRecentActivity((prev) =>
            [
              {
                id: `activity-${Date.now()}`,
                type: "session_end",
                wearerId,
                wearerName: wearer.name,
                timestamp: new Date(),
                description: `Session ended for ${wearer.name}`,
              },
              ...prev,
            ].slice(0, 50),
          ); // Keep last 50 activities
        }
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to end session");
        setError(error);
        throw error;
      }
    },
    [wearers],
  );

  // Send bulk notification
  const sendBulkNotification = useCallback(
    async (message: string, wearerIds: string[]): Promise<void> => {
      setError(null);
      try {
        // Mock implementation - in production would call notification service
        console.log(
          `Sending notification to ${wearerIds.length} wearers: ${message}`,
        );
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to send notification");
        setError(error);
        throw error;
      }
    },
    [],
  );

  // Apply filter
  const filterBy = useCallback((filter: AdminFilter) => {
    setCurrentFilter(filter);
  }, []);

  // Refresh data
  const refreshData = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      // Mock implementation - in production would fetch from API/Firebase
      setLastUpdate(new Date());
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to refresh data");
      setError(error);
      throw error;
    }
  }, []);

  // Simulate initial load
  useState(() => {
    setTimeout(() => setIsLoading(false), 100);
  });

  return {
    // Data
    wearers,
    statistics,
    recentActivity,
    isLoading,
    error,

    // Actions
    pauseAllSessions,
    resumeAllSessions,
    endSession,
    sendBulkNotification,

    // Metrics
    activeSessions: statistics.activeSessions,
    totalWearers: statistics.totalWearers,
    averageSessionLength: statistics.averageSessionLength,

    // Filtering
    filterBy,
    currentFilter,

    // Real-time
    refreshData,
    lastUpdate,
  };
}
