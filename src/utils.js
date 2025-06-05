// src/utils.js

/**
 * Formats a Date object or Firebase Timestamp into a readable string.
 * @param {Date | Object} date - The date to format (can be a JS Date or Firebase Timestamp).
 * @param {boolean} includeDate - Whether to include the date part (YYYY-MM-DD).
 * @param {boolean} forTextReport - Whether to format for a plain text report (YYYY-MM-DD HH:MM:SS).
 * @returns {string} Formatted date string or 'N/A' or 'Invalid Date'.
 */
export const formatTime = (date, includeDate = false, forTextReport = false) => {
  if (!date) return 'N/A';
  // Convert Firebase Timestamp to JS Date if necessary
  const dateObj = date instanceof Date ? date : (date && typeof date.toDate === 'function' ? date.toDate() : null);
  
  if (!dateObj || isNaN(dateObj.getTime())) return 'Invalid Date';
  
  if (forTextReport) {
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
  if (includeDate) {
      return dateObj.toLocaleString('en-US', { ...timeOptions, year: 'numeric', month: '2-digit', day: '2-digit'});
  }
  return dateObj.toLocaleTimeString('en-US', timeOptions);
};

/**
 * Formats a duration in seconds into a string including days, hours, minutes, and seconds.
 * @param {number} totalSeconds - The duration in seconds.
 * @returns {string} Formatted time string (e.g., "1d 05h 30m 15s" or "12h 00m 00s").
 */
export const formatElapsedTime = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) return '00h 00m 00s'; // Default for invalid or zero input

  const days = Math.floor(totalSeconds / (3600 * 24));
  const remainingSecondsAfterDays = totalSeconds % (3600 * 24);
  const hours = Math.floor(remainingSecondsAfterDays / 3600);
  const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;
  const minutes = Math.floor(remainingSecondsAfterHours / 60);
  const seconds = Math.floor(remainingSecondsAfterHours % 60);
  const pad = (num) => num.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
};

/**
 * Array of predefined event types for logging.
 */
// Updated to include "Session Edit"
export const EVENT_TYPES = ["Orgasm (Self)", "Orgasm (Partner)", "Ruined Orgasm", "Edging", "Tease & Denial", "Play Session", "Hygiene", "Medication", "Mood Entry", "Session Edit"]; 

/**
 * Helper function to pad a string to a certain length.
 * (This is primarily used for the ASCII text report, but can be a general utility)
 * @param {string | number} str - The string or number to pad.
 * @param {number} length - The target length.
 * @param {boolean} alignRight - Whether to align the string to the right.
 * @returns {string} The padded string.
 */
export const padString = (str, length, alignRight = false) => {
    const s = String(str === null || str === undefined ? '' : str);
    if (s.length >= length) return s.substring(0, length);
    const padding = ' '.repeat(length - s.length);
    return alignRight ? padding + s : s + padding;
};