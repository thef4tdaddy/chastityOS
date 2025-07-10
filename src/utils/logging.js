/**
 * A simple console logger utility to standardize log messages.
 * It provides different levels for info, warnings, and errors.
 */
export const log = {
  /**
   * Logs informational messages to the console.
   * @param {...any} args - The messages or objects to log.
   */
  info: (...args) => {
    console.log('[INFO]', ...args);
  },

  /**
   * Logs warning messages to the console.
   * @param {...any} args - The messages or objects to log.
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Logs error messages to the console.
   * @param {...any} args - The messages or objects to log.
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
};
