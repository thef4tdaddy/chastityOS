# Error Boundary Components

Comprehensive error boundary implementation for graceful error handling throughout the ChastityOS application.

## Overview

This directory contains error boundary components that catch runtime errors, prevent full application crashes, and provide better user experience through graceful error recovery.

## Components

### Error Boundaries

#### RootErrorBoundary

Top-level error boundary that catches all unhandled errors in the application.

- Wraps the entire application in `main.tsx`
- Provides critical error fallback with page reload option
- Logs errors to Sentry (if configured)
- Shows error details in development mode

**Usage:**

```tsx
import { RootErrorBoundary } from "@/components/errors";

<RootErrorBoundary>
  <App />
</RootErrorBoundary>;
```

#### RouteErrorBoundary

Route-level error boundaries that contain errors to specific pages.

- Applied to all major routes in `App.tsx`
- Prevents errors from affecting other routes
- Provides route-specific error context
- Includes retry functionality

**Usage:**

```tsx
import { RouteErrorBoundary } from "@/components/errors";

<RouteErrorBoundary routeName="dashboard">
  <Dashboard />
</RouteErrorBoundary>;
```

#### FeatureErrorBoundary

Granular error boundaries for complex features/components.

- Used for critical features like Tracker, Keyholder Dashboard, Tasks
- Allows rest of page to function when a feature fails
- Provides feature-specific error context
- Supports custom fallback components

**Usage:**

```tsx
import { FeatureErrorBoundary } from "@/components/errors";

<FeatureErrorBoundary
  feature="chastity-tracker"
  fallback={<TrackerErrorFallback />}
>
  <TrackerStats />
</FeatureErrorBoundary>;
```

#### AsyncErrorBoundary

Error boundaries specifically for React.Suspense async operations.

- Designed for lazy-loaded components
- Includes retry logic for async operations
- Provides async-specific error context

**Usage:**

```tsx
import { AsyncErrorBoundary } from "@/components/errors";

<AsyncErrorBoundary fallback={<ErrorFallback />} onReset={refetch}>
  <Suspense fallback={<LoadingSpinner />}>
    <LazyLoadedComponent />
  </Suspense>
</AsyncErrorBoundary>;
```

### Error Fallback Components

#### CriticalErrorFallback

For unrecoverable errors requiring page reload.

- Used by RootErrorBoundary
- Provides clear error message and reload button
- Shows error stack in development mode

#### ErrorFallback

Generic fallback for recoverable errors.

- Provides error message and retry button
- Used as default fallback

#### TrackerErrorFallback

Feature-specific fallback for Tracker page errors.

- Reassures user that data is safe
- Provides context-specific messaging

#### KeyholderErrorFallback

Feature-specific fallback for Keyholder Dashboard errors.

- Keyholder-themed styling
- Context-specific error messaging

### Hooks

#### useErrorHandler

Custom hook for programmatic error handling.

**Usage:**

```tsx
import { useErrorHandler } from "@/components/errors";

const { handleError } = useErrorHandler({
  onError: (error) => console.error(error),
  logToSentry: true,
});

try {
  // risky operation
} catch (error) {
  handleError(error as Error, { context: "additional data" });
}
```

#### useErrorReset

Custom hook for error reset/recovery logic.

**Usage:**

```tsx
import { useErrorReset } from "@/components/errors";

const { resetError, isResetting } = useErrorReset({
  onReset: () => refetch(),
  resetDelay: 1000,
});
```

## Error Logging

All error boundaries integrate with the application's logging system and Sentry (if configured):

- **Console Logging**: All errors logged via `logger.error()`
- **Sentry Integration**: Automatic error reporting with context
- **Error Context**: Includes component stack, route/feature name, timestamp

## Testing

Comprehensive test coverage for error boundaries:

```bash
npm run test:unit -- src/components/errors/__tests__
```

Test files:

- `RootErrorBoundary.test.tsx` - 5 tests
- `RouteErrorBoundary.test.tsx` - 7 tests
- `ErrorFallback.test.tsx` - 6 tests

Total: **18 tests passing** with >80% coverage

## Integration Points

### Application Root (`main.tsx`)

```tsx
import { RootErrorBoundary } from "./components/errors";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
```

### Routes (`App.tsx`)

All 14 routes wrapped with RouteErrorBoundary:

- Dashboard
- Chastity Tracking
- Tasks
- Log Event
- Rewards & Punishments
- Rules
- Full Report
- Settings
- Keyholder
- Keyholder Demo
- Achievements
- Public Profile
- Relationships
- Toast Demo

### Critical Features

FeatureErrorBoundary applied to:

- **Keyholder Dashboard** (`KeyholderPage.tsx`)
- **Keyholder Controls** (`KeyholderPage.tsx`)
- **Chastity Tracker** (`ChastityTracking.tsx`)
- **Task Management** (`TasksPage.tsx`)

## Best Practices

1. **Granular Boundaries**: Use the most specific boundary for the context
2. **Custom Fallbacks**: Provide context-specific fallback components
3. **Error Context**: Always include meaningful context in error logs
4. **User Communication**: Provide clear, reassuring error messages
5. **Recovery Options**: Include retry/reset functionality where appropriate
6. **Testing**: Test error scenarios and recovery flows

## Future Enhancements

- [ ] Add more feature-specific fallback components
- [ ] Implement error analytics dashboard
- [ ] Add user feedback mechanism for errors
- [ ] Create error boundary for form submissions
- [ ] Add telemetry for error frequency tracking

## Related Issues

- Issue #96: Architecture Modernization (Phase 2)
- PR: Implement Error Boundaries for Error Handling
