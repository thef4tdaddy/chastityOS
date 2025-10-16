/**
 * String manipulation helper utilities
 */

/**
 * Helper function to pad a string to a certain length.
 * (This is primarily used for the ASCII text report, but can be a general utility)
 * @param str - The string or number to pad
 * @param length - The target length
 * @param alignRight - Whether to align the string to the right
 * @returns The padded string
 */
export const padString = (
  str: string | number | null | undefined,
  length: number,
  alignRight = false,
): string => {
  const s = String(str === null || str === undefined ? "" : str);
  if (s.length >= length) return s.substring(0, length);
  const padding = " ".repeat(length - s.length);
  return alignRight ? padding + s : s + padding;
};

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Converts a string to title case
 */
export const toTitleCase = (str: string): string => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
};

/**
 * Truncates a string to a maximum length with ellipsis
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
};
