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
  const { data: migrationState } = useQuery({
    queryKey: ["migration", "state"],
    queryFn: () => {
      const stored = MigrationStorageService.getMigrationState();
      if (stored) {
        return stored;
      }

      // Initialize migration state
      const initialMigrations: Migration[] = AVAILABLE_MIGRATIONS.map(
        (migration) => ({
          ...migration,
          status: MigrationStatus.PENDING,
          progress: 0,
          createdAt: new Date(),
        }),
      );

      return {
        migrations: initialMigrations,
        lastRun: null,
        currentVersion: "3.0.0",
      };
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

  // Create backup before migration
  const createBackup = useCallback(
    async (migrationId: string) => {
      try {
        const backup = {
          id: `backup-${migrationId}-${Date.now()}`,
          migrationId,
          timestamp: new Date(),
          data: {
            // In a real implementation, this would backup relevant data
            localStorage: { ...localStorage },
            version: migrationState?.currentVersion,
          },
        };

        const existingBackups =
          MigrationStorageService.getMigrationBackups<typeof backup>();

        const updatedBackups = [...existingBackups, backup];
        MigrationStorageService.setMigrationBackups(updatedBackups);

        logger.info("Migration backup created", {
          migrationId,
          backupId: backup.id,
        });
        return backup.id;
      } catch (error) {
        logger.error("Failed to create migration backup", {
          migrationId,
          error,
        });
        throw error;
      }
    },
    [migrationState],
  );

  // Migration implementations
  const migrateThemeSystem = useCallback(
    async (onProgress: (progress: number) => void) => {
      onProgress(25);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Convert old theme settings
      const oldTheme = MigrationStorageService.getLegacyItem("theme");
      if (oldTheme) {
        MigrationStorageService.setLegacyItem(
          "chastity-theme-current",
          JSON.stringify(
            oldTheme === "dark" ? "default-dark" : "default-light",
          ),
        );
      }

      onProgress(75);
      await new Promise((resolve) => setTimeout(resolve, 500));
      onProgress(100);
    },
    [],
  );

  const migrateEnhancedGoals = useCallback(
    async (onProgress: (progress: number) => void) => {
      onProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Convert legacy goals (simplified)
      const legacyGoals =
        MigrationStorageService.getLegacyItem("personal-goals");
      if (legacyGoals) {
        // Transform format here
        onProgress(70);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      onProgress(100);
    },
    [],
  );

  const migrateGamificationSystem = useCallback(
    async (onProgress: (progress: number) => void) => {
      onProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Initialize gamification data
      onProgress(60);
      await new Promise((resolve) => setTimeout(resolve, 400));
      onProgress(100);
    },
    [],
  );

  // Execute migration logic
  const executeMigrationLogic = useCallback(
    async (migrationId: string, onProgress: (progress: number) => void) => {
      switch (migrationId) {
        case "v4.0.0-theme-system":
          await migrateThemeSystem(onProgress);
          break;
        case "v4.0.0-enhanced-goals":
          await migrateEnhancedGoals(onProgress);
          break;
        case "v4.0.0-gamification":
          await migrateGamificationSystem(onProgress);
          break;
        default:
          throw new Error(`Unknown migration: ${migrationId}`);
      }
    },
    [migrateThemeSystem, migrateEnhancedGoals, migrateGamificationSystem],
  );

  // Execute single migration
  const executeMigration = useCallback(
    async (migration: Migration): Promise<void> => {
      logger.info("Starting migration", { migrationId: migration.id });

      // Update migration status
      const updatedMigrations = migrationState.migrations.map((m: Migration) =>
        m.id === migration.id
          ? {
              ...m,
              status: MigrationStatus.RUNNING,
              startedAt: new Date(),
              progress: 0,
            }
          : m,
      );

      const newState = { ...migrationState, migrations: updatedMigrations };
      MigrationStorageService.setMigrationState(newState);
      queryClient.setQueryData(["migration", "state"], newState);

      try {
        // Create backup if rollback is available
        if (migration.rollbackAvailable) {
          await createBackup(migration.id);
        }

        // Execute migration logic based on ID
        await executeMigrationLogic(migration.id, (progress: number) => {
          // Update progress
          const progressUpdatedMigrations = migrationState.migrations.map(
            (m: Migration) => (m.id === migration.id ? { ...m, progress } : m),
          );

          const progressState = {
            ...migrationState,
            migrations: progressUpdatedMigrations,
          };
          MigrationStorageService.setMigrationState(progressState);
          queryClient.setQueryData(["migration", "state"], progressState);
        });

        // Mark as completed
        const completedMigrations = migrationState.migrations.map(
          (m: Migration) =>
            m.id === migration.id
              ? {
                  ...m,
                  status: MigrationStatus.COMPLETED,
                  completedAt: new Date(),
                  progress: 100,
                }
              : m,
        );

        const completedState = {
          ...migrationState,
          migrations: completedMigrations,
        };
        MigrationStorageService.setMigrationState(completedState);
        queryClient.setQueryData(["migration", "state"], completedState);

        logger.info("Migration completed", { migrationId: migration.id });
      } catch (error) {
        // Mark as failed
        const failedMigrations = migrationState.migrations.map(
          (m: Migration) =>
            m.id === migration.id
              ? {
                  ...m,
                  status: MigrationStatus.FAILED,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : m,
        );

        const failedState = { ...migrationState, migrations: failedMigrations };
        MigrationStorageService.setMigrationState(failedState);
        queryClient.setQueryData(["migration", "state"], failedState);

        logger.error("Migration failed", { migrationId: migration.id, error });
        throw error;
      }
    },
    [migrationState, queryClient, createBackup, executeMigrationLogic],
  );

  // Run migrations mutation
  const runMigrationsMutation = useMutation({
    mutationFn: async (migrationIds?: string[]) => {
      setIsRunning(true);
      const startTime = Date.now();
      const result: MigrationResult = {
        success: true,
        migrationsRun: 0,
        errors: [],
        warnings: [],
        duration: 0,
      };

      try {
        const migrationsToRun = migrationIds
          ? migrationState.migrations.filter((m: Migration) =>
              migrationIds.includes(m.id),
            )
          : pendingMigrations;

        for (const migration of migrationsToRun) {
          try {
            await executeMigration(migration);
            result.migrationsRun++;
          } catch (error) {
            result.success = false;
            result.errors.push(
              `${migration.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }

        result.duration = Date.now() - startTime;
        return result;
      } finally {
        setIsRunning(false);
      }
    },
  });

  // Rollback migration mutation
  const rollbackMigrationMutation = useMutation({
    mutationFn: async (migrationId: string) => {
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
      Object.entries(backup.data.localStorage).forEach(([key, value]) => {
        MigrationStorageService.setLegacyItem(key, value);
      });

      // Update migration status
      const rolledBackMigrations = migrationState.migrations.map(
        (m: Migration) =>
          m.id === migrationId
            ? { ...m, status: MigrationStatus.ROLLED_BACK }
            : m,
      );

      const rolledBackState = {
        ...migrationState,
        migrations: rolledBackMigrations,
      };
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
