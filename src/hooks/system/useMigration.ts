/**
 * useMigration Hook - Data Migration Management
 *
 * Handle data migrations, schema updates, and legacy data conversion with
 * progress tracking and rollback capabilities.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import { MigrationStorageService } from "../../services/migrationStorage";
import {
  createMigrationBackup,
  executeMigrationLogic,
  setMigrationRunning,
  updateMigrationProgress,
  setMigrationCompleted,
  setMigrationFailed,
  setMigrationRolledBack,
  restoreBackupData,
  runMigrationBatch,
  initializeMigrationState,
} from "./migrationHelpers";
import type { MigrationState } from "./migrationHelpers";

// Migration status
export enum MigrationStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  ROLLED_BACK = "rolled_back",
}

// Migration definition
export interface Migration {
  id: string;
  version: string;
  name: string;
  description: string;
  status: MigrationStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  error?: string;
  rollbackAvailable: boolean;
}

// Migration batch
export interface MigrationBatch {
  id: string;
  migrations: Migration[];
  status: MigrationStatus;
  totalProgress: number;
  startedAt?: Date;
  completedAt?: Date;
}

// Migration result
export interface MigrationResult {
  success: boolean;
  migrationsRun: number;
  errors: string[];
  warnings: string[];
  duration: number;
}



// Sample migrations (in a real app, these would be defined elsewhere)
const AVAILABLE_MIGRATIONS: Omit<
  Migration,
  "status" | "progress" | "createdAt"
>[] = [
  {
    id: "v4.0.0-theme-system",
    version: "4.0.0",
    name: "Theme System Migration",
    description: "Migrate existing theme preferences to new theme system",
    rollbackAvailable: true,
  },
  {
    id: "v4.0.0-enhanced-goals",
    version: "4.0.0",
    name: "Enhanced Goals Migration",
    description: "Convert legacy goals to enhanced goal format",
    rollbackAvailable: true,
  },
  {
    id: "v4.0.0-gamification",
    version: "4.0.0",
    name: "Gamification System Migration",
    description: "Initialize gamification data from existing achievements",
    rollbackAvailable: false,
  },
];

/**
 * Data Migration Hook
 */
export const useMigration = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  // Get migration state
  const { data: migrationState } = useQuery<MigrationState>({
    queryKey: ["migration", "state"],
    queryFn: (): MigrationState => {
      const stored =
        MigrationStorageService.getMigrationState<MigrationState>();
      if (stored && stored.migrations && stored.currentVersion) {
        return stored;
      }
      return initializeMigrationState(AVAILABLE_MIGRATIONS);
    },
    staleTime: Infinity,
  });

  // Get pending migrations
  const pendingMigrations =
    migrationState?.migrations?.filter(
      (m: Migration) => m.status === MigrationStatus.PENDING,
    ) || [];

  // Get completed migrations
  const completedMigrations =
    migrationState?.migrations?.filter(
      (m: Migration) => m.status === MigrationStatus.COMPLETED,
    ) || [];

  // Execute single migration
  const executeMigration = useCallback(
    async (migration: Migration): Promise<void> => {
      if (!migrationState) {
        throw new Error("Migration state not initialized");
      }

      logger.info("Starting migration", { migrationId: migration.id });

      // Update migration status to running
      const runningState = setMigrationRunning(migrationState, migration.id);
      MigrationStorageService.setMigrationState(runningState);
      queryClient.setQueryData(["migration", "state"], runningState);

      try {
        // Create backup if rollback is available
        if (migration.rollbackAvailable) {
          await createMigrationBackup(
            migration.id,
            migrationState.currentVersion,
          );
        }

        // Execute migration logic with progress updates
        await executeMigrationLogic(migration.id, (progress: number) => {
          const progressState = updateMigrationProgress(
            migrationState,
            migration.id,
            progress,
          );
          MigrationStorageService.setMigrationState(progressState);
          queryClient.setQueryData(["migration", "state"], progressState);
        });

        // Mark as completed
        const completedState = setMigrationCompleted(
          migrationState,
          migration.id,
        );
        MigrationStorageService.setMigrationState(completedState);
        queryClient.setQueryData(["migration", "state"], completedState);

        logger.info("Migration completed", { migrationId: migration.id });
      } catch (error) {
        // Mark as failed
        const failedState = setMigrationFailed(
          migrationState,
          migration.id,
          error,
        );
        MigrationStorageService.setMigrationState(failedState);
        queryClient.setQueryData(["migration", "state"], failedState);

        logger.error("Migration failed", { migrationId: migration.id, error });
        throw error;
      }
    },
    [migrationState, queryClient],
  );

  // Run migrations mutation
  const runMigrationsMutation = useMutation({
    mutationFn: async (migrationIds?: string[]) => {
      setIsRunning(true);
      const startTime = Date.now();

      try {
        const migrationsToRun = migrationIds
          ? migrationState?.migrations.filter((m: Migration) =>
              migrationIds.includes(m.id),
            ) || []
          : pendingMigrations;

        const { migrationsRun, errors } = await runMigrationBatch(
          migrationsToRun,
          executeMigration,
        );

        return {
          success: errors.length === 0,
          migrationsRun,
          errors,
          warnings: [],
          duration: Date.now() - startTime,
        };
      } finally {
        setIsRunning(false);
      }
    },
  });

  // Rollback migration mutation
  const rollbackMigrationMutation = useMutation({
    mutationFn: async (migrationId: string) => {
      if (!migrationState) {
        throw new Error("Migration state not initialized");
      }

      const migration = migrationState.migrations.find(
        (m: Migration) => m.id === migrationId,
      );
      if (!migration) throw new Error("Migration not found");
      if (!migration.rollbackAvailable)
        throw new Error("Rollback not available for this migration");

      logger.info("Rolling back migration", { migrationId });

      // Find and restore backup
      const backups = MigrationStorageService.getMigrationBackups<{
        migrationId: string;
        data: { localStorage: Record<string, string> };
      }>();
      const backup = backups.find((b) => b.migrationId === migrationId);

      if (!backup) throw new Error("Backup not found");

      // Restore data from backup
      restoreBackupData(backup.data.localStorage);

      // Update migration status
      const rolledBackState = setMigrationRolledBack(
        migrationState,
        migrationId,
      );
      MigrationStorageService.setMigrationState(rolledBackState);
      queryClient.setQueryData(["migration", "state"], rolledBackState);

      logger.info("Migration rolled back", { migrationId });
    },
  });

  return {
    // Migration state
    migrations: migrationState?.migrations || [],
    pendingMigrations,
    completedMigrations,
    isRunning,

    // Actions
    runMigrations: runMigrationsMutation.mutate,
    rollbackMigration: rollbackMigrationMutation.mutate,

    // Status
    hasPendingMigrations: pendingMigrations.length > 0,
    hasFailedMigrations:
      migrationState?.migrations?.some(
        (m: Migration) => m.status === MigrationStatus.FAILED,
      ) || false,

    // Loading states
    isRunningMigrations: runMigrationsMutation.isPending,
    isRollingBack: rollbackMigrationMutation.isPending,

    // Results
    lastResult: runMigrationsMutation.data,
    error: runMigrationsMutation.error || rollbackMigrationMutation.error,
  };
};
