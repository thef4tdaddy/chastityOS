/**
 * Migration Mutations
 *
 * Provides mutation actions for running migrations and rollback operations.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import { MigrationStorageService } from "../../services/migrationStorage";
import { MigrationStatus } from "./useMigration";
import type { Migration, MigrationResult } from "./useMigration";

interface MigrationStateData {
  migrations: Migration[];
  lastRun?: Date | null;
  currentVersion: string;
}

interface UseMigrationMutationsProps {
  migrationState: MigrationStateData | undefined;
  pendingMigrations: Migration[];
  executeMigration: (migration: Migration) => Promise<void>;
}

export const useMigrationMutations = ({
  migrationState,
  pendingMigrations,
  executeMigration,
}: UseMigrationMutationsProps) => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

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
          ? migrationState?.migrations?.filter((m: Migration) =>
              migrationIds.includes(m.id),
            ) || []
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
      const migration = migrationState?.migrations?.find(
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
      const rolledBackMigrations =
        migrationState?.migrations?.map((m: Migration) =>
          m.id === migrationId
            ? { ...m, status: MigrationStatus.ROLLED_BACK }
            : m,
        ) || [];

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
    isRunning,
    runMigrationsMutation,
    rollbackMigrationMutation,
  };
};
