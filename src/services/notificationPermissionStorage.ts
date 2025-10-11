/**
 * Notification Permission Storage Service
 * Manages notification permission state in localStorage
 */

const PERMISSION_PROMPTED_KEY = "chastityos_notification_prompted";
const PERMISSION_DENIED_COUNT_KEY = "chastityos_notification_denied_count";
const PERMISSION_LAST_DENIED_KEY = "chastityos_notification_last_denied";

export class NotificationPermissionStorage {
  /**
   * Check if user has been prompted for notification permission
   */
  static hasBeenPrompted(): boolean {
    return localStorage.getItem(PERMISSION_PROMPTED_KEY) === "true";
  }

  /**
   * Mark that user has been prompted
   */
  static markAsPrompted(): void {
    localStorage.setItem(PERMISSION_PROMPTED_KEY, "true");
  }

  /**
   * Get number of times user has denied permission
   */
  static getDenialCount(): number {
    return parseInt(
      localStorage.getItem(PERMISSION_DENIED_COUNT_KEY) || "0",
      10,
    );
  }

  /**
   * Increment denial count
   */
  static incrementDenialCount(): void {
    const currentCount = this.getDenialCount();
    localStorage.setItem(PERMISSION_DENIED_COUNT_KEY, String(currentCount + 1));
  }

  /**
   * Get last denial timestamp
   */
  static getLastDenialDate(): Date | null {
    const lastDenied = localStorage.getItem(PERMISSION_LAST_DENIED_KEY);
    return lastDenied ? new Date(lastDenied) : null;
  }

  /**
   * Record denial timestamp
   */
  static recordDenial(): void {
    localStorage.setItem(PERMISSION_LAST_DENIED_KEY, new Date().toISOString());
  }

  /**
   * Reset denial tracking (called when permission is granted)
   */
  static resetDenialTracking(): void {
    localStorage.removeItem(PERMISSION_DENIED_COUNT_KEY);
    localStorage.removeItem(PERMISSION_LAST_DENIED_KEY);
  }

  /**
   * Reset all prompt state (for testing/debugging)
   */
  static resetAll(): void {
    localStorage.removeItem(PERMISSION_PROMPTED_KEY);
    localStorage.removeItem(PERMISSION_DENIED_COUNT_KEY);
    localStorage.removeItem(PERMISSION_LAST_DENIED_KEY);
  }
}

export default NotificationPermissionStorage;
