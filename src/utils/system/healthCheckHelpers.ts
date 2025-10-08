/**
 * Helper functions for useHealthCheck hook
 * Extracted to reduce function complexity
 */
import { logger } from "../../utils/logging";
import { HealthCheckStorageService } from "../../services/healthCheckStorage";
import type {
  HealthStatus,
  ServiceStatus,
  SystemMetrics,
  HealthAlert,
} from "../../hooks/system/useHealthCheck";

// Re-export HealthStatus enum for convenience
export { HealthStatus } from "../../hooks/system/useHealthCheck";

/**
 * Check Firebase service health
 */
export async function checkFirebaseHealth(): Promise<HealthStatus> {
  try {
    // Simple connectivity test - try to access Firebase
    if (
      typeof window !== "undefined" &&
      (window as Window & { firebase?: unknown }).firebase
    ) {
      return "healthy" as HealthStatus;
    }
    return "warning" as HealthStatus;
  } catch {
    return "critical" as HealthStatus;
  }
}

/**
 * Check storage service health
 */
export async function checkStorageHealth(): Promise<HealthStatus> {
  try {
    // Test localStorage availability using the service
    const isHealthy = HealthCheckStorageService.testLocalStorage();
    return isHealthy
      ? ("healthy" as HealthStatus)
      : ("warning" as HealthStatus);
  } catch {
    return "critical" as HealthStatus;
  }
}

/**
 * Check network health
 */
export async function checkNetworkHealth(): Promise<HealthStatus> {
  if (!navigator.onLine) {
    return "critical" as HealthStatus;
  }

  try {
    const startTime = Date.now();
    const response = await fetch("/favicon.ico", {
      method: "HEAD",
      cache: "no-cache",
    });
    const responseTime = Date.now() - startTime;

    if (response.ok && responseTime < 2000) {
      return "healthy" as HealthStatus;
    } else if (response.ok && responseTime < 5000) {
      return "warning" as HealthStatus;
    }
    return "critical" as HealthStatus;
  } catch {
    return "critical" as HealthStatus;
  }
}

/**
 * Calculate service uptime (simplified mock implementation)
 */
export function calculateUptime(_serviceName: string): number {
  // In a real implementation, this would track actual uptime
  // For now, return a mock value
  return Math.random() * 100;
}

/**
 * Get system metrics
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
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
}

/**
 * Determine overall health status from service statuses
 */
export function calculateOverallHealth(
  services: ServiceStatus[],
): HealthStatus {
  const statuses = services.map((s) => s.status);

  if (statuses.includes("critical" as HealthStatus)) {
    return "critical" as HealthStatus;
  }

  if (statuses.includes("warning" as HealthStatus)) {
    return "warning" as HealthStatus;
  }

  if (statuses.every((s) => s === ("healthy" as HealthStatus))) {
    return "healthy" as HealthStatus;
  }

  return "unknown" as HealthStatus;
}

/**
 * Generate alerts based on health status
 */
export function generateAlerts(
  services: ServiceStatus[],
  metrics: SystemMetrics,
): HealthAlert[] {
  const newAlerts: HealthAlert[] = [];

  // Service alerts
  services.forEach((service) => {
    if (service.status === ("critical" as HealthStatus)) {
      newAlerts.push({
        id: `service-${service.name}-${Date.now()}`,
        type: "error",
        message: `Service ${service.name} is critical: ${service.error || "Unknown error"}`,
        service: service.name,
        timestamp: new Date(),
        acknowledged: false,
      });
    } else if (service.status === ("warning" as HealthStatus)) {
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
}
