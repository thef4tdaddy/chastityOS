/**
 * Tracker Stats Calculation Helpers
 * Extracted helper functions to reduce complexity
 */
import type { DBSession } from "../../types/database";

/**
 * Format time in seconds to h:m:s
 */
export function formatTimeFromSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

/**
 * Format timestamp as HH:MM:SS MM/DD/YYYY
 */
export function formatTimestamp(date: Date | null | undefined): string {
  if (!date) return "";

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} ${month}/${day}/${year}`;
}

/**
 * Determine top box label and timestamp based on session state
 */
export function determineTopBoxInfo(
  currentSession: DBSession | null | undefined,
): { label: string; timestamp: string } {
  if (!currentSession) {
    return { label: "", timestamp: "" };
  }

  if (currentSession.endTime) {
    return {
      label: "Cage Taken Off",
      timestamp: formatTimestamp(currentSession.endTime),
    };
  }

  if (currentSession.isPaused && currentSession.pauseStartTime) {
    return {
      label: "Pause Started",
      timestamp: formatTimestamp(currentSession.pauseStartTime),
    };
  }

  if (currentSession.startTime) {
    return {
      label: "Caged At",
      timestamp: formatTimestamp(currentSession.startTime),
    };
  }

  return { label: "", timestamp: "" };
}
