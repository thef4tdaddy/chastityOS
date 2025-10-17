# Task Workflow E2E Tests

This directory contains end-to-end tests for task management workflows using Playwright.

## Test Files

### `task-workflow.spec.ts`
Tests the complete task lifecycle from creation to completion:
- Task creation and viewing
- Task assignment
- Evidence upload
- Task submission
- Task approval/rejection
- Points system integration
- Notifications
- State transitions

### `recurring-tasks.spec.ts`
Tests recurring task functionality:
- Creating daily, weekly, and monthly recurring tasks
- Approving recurring tasks and verifying next instance creation
- Managing recurring task series
- Edge cases (overdue tasks, skipping instances, invalid dates)
- Recurring task notifications

### `task-rejection.spec.ts`
Tests task rejection and resubmission workflows:
- Rejecting submitted tasks
- Displaying rejection reasons
- Resubmitting rejected tasks
- Complete reject → resubmit → approve workflow
- Punishment application on rejection
- Rejection history tracking

### `task-filters.spec.ts`
Tests filtering, searching, and sorting functionality:
- Status filtering (pending, submitted, completed, rejected)
- Priority filtering (high, medium, low)
- Task search by title and description
- Task sorting by due date, priority, creation date
- Combined filters
- Filter persistence
- Responsive UI

### `evidence-upload.spec.ts`
Tests file upload edge cases and evidence management:
- Basic image upload (PNG, JPG)
- Multiple file upload
- File type validation
- File size validation
- Evidence management (delete, replace, view)
- Upload progress indicators
- Mobile camera capture
- Evidence viewing for keyholders

## Helper Functions

The `../helpers/task-helpers.ts` file provides reusable utility functions for:
- Navigation
- Task creation and management
- Evidence upload
- Task status verification
- Filtering and searching
- Notifications

## Running Tests

### Run all task tests:
```bash
npm run test:e2e -- e2e/tasks/
```

### Run specific test file:
```bash
npm run test:e2e -- e2e/tasks/task-workflow.spec.ts
```

### Run in UI mode:
```bash
npm run test:e2e:ui -- e2e/tasks/
```

### Run in headed mode (see browser):
```bash
npm run test:e2e:headed -- e2e/tasks/
```

### Run in debug mode:
```bash
npm run test:e2e:debug -- e2e/tasks/task-workflow.spec.ts
```

## Test Coverage

The tests cover the following acceptance criteria:
- ✅ All critical user workflows have E2E coverage
- ✅ Tests clean up after themselves (using beforeEach hooks)
- ✅ Screenshots captured on failure (configured in playwright.config.ts)
- ✅ Tests designed to run in parallel where possible
- ✅ Tests are resilient to timing issues (using proper waits)

## Test Data

Tests use the following approaches for test data:
- Mock data created in tests using helper functions
- Temporary test files for evidence upload (created in `/tmp`)
- Tests are isolated and don't depend on existing data

## Notes

- These tests are designed to be flexible and handle UI variations
- Tests check for element visibility with timeouts to handle dynamic content
- Tests gracefully skip functionality that may not be available in all configurations
- Tests use appropriate waiting strategies to handle async operations
- All tests maintain page functionality even when specific features aren't available
