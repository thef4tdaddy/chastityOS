import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/react';

/**
 * System health monitoring hook that provides early warning for potential issues
 * @returns {object} Health status and monitoring functions
 */
export const useHealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState({
    overall: 'unknown', // 'healthy', 'warning', 'critical', 'unknown'
    services: {
      firebase: { status: 'unknown', lastCheck: null, responseTime: 0 },
      storage: { status: 'unknown', lastCheck: null, available: 0, used: 0 },
      network: { status: 'unknown', lastCheck: null, quality: 'unknown' },
      javascript: { status: 'unknown', lastCheck: null, errors: 0 },
      memory: { status: 'unknown', lastCheck: null, usage: 0, limit: 0 }
    },
    uptime: 0,
    lastHealthCheck: null
  });

  const [healthHistory, setHealthHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const startTimeRef = useRef(Date.now());
  const healthCheckIntervalRef = useRef(null);
  const errorCountRef = useRef(0);

  // Add health alert
  const addAlert = useCallback((alert) => {
    const newAlert = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      acknowledged: false,
      ...alert
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep only 20 most recent alerts
    
    // Send to Sentry for critical alerts
    if (alert.severity === 'critical') {
      Sentry.addBreadcrumb({
        message: `Health Check Alert: ${alert.message}`,
        level: 'error',
        category: 'health-check'
      });
    }
  }, []);

  // Check Firebase connectivity
  const checkFirebaseHealth = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      // Simple connectivity test - try to access Firestore
      const testPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Firebase timeout')), 5000);
        
        // We'll assume Firebase is healthy if we can import it without errors
        // In a real implementation, you might want to test actual Firestore connectivity
        import('../../firebase').then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(reject);
      });
      
      await testPromise;
      const responseTime = performance.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'warning',
        lastCheck: new Date(),
        responseTime,
        error: null
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date(),
        responseTime: performance.now() - startTime,
        error: error.message
      };
    }
  }, []);

  // Check storage availability
  const checkStorageHealth = useCallback(async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        const usagePercent = available > 0 ? (used / available) * 100 : 0;
        
        let status = 'healthy';
        if (usagePercent > 90) {
          status = 'critical';
        } else if (usagePercent > 70) {
          status = 'warning';
        }
        
        return {
          status,
          lastCheck: new Date(),
          available,
          used,
          usagePercent,
          error: null
        };
      } else {
        return {
          status: 'unknown',
          lastCheck: new Date(),
          available: 0,
          used: 0,
          usagePercent: 0,
          error: 'Storage API not supported'
        };
      }
    } catch (error) {
      return {
        status: 'warning',
        lastCheck: new Date(),
        available: 0,
        used: 0,
        usagePercent: 0,
        error: error.message
      };
    }
  }, []);

  // Check network health
  const checkNetworkHealth = useCallback(async () => {
    try {
      const online = navigator.onLine;
      
      if (!online) {
        return {
          status: 'critical',
          lastCheck: new Date(),
          quality: 'offline',
          error: 'Device is offline'
        };
      }

      // Simple network test
      const startTime = performance.now();
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      const responseTime = performance.now() - startTime;
      
      let quality = 'excellent';
      let status = 'healthy';
      
      if (responseTime > 2000) {
        quality = 'poor';
        status = 'warning';
      } else if (responseTime > 1000) {
        quality = 'fair';
      } else if (responseTime > 500) {
        quality = 'good';
      }
      
      if (!response.ok) {
        status = 'warning';
      }
      
      return {
        status,
        lastCheck: new Date(),
        quality,
        responseTime,
        error: null
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date(),
        quality: 'poor',
        responseTime: 0,
        error: error.message
      };
    }
  }, []);

  // Check JavaScript/Runtime health
  const checkJavaScriptHealth = useCallback(() => {
    try {
      const errorCount = errorCountRef.current;
      let status = 'healthy';
      
      if (errorCount > 10) {
        status = 'critical';
      } else if (errorCount > 5) {
        status = 'warning';
      }
      
      return {
        status,
        lastCheck: new Date(),
        errors: errorCount,
        error: null
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date(),
        errors: errorCountRef.current,
        error: error.message
      };
    }
  }, []);

  // Check memory health
  const checkMemoryHealth = useCallback(() => {
    try {
      if ('memory' in performance) {
        const memInfo = performance.memory;
        const used = memInfo.usedJSHeapSize;
        const limit = memInfo.jsHeapSizeLimit;
        const usagePercent = (used / limit) * 100;
        
        let status = 'healthy';
        if (usagePercent > 90) {
          status = 'critical';
        } else if (usagePercent > 70) {
          status = 'warning';
        }
        
        return {
          status,
          lastCheck: new Date(),
          usage: used,
          limit,
          usagePercent,
          error: null
        };
      } else {
        return {
          status: 'unknown',
          lastCheck: new Date(),
          usage: 0,
          limit: 0,
          usagePercent: 0,
          error: 'Memory API not supported'
        };
      }
    } catch (error) {
      return {
        status: 'warning',
        lastCheck: new Date(),
        usage: 0,
        limit: 0,
        usagePercent: 0,
        error: error.message
      };
    }
  }, []);

  // Perform comprehensive health check
  const performHealthCheck = useCallback(async () => {
    const checkStart = Date.now();
    
    try {
      const [firebase, storage, network, javascript, memory] = await Promise.all([
        checkFirebaseHealth(),
        checkStorageHealth(),
        checkNetworkHealth(),
        checkJavaScriptHealth(),
        checkMemoryHealth()
      ]);

      const services = { firebase, storage, network, javascript, memory };
      
      // Determine overall health status
      const statuses = Object.values(services).map(service => service.status);
      let overall = 'healthy';
      
      if (statuses.includes('critical')) {
        overall = 'critical';
      } else if (statuses.includes('warning')) {
        overall = 'warning';
      } else if (statuses.includes('unknown')) {
        overall = 'unknown';
      }

      const uptime = Date.now() - startTimeRef.current;
      const newHealthStatus = {
        overall,
        services,
        uptime,
        lastHealthCheck: new Date()
      };

      setHealthStatus(newHealthStatus);
      
      // Add to history
      setHealthHistory(prev => [{
        timestamp: new Date(),
        overall,
        checkDuration: Date.now() - checkStart,
        services: Object.fromEntries(
          Object.entries(services).map(([key, service]) => [key, service.status])
        )
      }, ...prev.slice(0, 99)]); // Keep last 100 checks

      // Generate alerts for critical issues
      Object.entries(services).forEach(([serviceName, service]) => {
        if (service.status === 'critical' && service.error) {
          addAlert({
            service: serviceName,
            severity: 'critical',
            message: `${serviceName} service is critical: ${service.error}`,
            type: 'service-critical'
          });
        }
      });

      return newHealthStatus;
    } catch (error) {
      console.error('Health check failed:', error);
      Sentry.captureException(error);
      
      const failedStatus = {
        overall: 'critical',
        services: healthStatus.services,
        uptime: Date.now() - startTimeRef.current,
        lastHealthCheck: new Date()
      };
      
      setHealthStatus(failedStatus);
      
      addAlert({
        service: 'health-check',
        severity: 'critical',
        message: `Health check system failed: ${error.message}`,
        type: 'system-error'
      });
      
      return failedStatus;
    }
  }, [checkFirebaseHealth, checkStorageHealth, checkNetworkHealth, checkJavaScriptHealth, checkMemoryHealth, addAlert, healthStatus.services]);

  // Start health monitoring
  const startMonitoring = useCallback((interval = 30000) => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Perform initial health check
    performHealthCheck();
    
    // Set up periodic health checks
    healthCheckIntervalRef.current = setInterval(() => {
      performHealthCheck();
    }, interval);
  }, [isMonitoring, performHealthCheck]);

  // Stop health monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Clear all acknowledged alerts
  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  }, []);

  // Get health summary
  const getHealthSummary = useCallback(() => {
    const totalServices = Object.keys(healthStatus.services).length;
    const healthyServices = Object.values(healthStatus.services).filter(s => s.status === 'healthy').length;
    const warningServices = Object.values(healthStatus.services).filter(s => s.status === 'warning').length;
    const criticalServices = Object.values(healthStatus.services).filter(s => s.status === 'critical').length;
    const unknownServices = Object.values(healthStatus.services).filter(s => s.status === 'unknown').length;
    
    return {
      overall: healthStatus.overall,
      totalServices,
      healthyServices,
      warningServices,
      criticalServices,
      unknownServices,
      uptime: healthStatus.uptime,
      lastCheck: healthStatus.lastHealthCheck,
      activeAlerts: alerts.filter(alert => !alert.acknowledged).length,
      totalAlerts: alerts.length
    };
  }, [healthStatus, alerts]);

  // Set up error tracking
  useEffect(() => {
    const handleError = (event) => {
      errorCountRef.current += 1;
    };

    const handleUnhandledRejection = (event) => {
      errorCountRef.current += 1;
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return {
    // Status
    healthStatus,
    healthHistory,
    alerts,
    isMonitoring,
    
    // Controls
    startMonitoring,
    stopMonitoring,
    performHealthCheck,
    
    // Alert management
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    
    // Analysis
    getHealthSummary,
    
    // Computed values
    overallHealth: healthStatus.overall,
    isHealthy: healthStatus.overall === 'healthy',
    hasActiveAlerts: alerts.filter(alert => !alert.acknowledged).length > 0,
    uptimeFormatted: new Date(healthStatus.uptime).toISOString().substr(11, 8),
    healthScore: (() => {
      const summary = getHealthSummary();
      if (summary.totalServices === 0) return 0;
      return Math.round((summary.healthyServices / summary.totalServices) * 100);
    })()
  };
};