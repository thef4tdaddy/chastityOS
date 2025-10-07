/**
 * useHealthCheck Hook - System Health Monitoring
 *
 * Monitor overall system health, service availability, and provide early warning
 * for potential issues.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import {
  checkFirebaseHealth,
  checkStorageHealth,
  checkNetworkHealth,
  calculateUptime,
  getSystemMetrics,
  calculateOverallHealth,
  generateAlerts,
} from "../../utils/system/healthCheckHelpers";

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
      (healthStatus?.services.reduce(
        (acc, service) => acc + service.uptime,
        0,
      ) || 0) / (healthStatus?.services.length || 1),
    averageResponseTime:
      (healthStatus?.services.reduce(
        (acc, service) => acc + service.responseTime,
        0,
      ) || 0) / (healthStatus?.services.length || 1),
  };
};
