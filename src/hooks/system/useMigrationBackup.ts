/**
 * Migration Backup Management
 *
 * Handles creation and management of migration backups for safe rollback.
 */
import { useCallback } from "react";
import { logger } from "../../utils/logging";
import { MigrationStorageService } from "../../services/migrationStorage";

interface MigrationStateData {
  currentVersion?: string;
}

export const useMigrationBackup = (
  migrationState: MigrationStateData | undefined,
) => {
  // Create backup before migration
  const createBackup = useCallback(
    async (migrationId: string) => {
      try {
        const backup = {
          id: `backup-${migrationId}-${Date.now()}`,
          migrationId,
          timestamp: new Date(),
          data: {
            // Backup all localStorage via service
            localStorage: MigrationStorageService.getAllLocalStorage(),
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

  return {
    createBackup,
  };
};
