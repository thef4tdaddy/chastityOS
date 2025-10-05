/**
 * Helper functions for useMigration hook
 * Extracted to reduce function complexity
 */
import { logger } from "../../utils/logging";
import { MigrationStorageService } from "../../services/migrationStorage";

/**
 * Create backup before migration
 */
export async function createMigrationBackup(
  migrationId: string,
  currentVersion: string | undefined,
) {
  try {
    const backup = {
      id: `backup-${migrationId}-${Date.now()}`,
      migrationId,
      timestamp: new Date(),
      data: {
        // Backup all localStorage via service
        localStorage: MigrationStorageService.getAllLocalStorage(),
        version: currentVersion,
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
}

/**
 * Migrate theme system
 */
export async function migrateThemeSystem(
  onProgress: (progress: number) => void,
) {
  onProgress(25);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Convert old theme settings
  const oldTheme = MigrationStorageService.getLegacyItem("theme");
  if (oldTheme) {
    MigrationStorageService.setLegacyItem(
      "chastity-theme-current",
      JSON.stringify(oldTheme === "dark" ? "default-dark" : "default-light"),
    );
  }

  onProgress(75);
  await new Promise((resolve) => setTimeout(resolve, 500));
  onProgress(100);
}

/**
 * Migrate enhanced goals
 */
export async function migrateEnhancedGoals(
  onProgress: (progress: number) => void,
) {
  onProgress(30);
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Convert legacy goals (simplified)
  const legacyGoals = MigrationStorageService.getLegacyItem("personal-goals");
  if (legacyGoals) {
    // Transform format here
    onProgress(70);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  onProgress(100);
}

/**
 * Migrate gamification system
 */
export async function migrateGamificationSystem(
  onProgress: (progress: number) => void,
) {
  onProgress(20);
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Initialize gamification data
  onProgress(60);
  await new Promise((resolve) => setTimeout(resolve, 400));
  onProgress(100);
}

/**
 * Execute migration logic by ID
 */
export async function executeMigrationLogic(
  migrationId: string,
  onProgress: (progress: number) => void,
) {
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
}
