/**
 * Data Export Service
 * Handles exporting user data to JSON format
 */
import { db } from "../storage/ChastityDB";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("DataExportService");

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
