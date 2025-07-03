/**
 * Formats a time value as HH:MM:SS or locale string. Accepts Date, Firestore Timestamp,
 * number (seconds), or string (parseable as time/seconds).
 * Returns locale string for Date or Firestore Timestamp.
 * Returns 'HH:MM:SS' for numeric seconds.
 * Returns 'Invalid Date' if input is invalid.
 */
export function formatTime(safeToDate(input)) {
  if (input == null) return "Invalid Date";
  // Firestore Timestamp detection (has .seconds property)
  if (typeof input === "object") {
    if (input instanceof Date) {
      return input.toLocaleString();
    } else if (typeof input.seconds === "number") {
      const date = new Date(input.seconds * 1000);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString();
    } else {
      return "Invalid Date";
    }
  } else if (typeof input === "number" && isFinite(input)) {
    let seconds = Math.floor(input);
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  } else if (typeof input === "string") {
    // Try to parse as number of seconds
    const n = Number(input);
    if (!isNaN(n) && isFinite(n)) {
      let seconds = Math.floor(n);
      if (seconds < 0) seconds = 0;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    } else {
      return "Invalid Date";
    }
  } else {
    return "Invalid Date";
  }
}
