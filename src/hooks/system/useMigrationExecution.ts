/**
 * Migration Execution
 *
 * Handles the execution of individual migrations with progress tracking
 * and state management.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import { MigrationStorageService } from "../../services/migrationStorage";
import { MigrationStatus } from "./useMigration";
import type { Migration } from "./useMigration";

interface MigrationStateData {
  migrations: Migration[];
  lastRun?: Date | null;
  currentVersion: string;
}

interface UseMigrationExecutionProps {
  migrationState: MigrationStateData;
  createBackup: (migrationId: string) => Promise<string>;
  executeMigrationLogic: (
    migrationId: string,
    onProgress: (progress: number) => void,
  ) => Promise<void>;
}

export const useMigrationExecution = ({
  migrationState,
  createBackup,
  executeMigrationLogic,
}: UseMigrationExecutionProps) => {
  const queryClient = useQueryClient();

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

  return {
    executeMigration,
  };
};
