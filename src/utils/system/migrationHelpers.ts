/**
 * Helper functions for useMigration hook
 * Extracted to reduce function complexity
 */
import { logger } from "../../utils/logging";
import { MigrationStorageService } from "../../services/migrationStorage";
import type { Migration } from "../../hooks/system/useMigration";
import { MigrationStatus } from "../../hooks/system/useMigration";

// Re-export for type usage
export type { Migration };
export { MigrationStatus };

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

/**
 * Update migration status to running
 */
export function setMigrationRunning(
  migrationState: { migrations: Migration[] },
  migrationId: string,
) {
  return {
    ...migrationState,
    migrations: migrationState.migrations.map((m: Migration) =>
      m.id === migrationId
        ? {
            ...m,
            status: MigrationStatus.RUNNING,
            startedAt: new Date(),
            progress: 0,
          }
        : m,
    ),
  };
}

/**
 * Update migration progress
 */
export function updateMigrationProgress(
  migrationState: { migrations: Migration[] },
  migrationId: string,
  progress: number,
) {
  return {
    ...migrationState,
    migrations: migrationState.migrations.map((m: Migration) =>
      m.id === migrationId ? { ...m, progress } : m,
    ),
  };
}

/**
 * Update migration status to completed
 */
export function setMigrationCompleted(
  migrationState: { migrations: Migration[] },
  migrationId: string,
) {
  return {
    ...migrationState,
    migrations: migrationState.migrations.map((m: Migration) =>
      m.id === migrationId
        ? {
            ...m,
            status: MigrationStatus.COMPLETED,
            completedAt: new Date(),
            progress: 100,
          }
        : m,
    ),
  };
}

/**
 * Update migration status to failed
 */
export function setMigrationFailed(
  migrationState: { migrations: Migration[] },
  migrationId: string,
  error: unknown,
) {
  return {
    ...migrationState,
    migrations: migrationState.migrations.map((m: Migration) =>
      m.id === migrationId
        ? {
            ...m,
            status: MigrationStatus.FAILED,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        : m,
    ),
  };
}

/**
 * Update migration status to rolled back
 */
export function setMigrationRolledBack(
  migrationState: { migrations: Migration[] },
  migrationId: string,
) {
  return {
    ...migrationState,
    migrations: migrationState.migrations.map((m: Migration) =>
      m.id === migrationId ? { ...m, status: MigrationStatus.ROLLED_BACK } : m,
    ),
  };
}

/**
 * Restore backup data
 */
export function restoreBackupData(backupData: Record<string, string>) {
  Object.entries(backupData).forEach(([key, value]) => {
    MigrationStorageService.setLegacyItem(key, value);
  });
}

/**
 * Run a batch of migrations
 */
export async function runMigrationBatch(
  migrations: Migration[],
  executeMigration: (migration: Migration) => Promise<void>,
): Promise<{ migrationsRun: number; errors: string[] }> {
  let migrationsRun = 0;
  const errors: string[] = [];

  for (const migration of migrations) {
    try {
      await executeMigration(migration);
      migrationsRun++;
    } catch (error) {
      errors.push(
        `${migration.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { migrationsRun, errors };
}

/**
 * Initialize migration state
 */
export function initializeMigrationState(
  availableMigrations: Omit<Migration, "status" | "progress" | "createdAt">[],
): MigrationState {
  const initialMigrations: Migration[] = availableMigrations.map(
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
}

export interface MigrationState {
  migrations: Migration[];
  lastRun: Date | null;
  currentVersion: string;
}
