# Task Workflow Integration Tests

This directory contains integration tests for task management workflows at the service/database level.

## Test File

### `task-workflow.test.ts`
Tests complete task workflows using mocked services:

#### Workflows Tested:

1. **Create → Assign → Submit → Approve**
   - Full happy path from task creation to completion
   - Points awarded correctly
   - Status transitions tracked

2. **Create → Assign → Submit → Reject → Resubmit**
   - Rejection handling
   - Feedback provided
   - Resubmission allowed
   - Status updates tracked

3. **Recurring Task Workflow**
   - Recurring task creation with frequency settings
   - Approval of first instance
   - Next instance generation
   - Series tracking

4. **Evidence Upload Workflow**
   - Evidence attachment to tasks
   - Evidence availability to keyholder
   - Multiple attachments support

5. **Points Calculation**
   - Correct point values awarded
   - Point tracking on task completion
   - Consequence-based points

6. **Punishment Application**
   - Punishment applied on rejection
   - Negative points tracked
   - Consequence enforcement

7. **Edge Cases**
   - Task deletion
   - Concurrent updates
   - Status transition validation

## Test Structure

Tests use:
- **Vitest** as the test runner
- **Mock services** for database operations
- **Type-safe** task objects from `@/types/database`
- **Async/await** patterns for realistic service simulation

## Running Tests

### Run all integration tests:
```bash
npm run test:unit -- src/__tests__/integration/
```

### Run specific test file:
```bash
npm run test:unit -- src/__tests__/integration/task-workflow.test.ts
```

### Run with coverage:
```bash
npm run test:unit:coverage -- src/__tests__/integration/
```

### Run in watch mode:
```bash
npm run test:unit:watch -- src/__tests__/integration/
```

## Test Coverage

Integration tests verify:
- ✅ Complete workflow logic
- ✅ Service layer integration
- ✅ Data consistency across operations
- ✅ Status transitions
- ✅ Point calculation logic
- ✅ Punishment application
- ✅ Recurring task instance creation
- ✅ Edge case handling

## Mock Strategy

Tests use mocked services (`mockTaskService`) that simulate:
- Task creation
- Task retrieval
- Task updates
- Task submission
- Task approval/rejection
- Task deletion

This approach allows testing business logic without:
- Firebase/Firestore dependencies
- Network calls
- Database state management
- Authentication requirements

## Benefits

Integration tests provide:
- **Fast execution** - No real database or network calls
- **Isolation** - Each test is independent
- **Reliability** - No flaky tests from network/timing issues
- **Clear assertions** - Service calls can be verified
- **Easy debugging** - Mock calls can be inspected

## Future Enhancements

Potential additions:
- Real Firebase emulator integration tests
- Performance benchmarking
- Load testing with multiple simultaneous operations
- Integration with notification service
- Integration with achievement engine
