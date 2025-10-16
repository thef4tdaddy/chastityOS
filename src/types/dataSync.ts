/**
 * Data Sync Types (Stub)
 * TODO: Implement when data sync feature is developed
 */

export interface SyncQuality {
  score: number;
}

export interface RelationshipSyncStatus {
  syncQuality: SyncQuality;
}

export interface SyncMetrics {
  lastSuccessfulSync: Date | null;
}

export interface SyncPermissions {
  syncFrequency: "realtime" | "frequent" | "moderate" | "minimal";
}

export interface DataConflict {
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
}
