/**
 * Legacy Dexie export for backward compatibility
 * Re-exports the new comprehensive ChastityDB
 */
export { db, ChastityDB as ChastityOSDatabase } from "./ChastityDB";

// Legacy compatibility - will be removed after migration
import { db } from "./ChastityDB";
export default db;
