# ChastityOS Testing Strategy

This document outlines the comprehensive testing strategy implemented for ChastityOS to ensure zero regression during modernization and maintain code quality.

## Overview

The testing strategy is built around multiple layers:

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test component interactions and data flows
- **End-to-End Tests** - Test complete user workflows
- **Performance Tests** - Ensure performance benchmarks are met

## Test Architecture

### Unit Testing (Vitest + Testing Library)

#### Configuration

- **Framework**: Vitest with jsdom environment
- **Location**: `src/**/__tests__/*.test.{ts,tsx}`
- **Config**: `vitest.config.ts`
- **Setup**: `src/test/setup.ts`

#### What we test:

- ✅ Utility functions (hash, time formatting, date formatting)
- ✅ Zustand stores (navigation, notifications)
- ✅ Service layer functions
- 🔄 React hooks (in progress)
- 🔄 UI components (in progress)

#### Coverage Goals

- **Target**: 90%+ overall coverage
- **Critical paths**: 100% coverage
- **Current**: ~72 tests passing

### Integration Testing

#### What we test:

- Data flow between Firebase ↔ Dexie ↔ TanStack Query
- Authentication flows (anonymous and Google SSO)
- Session management lifecycle
- Task workflow from creation to completion

### End-to-End Testing (Playwright)

#### Configuration

- **Framework**: Playwright
- **Location**: `tests/*.spec.ts`
- **Config**: `playwright.config.ts`

#### Test Coverage:

- ✅ Application loading and basic navigation
- ✅ Responsive design across devices
- ✅ PWA functionality
- ✅ Accessibility compliance
- ✅ Offline mode behavior

#### Browsers Tested:

- Chrome (Desktop & Mobile)
- Firefox
- Safari (Desktop & Mobile)

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with watch mode
npm run test:unit:watch

# Run with coverage
npm run test:unit:coverage
```

### End-to-End Tests

```bash
# Run E2E tests headless
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### All Tests

```bash
# Run complete test suite
npm run test:all

# Run CI pipeline
npm run ci
```

### Test Runner

```bash
# Use our custom test runner
npm run test:runner unit
npm run test:runner e2e
npm run test:runner ci
```

## Test Structure

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { formatElapsedTime } from "../utils/formatting/time";

describe("formatElapsedTime", () => {
  it("should format seconds correctly", () => {
    expect(formatElapsedTime(30)).toBe("30s");
    expect(formatElapsedTime(90)).toBe("01m 30s");
  });

  it("should handle edge cases", () => {
    expect(formatElapsedTime(0)).toBe("0s");
    expect(formatElapsedTime(-10)).toBe("0s");
  });
});
```

### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ExampleComponent } from '../ExampleComponent';

describe('ExampleComponent', () => {
  it('should handle user interactions', () => {
    const mockClick = vi.fn();
    render(<ExampleComponent onButtonClick={mockClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("user can complete a workflow", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Test user workflow
  await page.click('[data-testid="start-button"]');
  await expect(page.locator(".success-message")).toBeVisible();
});
```

## Test Utilities

### Mock Factories

Located in `src/test/utils.ts`:

- `createMockUser()` - Generate test user data
- `createMockSession()` - Generate test session data
- `createMockEvent()` - Generate test event data
- `createMockTask()` - Generate test task data

### Test Helpers

- `waitForLoadingToFinish()` - Wait for async operations
- `flushPromises()` - Flush promise queue
- `measurePerformance()` - Performance testing utilities

## Mocking Strategy

### Firebase Mocking

All Firebase operations are mocked in the test environment:

```typescript
vi.mock("../firebase", () => ({
  db: {
    /* mocked methods */
  },
  auth: {
    /* mocked methods */
  },
  storage: {
    /* mocked methods */
  },
}));
```

### Crypto Mocking

Deterministic crypto operations for consistent testing:

```typescript
global.crypto = {
  subtle: { digest: vi.fn().mockImplementation(/* deterministic hash */) },
  randomUUID: vi.fn().mockImplementation(/* mock UUID */),
};
```

## Performance Testing

### Benchmarks

- Initial app load: < 2 seconds
- Component render times: < 100ms individual
- Data operations: < 500ms for typical operations

### Load Testing

E2E tests include performance assertions:

```typescript
test("should load within performance budget", async ({ page }) => {
  const startTime = performance.now();
  await page.goto("/");
  const loadTime = performance.now() - startTime;

  expect(loadTime).toBeLessThan(2000);
});
```

## Regression Testing

### Feature Parity Tests

Ensure new architecture maintains exact same behavior:

```typescript
describe("Feature Parity", () => {
  it("should maintain timing calculations", () => {
    const oldResult = legacyTimingFunction(input);
    const newResult = modernTimingFunction(input);
    expect(newResult).toBe(oldResult);
  });
});
```

### Visual Regression

Screenshots are captured during E2E tests for visual comparison:

- Different viewport sizes
- Different component states
- Cross-browser consistency

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## Quality Gates

### Pre-commit Hooks

- Linting must pass
- Type checking must pass
- Unit tests must pass

### Pre-push Hooks

- All tests must pass
- Coverage threshold must be met
- No security vulnerabilities

### Deployment Gates

- Full test suite must pass
- Performance benchmarks must be met
- E2E tests must pass on all browsers

## Test Data Management

### Test Database

- Use separate test environment
- Reset state between tests
- Deterministic test data

### Environment Configuration

```typescript
// Test environment variables
process.env.NODE_ENV = "test";
process.env.FIREBASE_EMULATOR = "true";
```

## Best Practices

### Writing Tests

1. **Arrange, Act, Assert** pattern
2. **Descriptive test names** that explain the scenario
3. **Test behavior, not implementation**
4. **Use data-testid for element selection**
5. **Mock external dependencies**

### Maintaining Tests

1. **Keep tests simple and focused**
2. **Update tests when functionality changes**
3. **Regular test cleanup and refactoring**
4. **Monitor test performance and flakiness**

### Debugging Tests

1. **Use test runners' debug modes**
2. **Add console.log for debugging (remove after)**
3. **Use browser dev tools for E2E tests**
4. **Check test artifacts (screenshots, videos)**

## Future Enhancements

### Planned Additions

- [ ] Visual regression testing with Percy/Chromatic
- [ ] Contract testing for API boundaries
- [ ] Property-based testing for complex algorithms
- [ ] Load testing with Artillery or k6
- [ ] Accessibility testing automation
- [ ] Security testing integration

### Metrics and Monitoring

- [ ] Test execution time tracking
- [ ] Flaky test detection
- [ ] Coverage trend monitoring
- [ ] Performance regression alerts

This testing strategy ensures robust, maintainable, and reliable code throughout the modernization process and beyond.
