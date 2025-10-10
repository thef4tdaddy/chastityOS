# LoadingState Component

A standardized loading state component that combines a spinner with optional loading text for consistent loading UX across the application.

## Features

- **Three size variants**: sm, md (default), lg - matching Spinner sizes
- **Inline mode** (default): Centered within container with padding
- **Full-screen mode**: Fixed overlay covering entire viewport
- **Overlay mode**: Absolute overlay with dimmed background
- **Accessible**: Includes ARIA attributes for screen readers
- **Customizable message**: Optional loading message with size-appropriate text

## Basic Usage

```tsx
import { LoadingState } from '@/components/ui';

// Simple inline loading
<LoadingState />

// With custom message
<LoadingState message="Loading data..." />

// Small size
<LoadingState size="sm" message="Please wait..." />

// Full-screen loading for pages
<LoadingState message="Loading page..." fullScreen />

// Overlay loading for async operations
<LoadingState message="Saving..." overlay />
```

## Props

- **message** (string): Loading message to display (default: "Loading...")
- **size** ('sm' | 'md' | 'lg'): Size variant (default: 'md')
- **fullScreen** (boolean): Full-screen loading mode (default: false)
- **overlay** (boolean): Overlay mode with dimmed background (default: false)
- **className** (string): Additional CSS classes

## Accessibility

The component includes proper ARIA attributes:
- role="status" - Indicates live region
- aria-live="polite" - Announces changes to screen readers
- aria-busy="true" - Indicates loading state

## Migration Examples

Replace FaSpinner + text patterns:
```tsx
// Before
<FaSpinner className="animate-spin" />
<p>Loading Session...</p>

// After
<LoadingState message="Loading Session..." />
```

## Related Components

- Spinner - Basic spinner without text
- EmptyState - Empty state display
- ErrorState - Error state display
