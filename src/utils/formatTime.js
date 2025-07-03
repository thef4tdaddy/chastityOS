import { safeToDate } from './safeToDate';
export function formatTime(input) {
  const safeInput = safeToDate(input);
  if (safeInput == null) return "Invalid Date";
  // Firestore Timestamp detection (has .seconds property)
  if (typeof safeInput === "object") {
    if (safeInput instanceof Date) {
      return safeInput.toLocaleString();
    } else if (typeof safeInput.seconds === "number") {
      const date = new Date(safeInput.seconds * 1000);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString();
    } else {
      return "Invalid Date";
    }
  } else if (typeof safeInput === "number" && isFinite(safeInput)) {
    let seconds = Math.floor(safeInput);
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  } else if (typeof safeInput === "string") {
    // Try to parse as number of seconds
    const n = Number(safeInput);
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
