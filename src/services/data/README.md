# Data Management Services

This directory contains services for managing user data import and export operations.

## Services

### DataExportService.ts
Handles exporting user data to JSON format.

**Key Functions:**
- `exportUserData(userId, userEmail?)` - Exports all user data from the database
- `downloadDataAsJSON(jsonData, userId)` - Triggers browser download of JSON data

**Usage:**
```typescript
import { exportUserData, downloadDataAsJSON } from '@/services/data/DataExportService';

// Export user data
const jsonData = await exportUserData(userId, userEmail);

// Trigger download
downloadDataAsJSON(jsonData, userId);
```

### DataImportService.ts
Handles importing user data from JSON files.

**Key Functions:**
- `importUserData(file, userId)` - Imports user data from a JSON file
- `validateImportData(data)` - Validates the structure of import data

**Usage:**
```typescript
import { importUserData, validateImportData } from '@/services/data/DataImportService';

// Import data from file
await importUserData(file, userId);

// Validate data before import
if (validateImportData(data)) {
  // Data is valid
}
```

## Architecture

This refactoring splits the original monolithic `dataManagement.ts` file into focused services following the Single Responsibility Principle:

- **DataExportService** - Responsible only for exporting data
- **DataImportService** - Responsible only for importing data

The original `dataManagement.ts` file now acts as a facade, re-exporting from these services to maintain backward compatibility.

## Testing

Tests are located in `__tests__/`:
- `DataExportService.test.ts` - Tests for export functionality
- `DataImportService.test.ts` - Tests for import functionality

Run tests:
```bash
npm run test -- src/services/data/__tests__
```

## Benefits of This Architecture

1. **Single Responsibility** - Each service has one clear purpose
2. **Better Type Safety** - Smaller files with focused types are easier to maintain
3. **Easier Testing** - Import and export can be tested independently
4. **Improved Reusability** - Services can be used separately when needed
5. **Reduced Complexity** - Breaking down large files reduces cognitive load

## Migration Notes

The refactoring maintains full backward compatibility. Existing code can continue to import from `@/services/dataManagement` without changes.

For new code, prefer importing directly from the specific service:
```typescript
// Prefer this
import { exportUserData } from '@/services/data/DataExportService';

// Over this (deprecated but still works)
import { exportUserData } from '@/services/dataManagement';
```
