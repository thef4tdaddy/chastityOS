# Achievement Error Handling Documentation

## Overview
This document describes the error handling and error boundary implementation for the Achievements feature area.

## Components

### AchievementErrorBoundary
Component-level error boundary specifically for achievement components.

**Features:**
- Catches JavaScript errors anywhere in the child component tree
- Logs errors to console and Sentry (if available)
- Displays user-friendly error messages
- Provides retry functionality
- Supports custom fallback components

**Usage:**
```tsx
import { AchievementErrorBoundary } from '@/components/achievements';

<AchievementErrorBoundary onReset={handleReset}>
  <YourAchievementComponent />
</AchievementErrorBoundary>
```

**Props:**
- `children`: React node to be wrapped
- `fallback?`: Custom fallback component to display on error
- `onReset?`: Callback function called when user clicks retry

### AchievementError
Display component for user-friendly error messages.

**Features:**
- Auto-detects error types from error messages
- Displays appropriate icons based on error type
- Provides contextual error messages
- Supports retry and refresh actions
- Shows technical details (optional)

**Supported Error Types:**
- `network`: Connection/offline errors
- `permission`: Authorization errors
- `data-load`: Data fetching failures
- `calculation`: Progress calculation errors
- `unlock`: Achievement unlock failures
- `progress`: Progress update failures
- `not-found`: Missing resources
- `rate-limit`: Too many requests
- `generic`: General errors

**Usage:**
```tsx
import { AchievementError } from '@/components/achievements';

<AchievementError
  error={error}
  errorType="data-load"
  title="Failed to Load"
  message="Custom error message"
  onRetry={handleRetry}
  showDetails={true}
/>
```

## Service-Level Error Handling

### AchievementProgressService
Enhanced with robust error handling for edge cases:

**Improvements:**
1. **Input Validation**
   - Validates userId and achievementId are provided
   - Checks for finite numeric values
   - Prevents NaN and Infinity values

2. **Numeric Sanitization**
   - Ensures non-negative current values
   - Guarantees target values are at least 1 (prevents division by zero)
   - Validates all calculations are finite

3. **Award Failure Handling**
   - Progress is saved even if award fails
   - Award failures are logged but don't block progress
   - Enables retry of failed awards

**Example:**
```typescript
// Handles edge cases automatically
await progressService.updateAchievementProgress(
  userId,
  achievementId,
  currentValue, // Validated and sanitized
  targetValue   // Validated and sanitized
);
```

## Hook-Level Error Handling

### useAchievements
Enhanced with query error handling and retry logic:

**Features:**
1. **Automatic Retries**
   - 3 retry attempts for failed queries
   - Exponential backoff strategy
   - Configurable retry delays

2. **Error State Management**
   - Exposes error objects for each query
   - Provides `hasError` flag for quick checks
   - Maintains separate error states per query

3. **Data Validation**
   - Validates numeric statistics (completionPercentage, totalPoints, etc.)
   - Clamps values to valid ranges
   - Provides fallback values for invalid data

**Usage:**
```typescript
const {
  achievementStats,
  errors,
  hasError,
  isLoading
} = useAchievements(userId);

// Check for specific errors
if (errors.achievementsError) {
  // Handle achievement loading error
}

// Check if any error occurred
if (hasError) {
  // Show general error state
}
```

## Component Integration

All major achievement components are wrapped with error boundaries:

1. **AchievementDashboard**
   - Wrapped with AchievementErrorBoundary
   - Validates achievement stats before rendering
   - Handles missing data gracefully
   - Safe numeric calculations (division by zero prevention)

2. **AchievementGallery**
   - Wrapped with AchievementErrorBoundary
   - Validates input data format
   - Handles empty or invalid achievement lists
   - Maintains hooks order for React compliance

3. **LeaderboardView**
   - Wrapped with AchievementErrorBoundary
   - Enhanced error state component
   - Validates leaderboard data format
   - Graceful handling of failed data loads

## Testing

### Test Coverage
- 9 comprehensive tests for AchievementErrorBoundary
- Tests cover error catching, display, retry, and reset functionality
- Tests validate different error types are handled correctly
- All tests passing

### Running Tests
```bash
# Run achievement error boundary tests
npm run test:unit -- src/components/achievements/__tests__/AchievementErrorBoundary.test.tsx

# Run all achievement tests
npm run test:unit -- src/components/achievements
```

## Best Practices

1. **Always Wrap Components**
   - Wrap achievement components with AchievementErrorBoundary
   - Provide meaningful onReset callbacks when possible

2. **Use Specific Error Types**
   - Specify errorType when you know the error category
   - Helps users understand what went wrong

3. **Validate Data Early**
   - Check data validity before processing
   - Use Number.isFinite() for numeric checks
   - Provide fallback values for invalid data

4. **Log All Errors**
   - Use logger.error() for all error scenarios
   - Include context and timestamp
   - Send critical errors to Sentry

5. **Graceful Degradation**
   - Show partial data when possible
   - Provide retry options
   - Don't break the entire UI for one component's error

## Error Recovery

### User Actions
1. **Retry Button**: Resets error boundary and retries rendering
2. **Refresh Page**: Reloads page for persistent errors
3. **Navigate Away**: User can use other app features

### Automatic Recovery
1. **Query Retries**: React Query automatically retries failed requests
2. **Exponential Backoff**: Prevents overwhelming servers
3. **Cache Fallback**: Uses cached data when fresh data fails

## Future Improvements

1. Add error analytics to track common error patterns
2. Implement offline queue for failed operations
3. Add error recovery suggestions based on error type
4. Create error boundary for individual achievement cards
5. Add error boundary recovery metrics
