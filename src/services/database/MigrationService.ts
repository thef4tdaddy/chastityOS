/**
 * Database Migration Service
 * Handles database schema migrations and data transformations
 */

import { db } from "../storage/ChastityDB";
import { serviceLogger } from "../../utils/logging";
import type {
  DBUser,
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
  DBSettings,
  DBSyncMeta,
} from "../../types/database";

const logger = serviceLogger("MigrationService");

export interface MigrationStep {
  version: number;
  description: string;
  migrate: () => Promise<void>;
  rollback?: () => Promise<void>;
}

export class DBMigrationService {
  private static migrations: MigrationStep[] = [
    {
      version: 2,
      description: "Add sync status to existing records",
      migrate: async () => {
        logger.info(
          "Running migration v2: Add sync status to existing records",
        );

        await db.transaction(
          "rw",
          [db.sessions, db.events, db.tasks, db.goals],
          async () => {
            // Update sessions without sync status
            const sessions = await db.sessions
              .filter((session) => !session.syncStatus)
              .toArray();
            for (const session of sessions) {
              if (session.id) {
                await db.sessions.update(session.id, {
                  syncStatus: "synced",
                  lastModified: new Date(),
                });
              }
            }

            // Update events without sync status
            const events = await db.events
              .filter((event) => !event.syncStatus)
              .toArray();
            for (const event of events) {
              if (event.id) {
                await db.events.update(event.id, {
                  syncStatus: "synced",
                  lastModified: new Date(),
                });
              }
            }

            // Update tasks without sync status
            const tasks = await db.tasks
              .filter((task) => !task.syncStatus)
              .toArray();
            for (const task of tasks) {
              if (task.id) {
                await db.tasks.update(task.id, {
                  syncStatus: "synced",
                  lastModified: new Date(),
                });
              }
            }

            // Update goals without sync status
            const goals = await db.goals
              .filter((goal) => !goal.syncStatus)
              .toArray();
            for (const goal of goals) {
              if (goal.id) {
                await db.goals.update(goal.id, {
                  syncStatus: "synced",
                  lastModified: new Date(),
                });
              }
            }
          },
        );

        logger.info("Migration v2 completed successfully");
      },
    },
    {
      version: 3,
      description: "Add isPrivate field to events",
      migrate: async () => {
        logger.info("Running migration v3: Add isPrivate field to events");

        await db.transaction("rw", db.events, async () => {
          const events = await db.events
            .filter((event) => event.isPrivate === undefined)
            .toArray();
          for (const event of events) {
            if (event.id) {
              await db.events.update(event.id, {
                isPrivate: false, // Default to public for existing events
              });
            }
          }
        });

        logger.info("Migration v3 completed successfully");
      },
    },
  ];

  /**
   * Run all pending migrations
   */
  static async runMigrations(): Promise<void> {
    try {
      logger.info("Starting database migrations");

      const currentVersion = db.verno;
      logger.debug("Current database version", { version: currentVersion });

      // Find migrations that need to be run
      const pendingMigrations = this.migrations.filter(
        (migration) => migration.version > currentVersion,
      );

      if (pendingMigrations.length === 0) {
        logger.info("No migrations needed");
        return;
      }

      logger.info("Running migrations", {
        count: pendingMigrations.length,
        versions: pendingMigrations.map((m) => m.version),
      });

      // Run migrations in order
      for (const migration of pendingMigrations) {
        logger.info("Running migration", {
          version: migration.version,
          description: migration.description,
        });

        try {
          await migration.migrate();
          logger.info("Migration completed", { version: migration.version });
        } catch (error) {
          logger.error("Migration failed", {
            version: migration.version,
            error: error as Error,
          });
          throw error;
        }
      }

      logger.info("All migrations completed successfully");
    } catch (error) {
      logger.error("Migration process failed", { error: error as Error });
      throw error;
    }
  }

  /**
   * Check if migrations are needed
   */
  static async checkMigrationsNeeded(): Promise<boolean> {
    const currentVersion = db.verno;
    const maxMigrationVersion = Math.max(
      ...this.migrations.map((m) => m.version),
    );
    return currentVersion < maxMigrationVersion;
  }

  /**
   * Get migration status information
   */
  static async getMigrationStatus(): Promise<{
    currentVersion: number;
    latestVersion: number;
    pendingMigrations: number;
    migrationsNeeded: boolean;
  }> {
    const currentVersion = db.verno;
    const latestVersion = Math.max(...this.migrations.map((m) => m.version));
    const pendingMigrations = this.migrations.filter(
      (m) => m.version > currentVersion,
    ).length;

    return {
      currentVersion,
      latestVersion,
      pendingMigrations,
      migrationsNeeded: pendingMigrations > 0,
    };
  }

  /**
   * Backup database before running migrations
   */
  static async createBackup(): Promise<{
    users: DBUser[];
    sessions: DBSession[];
    events: DBEvent[];
    tasks: DBTask[];
    goals: DBGoal[];
    settings: DBSettings[];
    syncMeta: DBSyncMeta[];
  }> {
    logger.info("Creating database backup");

    const backup = {
      users: await db.users.toArray(),
      sessions: await db.sessions.toArray(),
      events: await db.events.toArray(),
      tasks: await db.tasks.toArray(),
      goals: await db.goals.toArray(),
      settings: await db.settings.toArray(),
      syncMeta: await db.syncMeta.toArray(),
    };

    logger.info("Database backup created", {
      users: backup.users.length,
      sessions: backup.sessions.length,
      events: backup.events.length,
      tasks: backup.tasks.length,
      goals: backup.goals.length,
      settings: backup.settings.length,
    });

    return backup;
  }

  /**
   * Restore database from backup
   */
  static async restoreFromBackup(backup: {
    users: DBUser[];
    sessions: DBSession[];
    events: DBEvent[];
    tasks: DBTask[];
    goals: DBGoal[];
    settings: DBSettings[];
    syncMeta: DBSyncMeta[];
  }): Promise<void> {
    logger.info("Restoring database from backup");

    await db.transaction(
      "rw",
      [
        db.users,
        db.sessions,
        db.events,
        db.tasks,
        db.goals,
        db.settings,
        db.syncMeta,
      ],
      async () => {
        // Clear existing data
        await db.users.clear();
        await db.sessions.clear();
        await db.events.clear();
        await db.tasks.clear();
        await db.goals.clear();
        await db.settings.clear();
        await db.syncMeta.clear();

        // Restore from backup
        await db.users.bulkAdd(backup.users);
        await db.sessions.bulkAdd(backup.sessions);
        await db.events.bulkAdd(backup.events);
        await db.tasks.bulkAdd(backup.tasks);
        await db.goals.bulkAdd(backup.goals);
        await db.settings.bulkAdd(backup.settings);
        await db.syncMeta.bulkAdd(backup.syncMeta);
      },
    );

    logger.info("Database restored from backup successfully");
  }

  /**
   * Validate database integrity after migration
   */
  static async validateDatabaseIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    logger.info("Validating database integrity");

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for required fields
      const sessions = await db.sessions.toArray();
      for (const session of sessions) {
        if (!session.syncStatus) {
          errors.push(`Session ${session.id} missing syncStatus`);
        }
        if (!session.lastModified) {
          errors.push(`Session ${session.id} missing lastModified`);
        }
        if (!session.userId) {
          errors.push(`Session ${session.id} missing userId`);
        }
      }

      const events = await db.events.toArray();
      for (const event of events) {
        if (!event.syncStatus) {
          errors.push(`Event ${event.id} missing syncStatus`);
        }
        if (event.isPrivate === undefined) {
          warnings.push(`Event ${event.id} missing isPrivate field`);
        }
      }

      const tasks = await db.tasks.toArray();
      for (const task of tasks) {
        if (!task.syncStatus) {
          errors.push(`Task ${task.id} missing syncStatus`);
        }
        if (!task.status) {
          errors.push(`Task ${task.id} missing status`);
        }
      }

      // Check referential integrity
      for (const event of events) {
        if (event.sessionId) {
          const session = await db.sessions.get(event.sessionId);
          if (!session) {
            warnings.push(
              `Event ${event.id} references non-existent session ${event.sessionId}`,
            );
          }
        }
      }

      logger.info("Database integrity check completed", {
        errors: errors.length,
        warnings: warnings.length,
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error("Database integrity check failed", {
        error: error as Error,
      });
      return {
        isValid: false,
        errors: [`Integrity check failed: ${(error as Error).message}`],
        warnings,
      };
    }
  }
}
