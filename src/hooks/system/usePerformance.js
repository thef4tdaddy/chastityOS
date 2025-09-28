import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/react';

/**
 * Performance monitoring hook that tracks application performance metrics and provides optimization recommendations
 * @returns {object} Performance metrics and monitoring functions
 */
export const usePerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    // Core Web Vitals
    cumulativeLayoutShift: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    
    // Custom metrics
    pageLoadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    jsHeapSize: 0,
    
    // Component metrics
    componentRenderCount: {},
    slowComponents: [],
    
    // Network metrics
    resourceLoadTimes: [],
    totalResourceSize: 0
  });

  const [performanceWarnings, setPerformanceWarnings] = useState([]);
  const [optimizationRecommendations, setOptimizationRecommendations] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const performanceObserverRef = useRef(null);
  const componentTimingsRef = useRef({});
  const renderCountRef = useRef({});

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    try {
      // Monitor Core Web Vitals using Performance Observer API
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            switch (entry.entryType) {
              case 'largest-contentful-paint':
                setPerformanceMetrics(prev => ({
                  ...prev,
                  largestContentfulPaint: entry.startTime
                }));
                break;
                
              case 'first-input':
                setPerformanceMetrics(prev => ({
                  ...prev,
                  firstInputDelay: entry.processingStart - entry.startTime
                }));
                break;
                
              case 'layout-shift':
                if (!entry.hadRecentInput) {
                  setPerformanceMetrics(prev => ({
                    ...prev,
                    cumulativeLayoutShift: prev.cumulativeLayoutShift + entry.value
                  }));
                }
                break;
                
              case 'paint':
                if (entry.name === 'first-contentful-paint') {
                  setPerformanceMetrics(prev => ({
                    ...prev,
                    firstContentfulPaint: entry.startTime
                  }));
                }
                break;
                
              case 'resource':
                setPerformanceMetrics(prev => ({
                  ...prev,
                  resourceLoadTimes: [...prev.resourceLoadTimes, {
                    name: entry.name,
                    duration: entry.duration,
                    size: entry.transferSize || 0,
                    type: entry.initiatorType
                  }].slice(-50), // Keep only last 50 entries
                  totalResourceSize: prev.totalResourceSize + (entry.transferSize || 0)
                }));
                break;
            }
          }
        });

        try {
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'resource'] });
          performanceObserverRef.current = observer;
        } catch (error) {
          console.warn('Some performance metrics not supported:', error);
          // Try with supported entry types only
          observer.observe({ entryTypes: ['paint', 'resource'] });
          performanceObserverRef.current = observer;
        }
      }

      // Monitor memory usage if available
      if ('memory' in performance) {
        const monitorMemory = () => {
          const memInfo = performance.memory;
          setPerformanceMetrics(prev => ({
            ...prev,
            memoryUsage: memInfo.usedJSHeapSize,
            jsHeapSize: memInfo.totalJSHeapSize
          }));
        };

        monitorMemory();
        const memoryInterval = setInterval(monitorMemory, 5000);
        
        return () => clearInterval(memoryInterval);
      }
    } catch (error) {
      console.error('Error starting performance monitoring:', error);
      Sentry.captureException(error);
    }
  }, [isMonitoring]);

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect();
      performanceObserverRef.current = null;
    }
  }, []);

  // Track component render performance
  const trackComponentRender = useCallback((componentName, renderStart, renderEnd) => {
    const renderTime = renderEnd - renderStart;
    
    // Update render count
    renderCountRef.current[componentName] = (renderCountRef.current[componentName] || 0) + 1;
    
    // Track render time
    if (!componentTimingsRef.current[componentName]) {
      componentTimingsRef.current[componentName] = [];
    }
    
    componentTimingsRef.current[componentName].push(renderTime);
    
    // Keep only last 10 render times
    if (componentTimingsRef.current[componentName].length > 10) {
      componentTimingsRef.current[componentName] = componentTimingsRef.current[componentName].slice(-10);
    }
    
    // Update state
    setPerformanceMetrics(prev => ({
      ...prev,
      componentRenderCount: { ...renderCountRef.current },
      renderTime: renderTime
    }));
    
    // Check for slow components (>16ms for 60fps)
    if (renderTime > 16) {
      const avgRenderTime = componentTimingsRef.current[componentName].reduce((a, b) => a + b, 0) / 
                           componentTimingsRef.current[componentName].length;
      
      if (avgRenderTime > 16) {
        setPerformanceMetrics(prev => ({
          ...prev,
          slowComponents: [
            ...prev.slowComponents.filter(comp => comp.name !== componentName),
            {
              name: componentName,
              averageRenderTime: avgRenderTime,
              renderCount: renderCountRef.current[componentName]
            }
          ]
        }));
      }
    }
  }, []);

  // Measure function execution time
  const measureFunction = useCallback((func, name) => {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await func(...args);
        const end = performance.now();
        const duration = end - start;
        
        // Log slow functions (>100ms)
        if (duration > 100) {
          setPerformanceWarnings(prev => [...prev, {
            id: Date.now(),
            type: 'slow-function',
            message: `Function ${name} took ${duration.toFixed(2)}ms to execute`,
            severity: duration > 1000 ? 'high' : 'medium',
            timestamp: new Date()
          }].slice(-20)); // Keep only last 20 warnings
        }
        
        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`Function ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
        throw error;
      }
    };
  }, []);

  // Analyze performance and generate recommendations
  const analyzePerformance = useCallback(() => {
    const recommendations = [];
    const warnings = [];

    // Check Core Web Vitals
    if (performanceMetrics.largestContentfulPaint > 2500) {
      recommendations.push({
        type: 'lcp',
        priority: 'high',
        message: 'Largest Contentful Paint is slow. Consider optimizing images and reducing server response time.',
        value: performanceMetrics.largestContentfulPaint
      });
    }

    if (performanceMetrics.cumulativeLayoutShift > 0.1) {
      recommendations.push({
        type: 'cls',
        priority: 'medium',
        message: 'Cumulative Layout Shift is high. Ensure images and ads have size attributes.',
        value: performanceMetrics.cumulativeLayoutShift
      });
    }

    if (performanceMetrics.firstInputDelay > 100) {
      recommendations.push({
        type: 'fid',
        priority: 'high', 
        message: 'First Input Delay is high. Consider reducing JavaScript execution time.',
        value: performanceMetrics.firstInputDelay
      });
    }

    // Check memory usage
    if (performanceMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      warnings.push({
        id: Date.now(),
        type: 'memory',
        message: `High memory usage: ${(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        severity: 'medium',
        timestamp: new Date()
      });
    }

    // Check for too many resource requests
    if (performanceMetrics.resourceLoadTimes.length > 30) {
      recommendations.push({
        type: 'resources',
        priority: 'medium',
        message: 'High number of resource requests. Consider bundling or lazy loading.',
        value: performanceMetrics.resourceLoadTimes.length
      });
    }

    // Check slow components
    if (performanceMetrics.slowComponents.length > 0) {
      recommendations.push({
        type: 'components',
        priority: 'high',
        message: `${performanceMetrics.slowComponents.length} components are rendering slowly. Consider optimization.`,
        components: performanceMetrics.slowComponents
      });
    }

    setOptimizationRecommendations(recommendations);
    setPerformanceWarnings(prev => [...prev, ...warnings].slice(-20));
  }, [performanceMetrics]);

  // Get performance score (0-100)
  const getPerformanceScore = useCallback(() => {
    let score = 100;
    
    // Deduct points for poor Core Web Vitals
    if (performanceMetrics.largestContentfulPaint > 2500) score -= 20;
    if (performanceMetrics.firstInputDelay > 100) score -= 20;
    if (performanceMetrics.cumulativeLayoutShift > 0.1) score -= 15;
    if (performanceMetrics.firstContentfulPaint > 1800) score -= 10;
    
    // Deduct points for slow components
    score -= performanceMetrics.slowComponents.length * 5;
    
    // Deduct points for high memory usage
    if (performanceMetrics.memoryUsage > 50 * 1024 * 1024) score -= 10;
    
    return Math.max(0, score);
  }, [performanceMetrics]);

  // Clear performance warnings
  const clearWarnings = useCallback(() => {
    setPerformanceWarnings([]);
  }, []);

  // Get formatted performance report
  const getPerformanceReport = useCallback(() => {
    return {
      score: getPerformanceScore(),
      coreWebVitals: {
        lcp: performanceMetrics.largestContentfulPaint,
        fid: performanceMetrics.firstInputDelay,
        cls: performanceMetrics.cumulativeLayoutShift,
        fcp: performanceMetrics.firstContentfulPaint
      },
      resources: {
        totalRequests: performanceMetrics.resourceLoadTimes.length,
        totalSize: performanceMetrics.totalResourceSize,
        averageLoadTime: performanceMetrics.resourceLoadTimes.length > 0 ?
          performanceMetrics.resourceLoadTimes.reduce((sum, res) => sum + res.duration, 0) / 
          performanceMetrics.resourceLoadTimes.length : 0
      },
      components: {
        totalComponents: Object.keys(performanceMetrics.componentRenderCount).length,
        slowComponents: performanceMetrics.slowComponents.length,
        totalRenders: Object.values(performanceMetrics.componentRenderCount).reduce((sum, count) => sum + count, 0)
      },
      memory: {
        used: performanceMetrics.memoryUsage,
        total: performanceMetrics.jsHeapSize,
        usedMB: (performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2),
        totalMB: (performanceMetrics.jsHeapSize / 1024 / 1024).toFixed(2)
      }
    };
  }, [performanceMetrics, getPerformanceScore]);

  // Start monitoring on component mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  // Analyze performance when metrics change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      analyzePerformance();
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [performanceMetrics, analyzePerformance]);

  return {
    // Metrics
    performanceMetrics,
    performanceWarnings,
    optimizationRecommendations,
    isMonitoring,
    
    // Controls
    startMonitoring,
    stopMonitoring,
    clearWarnings,
    
    // Tracking
    trackComponentRender,
    measureFunction,
    
    // Analysis
    analyzePerformance,
    getPerformanceScore,
    getPerformanceReport,
    
    // Computed values
    performanceScore: getPerformanceScore(),
    hasWarnings: performanceWarnings.length > 0,
    hasRecommendations: optimizationRecommendations.length > 0,
    memoryUsageMB: (performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)
  };
};