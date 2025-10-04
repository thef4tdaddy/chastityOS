/**
 * Data Management Service
 * Handles export/import of user data for backup and restore
 */
import { db } from "./storage/ChastityDB";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("DataManagementService");

export interface ExportData {
  userId: string;
  userEmail?: string;
  exportedAt: string;
  sessions: unknown[];
  events: unknown[];
  tasks: unknown[];
  goals: unknown[];
  settings: unknown[];
  rules: unknown[];
}

/**
 * Export all user data to JSON
 */
export async function exportUserData(
  userId: string,
  userEmail?: string,
): Promise<string> {
  try {
    logger.info("Exporting user data", { userId });

    // Fetch all data from Dexie
    const [sessions, events, tasks, goals, settings, rules] = await Promise.all(
      [
        db.sessions.where("userId").equals(userId).toArray(),
        db.events.where("userId").equals(userId).toArray(),
        db.tasks.where("userId").equals(userId).toArray(),
        db.goals.where("userId").equals(userId).toArray(),
        db.settings.where("userId").equals(userId).toArray(),
        db.rules
          ? db.rules
              .where({ keyholderUserId: userId })
              .or("submissiveUserId")
              .equals(userId)
              .toArray()
          : [],
      ],
    );

    const exportData: ExportData = {
      userId,
      userEmail,
      exportedAt: new Date().toISOString(),
      sessions,
      events,
      tasks,
      goals,
      settings,
      rules,
    };

    logger.info("Data export successful", {
      userId,
      sessionCount: sessions.length,
      eventCount: events.length,
      taskCount: tasks.length,
      goalCount: goals.length,
    });

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error("Failed to export data", { error, userId });
    throw error;
  }
}

/**
 * Download exported data as JSON file
 */
export function downloadDataAsJSON(jsonData: string, userId: string): void {
  try {
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chastityos-backup-${userId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info("Data download triggered", { userId });
  } catch (error) {
    logger.error("Failed to download data", { error, userId });
    throw error;
  }
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
        const data = JSON.parse(e.target?.result as string) as ExportData;

        if (!data.userId) {
          throw new Error("Invalid backup file: Missing user ID");
        }

        logger.info("Importing user data", {
          userId,
          backupUserId: data.userId,
        });

        // Clear existing data
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
            const updateUserId = (item: any) => ({ ...item, userId });

            if (data.sessions?.length) {
              await db.sessions.bulkAdd(data.sessions.map(updateUserId));
            }
            if (data.events?.length) {
              await db.events.bulkAdd(data.events.map(updateUserId));
            }
            if (data.tasks?.length) {
              await db.tasks.bulkAdd(data.tasks.map(updateUserId));
            }
            if (data.goals?.length) {
              await db.goals.bulkAdd(data.goals.map(updateUserId));
            }
            if (data.settings?.length) {
              await db.settings.bulkAdd(data.settings.map(updateUserId));
            }
            if (data.rules?.length) {
              await db.rules.bulkAdd(data.rules as any[]);
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
