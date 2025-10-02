/**
 * useMigration Hook - Data Migration Management
 *
 * Handle data migrations, schema updates, and legacy data conversion with
 * progress tracking and rollback capabilities.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MigrationStorageService } from "../../services/migrationStorage";
import { useMigrationBackup } from "./useMigrationBackup";
import { useMigrationImplementations } from "./useMigrationImplementations";
import { useMigrationExecution } from "./useMigrationExecution";
import { useMigrationMutations } from "./useMigrationMutations";

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

  // Migration backup operations
  const { createBackup } = useMigrationBackup(migrationState);

  // Migration implementation logic
  const { executeMigrationLogic } = useMigrationImplementations();

  // Migration execution with progress tracking
  const { executeMigration } = useMigrationExecution({
    migrationState: migrationState!,
    createBackup,
    executeMigrationLogic,
  });

  // Migration mutations (run and rollback)
  const { isRunning, runMigrationsMutation, rollbackMigrationMutation } =
    useMigrationMutations({
      migrationState,
      pendingMigrations,
      executeMigration,
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
