/**
 * Data Sync Type Definitions
 */
export interface SyncStatus {
  state: "idle" | "syncing" | "error" | "completed";
  lastSync: Date | null;
  progress: number; // 0-100
  message: string;
  error: string | null;
}

export interface SyncResult {
  success: boolean;
  operations: {
    uploaded: number;
    downloaded: number;
    conflicts: number;
  };
  conflicts: DataConflict[];
  timestamp: Date;
  error?: string;
}

export interface RelationshipSyncStatus {
  relationshipId: string;
  partnerUserId: string;
  partnerName: string;
  lastSync: Date;
  syncQuality: SyncQuality;
  pendingChanges: PendingChange[];
  conflicts: RelationshipConflict[];
  isOnline: boolean;
  connectionStrength: number; // 0-100
}

export interface SyncQuality {
  score: number; // 0-100
  latency: number; // milliseconds
  reliability: number; // 0-100
  dataIntegrity: number; // 0-100
  lastMeasured: Date;
}

export interface PendingChange {
  id: string;
  type: "create" | "update" | "delete";
  collection: string;
  documentId: string;
  timestamp: Date;
  priority: "low" | "medium" | "high" | "critical";
  retryCount: number;
  lastError?: string;
}

export interface RelationshipConflict extends DataConflict {
  relationshipId: string;
  partnerUserId: string;
  requiresManualResolution: boolean;
}

export interface DataConflict {
  id: string;
  type: ConflictType;
  entity: DataEntity;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  keyholderVersion?: Record<string, unknown>;
  resolutionStrategy: ConflictResolutionStrategy;
  priority: ConflictPriority;
  detectedAt: Date;
  context: ConflictContext;
}

export interface ConflictContext {
  userId: string;
  relationshipId?: string;
  sessionId?: string;
  lastModifiedBy: string;
  modificationReason?: string;
}

export interface SyncPermissions {
  allowDataSharing: boolean;
  shareSessionData: boolean;
  shareGoalData: boolean;
  shareTaskData: boolean;
  shareEventData: boolean;
  allowRealTimeSync: boolean;
  syncFrequency: "realtime" | "frequent" | "moderate" | "minimal";
  privacyLevel: "public" | "relationship_only" | "private";
}

export interface SyncScope {
  collections: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeDeletions: boolean;
  maxItemsPerCollection: number;
  priorities: ConflictPriority[];
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  dataTransferred: number; // bytes
  conflictsResolved: number;
  lastSuccessfulSync: Date | null;
  reliabilityScore: number; // 0-100
}

export interface EnhancedSyncState {
  syncStatus: SyncStatus;
  relationshipSync: RelationshipSyncStatus[];
  conflicts: DataConflict[];
  syncPermissions: SyncPermissions;
  syncMetrics: SyncMetrics;
}

export interface ConflictResolution {
  conflictId: string;
  strategy: ConflictResolutionStrategy;
  customData?: Record<string, unknown>;
  reason?: string;
  preserveHistory: boolean;
}

export interface GlobalResolutionStrategy {
  defaultStrategy: ConflictResolutionStrategy;
  strategyByType: Record<ConflictType, ConflictResolutionStrategy>;
  autoResolveThreshold: number; // confidence level 0-100
}

export interface ConflictResolutionResult {
  conflictId: string;
  success: boolean;
  appliedStrategy: ConflictResolutionStrategy;
  resultingData: Record<string, unknown>;
  error?: string;
}

export interface RelationshipSyncResult {
  relationshipId: string;
  success: boolean;
  syncedCollections: string[];
  conflictsFound: number;
  conflictsResolved: number;
  error?: string;
  metrics: {
    duration: number;
    itemsSynced: number;
    bytesTransferred: number;
  };
}

export interface BackupResult {
  backupId: string;
  createdAt: Date;
  size: number; // bytes
  collections: string[];
  compressionRatio: number;
  storageLocation: string;
  expiresAt: Date;
  checksumHash: string;
}

export interface RestoreResult {
  backupId: string;
  restoredAt: Date;
  restoredCollections: string[];
  conflictsCreated: number;
  itemsRestored: number;
  errors: string[];
}

export interface SyncHealthReport {
  overall: "healthy" | "warning" | "critical";
  issues: SyncIssue[];
  recommendations: string[];
  metrics: {
    syncReliability: number;
    averageLatency: number;
    errorRate: number;
    dataIntegrityScore: number;
  };
  lastChecked: Date;
}

export interface SyncIssue {
  severity: "low" | "medium" | "high" | "critical";
  type: "connectivity" | "conflicts" | "performance" | "permissions";
  description: string;
  affectedRelationships: string[];
  suggestedActions: string[];
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: Date;
  type: "manual" | "scheduled" | "realtime" | "recovery";
  duration: number;
  itemsSynced: number;
  conflictsFound: number;
  success: boolean;
  error?: string;
  relationshipsInvolved: string[];
}

export type ConflictType =
  | "data_modified"
  | "data_deleted"
  | "schema_mismatch"
  | "permission_conflict"
  | "relationship_conflict"
  | "privacy_violation";

export type DataEntity =
  | "session"
  | "goal"
  | "task"
  | "event"
  | "settings"
  | "relationship"
  | "achievement";

export type ConflictResolutionStrategy =
  | "local_wins"
  | "remote_wins"
  | "keyholder_wins"
  | "merge_intelligent"
  | "manual_review"
  | "latest_timestamp";

export type ConflictPriority = "low" | "medium" | "high" | "critical";

export type DataEntityType =
  | "sessions"
  | "goals"
  | "tasks"
  | "events"
  | "settings"
  | "relationships";

// ==================== HOOK IMPLEMENTATION ====================
