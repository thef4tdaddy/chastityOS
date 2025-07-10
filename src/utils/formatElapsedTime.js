/**
 * Formats a total number of seconds into a human-readable string (e.g., "1d 2h 3m 4s").
 * Omits any parts that are zero.
 * @param {number} totalSeconds - The total number of seconds to format.
 * @returns {string} The formatted time string.
 */
export const formatElapsedTime = (totalSeconds) => {
  // Return "0s" if the input is not a valid number or is negative.
  if (isNaN(totalSeconds) || totalSeconds === null || totalSeconds < 0) {
    return "0s";
  }

  const secondsInt = Math.floor(totalSeconds);

  if (secondsInt === 0) {
    return "0s";
  }

  // Calculate each time component
  const days = Math.floor(secondsInt / 86400);
  const hours = Math.floor((secondsInt % 86400) / 3600);
  const minutes = Math.floor((secondsInt % 3600) / 60);
  const seconds = secondsInt % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  // Join the parts with spaces, or return "0s" if all parts were zero.
  return parts.join(' ') || "0s";
};
