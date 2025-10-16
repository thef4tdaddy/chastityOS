/**
 * Data Management Service
 * Facade for export/import functionality - delegates to specialized services
 * @deprecated Import from @/services/data/DataExportService or @/services/data/DataImportService instead
 */

// Re-export from specialized services for backward compatibility
export {
  exportUserData,
  downloadDataAsJSON,
  type ExportData,
} from "./data/DataExportService";

export {
  importUserData,
  validateImportData,
  type ImportData,
} from "./data/DataImportService";
