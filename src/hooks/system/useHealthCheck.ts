/**
 * useHealthCheck Hook - System Health Monitoring
 *
 * Monitor overall system health, service availability, and provide early warning
 * for potential issues.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { logger } from "../../utils/logging";

// Health status enum
export enum HealthStatus {
  HEALTHY = "healthy",
  WARNING = "warning",
  CRITICAL = "critical",
  UNKNOWN = "unknown",
}

// Service status
export interface ServiceStatus {
  name: string;
  status: HealthStatus;
  responseTime: number;
  lastChecked: Date;
  error?: string;
  uptime: number;
}

// System metrics
export interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  storageUsage: number;
  networkLatency: number;
  errorRate: number;
  activeConnections: number;
}

// Health check result
export interface HealthCheckResult {
  overall: HealthStatus;
  services: ServiceStatus[];
  metrics: SystemMetrics;
  alerts: HealthAlert[];
  lastUpdated: Date;
  checkDuration: number;
}

// Health alert
export interface HealthAlert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  service?: string;
  timestamp: Date;
  acknowledged: boolean;
}

// Health check configuration
interface HealthCheckConfig {
  checkInterval: number;
  timeout: number;
  retryAttempts: number;
  services: string[];
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  checkInterval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retryAttempts: 3,
  services: ["firebase", "storage", "network"],
};

/**
 * System Health Check Hook
 */
export const useHealthCheck = (config: Partial<HealthCheckConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Check service health
  const checkServiceHealth = useCallback(
    async (serviceName: string): Promise<ServiceStatus> => {
      const startTime = Date.now();
      let status: HealthStatus = HealthStatus.UNKNOWN;
      let error: string | undefined;
      let responseTime = 0;

      try {
        switch (serviceName) {
          case "firebase":
            // Check Firebase connectivity
            status = await checkFirebaseHealth();
            break;
          case "storage":
            status = await checkStorageHealth();
            break;
          case "network":
            status = await checkNetworkHealth();
            break;
          default:
            status = HealthStatus.UNKNOWN;
        }

        responseTime = Date.now() - startTime;
      } catch (err) {
        status = HealthStatus.CRITICAL;
        error = err instanceof Error ? err.message : "Unknown error";
        responseTime = Date.now() - startTime;
        logger.error(`Health check failed for ${serviceName}`, { error: err });
      }

      return {
        name: serviceName,
        status,
        responseTime,
        lastChecked: new Date(),
        error,
        uptime: calculateUptime(serviceName),
      };
    },
    [],
  );

  // Check Firebase health
  const checkFirebaseHealth = async (): Promise<HealthStatus> => {
    try {
      // Simple connectivity test - try to access Firebase
      if (
        typeof window !== "undefined" &&
        (window as Window & { firebase?: unknown }).firebase
      ) {
        return HealthStatus.HEALTHY;
      }
      return HealthStatus.WARNING;
    } catch (error) {
      return HealthStatus.CRITICAL;
    }
  };

  // Check storage health
  const checkStorageHealth = async (): Promise<HealthStatus> => {
    try {
      // Test localStorage availability
      const testKey = "health-check-test";
      const testValue = "test";

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        return HealthStatus.HEALTHY;
      }
      return HealthStatus.WARNING;
    } catch (_error) {
      return HealthStatus.CRITICAL;
    }
  };

  // Check network health
  const checkNetworkHealth = async (): Promise<HealthStatus> => {
    if (!navigator.onLine) {
      return HealthStatus.CRITICAL;
    }

    try {
      const startTime = Date.now();
      const response = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-cache",
      });
      const responseTime = Date.now() - startTime;

      if (response.ok && responseTime < 2000) {
        return HealthStatus.HEALTHY;
      } else if (response.ok && responseTime < 5000) {
        return HealthStatus.WARNING;
      }
      return HealthStatus.CRITICAL;
    } catch (_error) {
      return HealthStatus.CRITICAL;
    }
  };

  // Calculate service uptime (simplified)
  const calculateUptime = (_serviceName: string): number => {
    // In a real implementation, this would track actual uptime
    // For now, return a mock value
    return Math.random() * 100;
  };

  // Get system metrics
  const getSystemMetrics = useCallback(async (): Promise<SystemMetrics> => {
    const metrics: SystemMetrics = {
      memoryUsage: 0,
      cpuUsage: 0,
      storageUsage: 0,
      networkLatency: 0,
      errorRate: 0,
      activeConnections: 1,
    };

    try {
      // Memory usage
      if ("memory" in performance) {
        const memory = (
          performance as Performance & {
            memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
          }
        ).memory;
        if (memory) {
          metrics.memoryUsage =
            (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
        }
      }

      // Storage usage
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage && estimate.quota) {
          metrics.storageUsage = (estimate.usage / estimate.quota) * 100;
        }
      }

      // Network latency (simplified)
      const startTime = Date.now();
      await fetch("/favicon.ico", { method: "HEAD", cache: "no-cache" });
      metrics.networkLatency = Date.now() - startTime;
    } catch (error) {
      logger.warn("Failed to get some system metrics", error);
    }

    return metrics;
  }, []);

  // Determine overall health status
  const calculateOverallHealth = useCallback(
    (services: ServiceStatus[]): HealthStatus => {
      const statuses = services.map((s) => s.status);

      if (statuses.includes(HealthStatus.CRITICAL)) {
        return HealthStatus.CRITICAL;
      }

      if (statuses.includes(HealthStatus.WARNING)) {
        return HealthStatus.WARNING;
      }

      if (statuses.every((s) => s === HealthStatus.HEALTHY)) {
        return HealthStatus.HEALTHY;
      }

      return HealthStatus.UNKNOWN;
    },
    [],
  );

  // Generate alerts based on health status
  const generateAlerts = useCallback(
    (services: ServiceStatus[], metrics: SystemMetrics): HealthAlert[] => {
      const newAlerts: HealthAlert[] = [];

      // Service alerts
      services.forEach((service) => {
        if (service.status === HealthStatus.CRITICAL) {
          newAlerts.push({
            id: `service-${service.name}-${Date.now()}`,
            type: "error",
            message: `Service ${service.name} is critical: ${service.error || "Unknown error"}`,
            service: service.name,
            timestamp: new Date(),
            acknowledged: false,
          });
        } else if (service.status === HealthStatus.WARNING) {
          newAlerts.push({
            id: `service-${service.name}-${Date.now()}`,
            type: "warning",
            message: `Service ${service.name} is experiencing issues`,
            service: service.name,
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      });

      // Metrics alerts
      if (metrics.memoryUsage > 90) {
        newAlerts.push({
          id: `memory-${Date.now()}`,
          type: "warning",
          message: `High memory usage: ${metrics.memoryUsage.toFixed(1)}%`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      if (metrics.storageUsage > 90) {
        newAlerts.push({
          id: `storage-${Date.now()}`,
          type: "warning",
          message: `High storage usage: ${metrics.storageUsage.toFixed(1)}%`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      if (metrics.networkLatency > 5000) {
        newAlerts.push({
          id: `network-${Date.now()}`,
          type: "warning",
          message: `High network latency: ${metrics.networkLatency}ms`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      return newAlerts;
    },
    [],
  );

  // Main health check query
  const {
    data: healthStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<HealthCheckResult>({
    queryKey: ["system", "health"],
    queryFn: async () => {
      const startTime = Date.now();

      // Check all services
      const serviceChecks = await Promise.all(
        fullConfig.services.map((service) => checkServiceHealth(service)),
      );

      // Get system metrics
      const metrics = await getSystemMetrics();

      // Calculate overall health
      const overall = calculateOverallHealth(serviceChecks);

      // Generate alerts
      const newAlerts = generateAlerts(serviceChecks, metrics);

      const result: HealthCheckResult = {
        overall,
        services: serviceChecks,
        metrics,
        alerts: newAlerts,
        lastUpdated: new Date(),
        checkDuration: Date.now() - startTime,
      };

      // Update alerts state
      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev.slice(-19), ...newAlerts]); // Keep last 20 alerts
      }

      return result;
    },
    refetchInterval: isMonitoring ? fullConfig.checkInterval : false,
    retry: fullConfig.retryAttempts,
    staleTime: fullConfig.checkInterval / 2,
  });

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
    logger.info("Health alert acknowledged", { alertId });
  }, []);

  // Clear acknowledged alerts
  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts((prev) => prev.filter((alert) => !alert.acknowledged));
    logger.info("Acknowledged alerts cleared");
  }, []);

  // Start/stop monitoring
  const toggleMonitoring = useCallback((enabled: boolean) => {
    setIsMonitoring(enabled);
    logger.info(`Health monitoring ${enabled ? "started" : "stopped"}`);
  }, []);

  // Force health check
  const forceCheck = useCallback(() => {
    refetch();
    logger.info("Manual health check triggered");
  }, [refetch]);

  return {
    // Health status
    healthStatus,
    isLoading,
    error,

    // Alerts
    alerts: alerts.filter((alert) => !alert.acknowledged),
    acknowledgedAlerts: alerts.filter((alert) => alert.acknowledged),
    allAlerts: alerts,

    // Controls
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    toggleMonitoring,
    forceCheck,

    // State
    isMonitoring,

    // Computed properties
    isHealthy: healthStatus?.overall === HealthStatus.HEALTHY,
    hasWarnings: healthStatus?.overall === HealthStatus.WARNING,
    isCritical: healthStatus?.overall === HealthStatus.CRITICAL,
    hasUnacknowledgedAlerts: alerts.some((alert) => !alert.acknowledged),
    uptime:
      healthStatus?.services.reduce((acc, service) => acc + service.uptime, 0) /
      (healthStatus?.services.length || 1),
    averageResponseTime:
      healthStatus?.services.reduce(
        (acc, service) => acc + service.responseTime,
        0,
      ) / (healthStatus?.services.length || 1),
  };
};
