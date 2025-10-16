# Performance Monitoring Utilities

This directory contains utilities for monitoring and tracking application performance metrics.

## Web Vitals Tracking

### Overview

The `webVitals.ts` module provides comprehensive tracking of Core Web Vitals metrics and integrates with Google Analytics for performance monitoring.

### Core Web Vitals Tracked

1. **FCP (First Contentful Paint)** - Target: < 1.5s
   - Time until the first text or image is painted
2. **LCP (Largest Contentful Paint)** - Target: < 2.5s
   - Time until the largest content element is visible
3. **INP (Interaction to Next Paint)** - Target: < 200ms
   - Measures responsiveness to user interactions (replaces FID)
4. **CLS (Cumulative Layout Shift)** - Target: < 0.1
   - Measures visual stability during page load
5. **TTFB (Time to First Byte)** - Target: < 600ms
   - Time until the browser receives the first byte of response

### Usage

#### Initialize Web Vitals Tracking

The web vitals tracking is automatically initialized in `src/main.tsx`:

```typescript
import { initWebVitals } from "./utils/performance/webVitals";

// Initialize when app loads
initWebVitals();
```

#### Get Current Performance Metrics

```typescript
import { getCurrentMetrics } from "./utils/performance/webVitals";

const metrics = await getCurrentMetrics();
console.log("Current metrics:", metrics);
// Output: { ttfb: 120, fcp: 850, domContentLoaded: 100, ... }
```

#### Report Custom Performance Marks

```typescript
import { reportPerformanceMark } from "./utils/performance/webVitals";

// Mark when a critical feature loads
reportPerformanceMark("critical-feature-loaded", "navigationStart");
```

### Integration with Analytics

All metrics are automatically sent to Google Analytics (if configured) with the following structure:

```javascript
gtag("event", metricName, {
  event_category: "Web Vitals",
  event_label: metricId,
  value: metricValue,
  metric_rating: "good" | "needs-improvement" | "poor",
  non_interaction: true,
});
```

### Metric Ratings

Metrics are automatically rated based on industry-standard thresholds:

- **Good** 🟢: Metric is within optimal range
- **Needs Improvement** 🟡: Metric is acceptable but could be better
- **Poor** 🔴: Metric needs attention

### Development Mode

In development mode (DEV=true), metrics are logged to the console:

```
[Web Vitals] Performance monitoring initialized
[Web Vitals] { metric: 'FCP', value: 1200, rating: 'good', navigationType: 'navigate' }
```

### Testing

Tests are located in `__tests__/webVitals.test.ts` and cover:

- Initialization
- Metric collection
- Analytics integration
- Error handling
- Performance marks

Run tests with:

```bash
npm test -- src/utils/performance/__tests__/webVitals.test.ts
```

## Performance Budget

The application has defined performance budgets in `performance-budget.json`:

- Main bundle (gzipped): < 100KB
- Total initial load (gzipped): < 250KB
- Individual chunks (gzipped): < 50KB

These budgets are enforced in CI/CD via GitHub Actions workflows.

## Related Workflows

- `.github/workflows/lighthouse-ci.yml` - Lighthouse performance audits on PRs
- `.github/workflows/bundle-size.yml` - Bundle size monitoring
- `.github/workflows/performance.yml` - Comprehensive performance testing

## Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Core Web Vitals](https://web.dev/articles/vitals)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
