/**
 * Formats a time value as HH:MM:SS. Accepts Date, Firestore Timestamp,
 * number (seconds), or string (parseable as time/seconds).
 * Returns '00:00:00' if input is invalid.
 */
export function formatTime(input) {
  let seconds = 0;
  if (input == null) return "00:00:00";
  // Firestore Timestamp detection (has .seconds property)
  if (typeof input === "object") {
    if (input instanceof Date) {
      seconds = Math.floor(input.getTime() / 1000);
    } else if (typeof input.seconds === "number") {
      seconds = input.seconds;
    } else {
      return "00:00:00";
    }
  } else if (typeof input === "number" && isFinite(input)) {
    seconds = Math.floor(input);
  } else if (typeof input === "string") {
    // Try to parse as number of seconds
    const n = Number(input);
    if (!isNaN(n) && isFinite(n)) {
      seconds = Math.floor(n);
    } else {
      return "00:00:00";
    }
  } else {
    return "00:00:00";
  }
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
