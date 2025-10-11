/**
 * Data Import Service
 * Handles importing user data from JSON files
 */
import { db } from "../storage/ChastityDB";
import { serviceLogger } from "@/utils/logging";
import type {
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
  DBSettings,
} from "@/types/database";
import type { KeyholderRule } from "@/types/core";

const logger = serviceLogger("DataImportService");

export interface ImportData {
  userId: string;
  userEmail?: string;
  exportedAt?: string;
  sessions?: unknown[];
  events?: unknown[];
  tasks?: unknown[];
  goals?: unknown[];
  settings?: unknown[];
  rules?: unknown[];
}

/**
 * Validate that the imported data has the required structure
 */
export function validateImportData(data: unknown): data is ImportData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const importData = data as Record<string, unknown>;

  if (!importData.userId || typeof importData.userId !== "string") {
    return false;
  }

  return true;
}

/**
 * Transform imported item by updating userId
 */
function transformItemWithUserId<T>(item: unknown, userId: string): T {
  if (!item || typeof item !== "object") {
    throw new Error("Invalid item in import data");
  }

  return {
    ...(item as Record<string, unknown>),
    userId,
  } as T;
}

/**
 * Import user data from JSON file
 */
export async function importUserData(
  file: File,
  userId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const rawData = e.target?.result as string;
        const data = JSON.parse(rawData) as unknown;

        if (!validateImportData(data)) {
          throw new Error("Invalid backup file: Missing or invalid user ID");
        }

        logger.info("Importing user data", {
          userId,
          backupUserId: data.userId,
        });

        // Clear existing data and import new data in a transaction
        await db.transaction(
          "rw",
          [db.sessions, db.events, db.tasks, db.goals, db.settings, db.rules],
          async () => {
            // Delete all existing data for this user
            await Promise.all([
              db.sessions.where("userId").equals(userId).delete(),
              db.events.where("userId").equals(userId).delete(),
              db.tasks.where("userId").equals(userId).delete(),
              db.goals.where("userId").equals(userId).delete(),
              db.settings.where("userId").equals(userId).delete(),
              db.rules
                .where({ keyholderUserId: userId })
                .or("submissiveUserId")
                .equals(userId)
                .delete(),
            ]);

            // Import new data (update userId to current user)
            if (data.sessions && Array.isArray(data.sessions)) {
              const transformedSessions = data.sessions.map((item) =>
                transformItemWithUserId<DBSession>(item, userId),
              );
              await db.sessions.bulkAdd(transformedSessions);
            }

            if (data.events && Array.isArray(data.events)) {
              const transformedEvents = data.events.map((item) =>
                transformItemWithUserId<DBEvent>(item, userId),
              );
              await db.events.bulkAdd(transformedEvents);
            }

            if (data.tasks && Array.isArray(data.tasks)) {
              const transformedTasks = data.tasks.map((item) =>
                transformItemWithUserId<DBTask>(item, userId),
              );
              await db.tasks.bulkAdd(transformedTasks);
            }

            if (data.goals && Array.isArray(data.goals)) {
              const transformedGoals = data.goals.map((item) =>
                transformItemWithUserId<DBGoal>(item, userId),
              );
              await db.goals.bulkAdd(transformedGoals);
            }

            if (data.settings && Array.isArray(data.settings)) {
              const transformedSettings = data.settings.map((item) =>
                transformItemWithUserId<DBSettings>(item, userId),
              );
              await db.settings.bulkAdd(transformedSettings);
            }

            if (data.rules && Array.isArray(data.rules)) {
              // Rules don't need userId transformation as they have their own structure
              const transformedRules = data.rules.map((item) => {
                if (!item || typeof item !== "object") {
                  throw new Error("Invalid rule in import data");
                }
                return item as KeyholderRule;
              });
              await db.rules.bulkAdd(transformedRules);
            }
          },
        );

        logger.info("Data import successful", { userId });
        resolve();
      } catch (error) {
        logger.error("Failed to import data", { error, userId });
        reject(error);
      }
    };

    reader.onerror = () => {
      const error = new Error("Failed to read file");
      logger.error("File read error", { error, userId });
      reject(error);
    };

    reader.readAsText(file);
  });
}
