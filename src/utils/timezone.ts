/**
 * Timezone Utilities
 * Handles timezone conversion and formatting for user's local timezone
 */

import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { DBSettings } from "@/types/database";
import { logger } from "./logging";

export class TimezoneUtil {
  /**
   * Format a date in the user's timezone
   * @param date Date to format
   * @param userTimezone User's IANA timezone (e.g., 'America/New_York')
   * @param formatString Date format string (default: 'PPpp' - localized date and time)
   * @returns Formatted date string in user's timezone
   */
  static formatInUserTimezone(
    date: Date,
    userTimezone: string,
    formatString: string = "PPpp",
  ): string {
    try {
      const zonedDate = toZonedTime(date, userTimezone);
      return format(zonedDate, formatString);
    } catch (error) {
      logger.error("Failed to format date in timezone", {
        error,
        timezone: userTimezone,
      });
      // Fallback to local formatting
      return format(date, formatString);
    }
  }

  /**
   * Get the user's timezone from settings, fallback to browser timezone
   * @param settings User settings object
   * @returns IANA timezone string
   */
  static getUserTimezone(settings: DBSettings | null | undefined): string {
    // Priority: flat timezone > display.timezone > browser timezone
    if (settings?.timezone) {
      return settings.timezone;
    }
    if (settings?.display?.timezone) {
      return settings.display.timezone;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Convert a date to the user's timezone
   * @param date Date to convert
   * @param userTimezone User's IANA timezone
   * @returns Date object adjusted to user's timezone
   */
  static convertToUserTimezone(date: Date, userTimezone: string): Date {
    try {
      return toZonedTime(date, userTimezone);
    } catch (error) {
      logger.error("Failed to convert to user timezone", {
        error,
        timezone: userTimezone,
      });
      return date;
    }
  }

  /**
   * Convert a date from user's timezone to UTC
   * @param date Date in user's timezone
   * @param userTimezone User's IANA timezone
   * @returns Date object in UTC
   */
  static convertFromUserTimezone(date: Date, userTimezone: string): Date {
    try {
      return fromZonedTime(date, userTimezone);
    } catch (error) {
      logger.error("Failed to convert from user timezone", {
        error,
        timezone: userTimezone,
      });
      return date;
    }
  }

  /**
   * Validate if a timezone string is valid
   * @param timezone IANA timezone string to validate
   * @returns true if valid, false otherwise
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a list of common timezones
   * @returns Array of timezone objects with label and value
   */
  static getCommonTimezones(): Array<{ label: string; value: string }> {
    return [
      { label: "Pacific Time (US)", value: "America/Los_Angeles" },
      { label: "Mountain Time (US)", value: "America/Denver" },
      { label: "Central Time (US)", value: "America/Chicago" },
      { label: "Eastern Time (US)", value: "America/New_York" },
      { label: "Alaska Time (US)", value: "America/Anchorage" },
      { label: "Hawaii Time (US)", value: "Pacific/Honolulu" },
      { label: "London (UK)", value: "Europe/London" },
      { label: "Paris (France)", value: "Europe/Paris" },
      { label: "Berlin (Germany)", value: "Europe/Berlin" },
      { label: "Moscow (Russia)", value: "Europe/Moscow" },
      { label: "Dubai (UAE)", value: "Asia/Dubai" },
      { label: "Mumbai (India)", value: "Asia/Kolkata" },
      { label: "Singapore", value: "Asia/Singapore" },
      { label: "Hong Kong", value: "Asia/Hong_Kong" },
      { label: "Tokyo (Japan)", value: "Asia/Tokyo" },
      { label: "Sydney (Australia)", value: "Australia/Sydney" },
      { label: "Auckland (New Zealand)", value: "Pacific/Auckland" },
    ];
  }

  /**
   * Get timezone offset in hours
   * @param timezone IANA timezone string
   * @returns Offset in hours (e.g., -5 for EST, +1 for CET)
   */
  static getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const zonedDate = toZonedTime(now, timezone);
      const offset = (zonedDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return offset;
    } catch {
      return 0;
    }
  }
}
