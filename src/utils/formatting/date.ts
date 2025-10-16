/**
 * Date and time formatting utilities
 */
import { Timestamp } from "firebase/firestore";

export type DateInput = Date | Timestamp | null | undefined;

export interface TimeFormatOptions {
  includeDate?: boolean;
  forTextReport?: boolean;
}

/**
 * Formats a Date object or Firebase Timestamp into a readable string.
 * @param date - The date to format (can be a JS Date or Firebase Timestamp)
 * @param options - Formatting options
 * @returns Formatted date string or 'N/A' or 'Invalid Date'
 */
export const formatTime = (
  date: DateInput,
  options: TimeFormatOptions = {},
): string => {
  const { includeDate = false, forTextReport = false } = options;

  if (!date) return "N/A";

  // Convert Firebase Timestamp to JS Date if necessary
  const dateObj =
    date instanceof Date
      ? date
      : date && typeof (date as Timestamp).toDate === "function"
        ? (date as Timestamp).toDate()
        : null;

  if (!dateObj || isNaN(dateObj.getTime())) return "Invalid Date";

  if (forTextReport) {
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const day = dateObj.getDate().toString().padStart(2, "0");
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const seconds = dateObj.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  if (includeDate) {
    return dateObj.toLocaleString("en-US", {
      ...timeOptions,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return dateObj.toLocaleTimeString("en-US", timeOptions);
};
