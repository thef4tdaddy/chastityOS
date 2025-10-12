# E2E Tests for ChastityOS

## Overview
This directory contains end-to-end tests for ChastityOS using Playwright.

## Test Suites

### Keyholder & Relationships Tests
- **keyholder-workflows.spec.ts** (10 tests) - Core keyholder mode operations
- **relationship-invitations.spec.ts** (12 tests) - Invitation lifecycle workflows  
- **keyholder-permissions.spec.ts** (16 tests) - Permission management and data access

### Other E2E Tests
- **smoke.spec.ts** - Basic application smoke tests
- **tracker-session-lifecycle.spec.ts** - Session tracking tests
- **events-responsive.spec.ts** - Event logging responsive tests
- **pwa-notifications.spec.ts** - PWA notification tests

## Helpers
- **helpers/relationship-helpers.ts** - Utilities for relationship testing

## Running Tests

### All E2E Tests
```bash
npx playwright test
```

### Specific Test Suite
```bash
npx playwright test e2e/keyholder-workflows.spec.ts
npx playwright test e2e/relationship-invitations.spec.ts
npx playwright test e2e/keyholder-permissions.spec.ts
```

### Debug Mode
```bash
npx playwright test --debug
```

### UI Mode
```bash
npx playwright test --ui
```

## Requirements
- Node.js 18+
- Playwright installed: `npm install`
- Development server running: `npm run dev`

## Configuration
Tests are configured in `playwright.config.ts` at the project root.

## Documentation
See `docs/testing/KEYHOLDER_TESTING_SUMMARY.md` for detailed information about keyholder tests.
