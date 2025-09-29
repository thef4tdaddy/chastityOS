/**
 * Time duration formatting utilities
 */

/**
 * Formats a duration in seconds into a readable string, showing only the highest necessary time units.
 * @param totalSeconds - The duration in seconds
 * @returns Formatted time string (e.g., "1d 05h 30m 15s", "12h 00m 00s", "05m 10s", or "45s")
 */
export const formatElapsedTime = (totalSeconds: number): string => {
  if (
    totalSeconds === null ||
    totalSeconds === undefined ||
    isNaN(totalSeconds) ||
    totalSeconds < 0
  ) {
    return "0s";
  }

  if (totalSeconds < 1) {
    return `${Math.floor(totalSeconds)}s`;
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number): string => String(num).padStart(2, "0");

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (hours > 0) {
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (minutes > 0) {
    return `${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
};

/**
 * Formats a duration in seconds into a readable string showing only the number of days.
 * @param totalSeconds - The duration in seconds
 * @returns Formatted time string (e.g., "1 day", "5 days")
 */
export const formatDaysOnly = (totalSeconds: number): string => {
  if (
    totalSeconds === null ||
    totalSeconds === undefined ||
    isNaN(totalSeconds) ||
    totalSeconds < 0
  ) {
    return "0 days";
  }

  const days = Math.floor(totalSeconds / 86400);
  return `${days} day${days !== 1 ? "s" : ""}`;
};

/**
 * Converts milliseconds to seconds
 */
export const msToSeconds = (milliseconds: number): number => {
  return Math.floor(milliseconds / 1000);
};

/**
 * Converts seconds to milliseconds
 */
export const secondsToMs = (seconds: number): number => {
  return seconds * 1000;
};
