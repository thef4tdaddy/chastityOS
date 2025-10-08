/**
 * useTimezone Hook
 * Provides timezone-aware date formatting based on user settings
 */

import { useCallback, useMemo } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { useUserSettings } from "@/hooks/api/useSettings";
import { TimezoneUtil } from "@/utils/timezone";

export const useTimezone = () => {
  const { user } = useAuthState();
  const { data: settings } = useUserSettings(user?.uid || "");

  // Get the user's timezone, with fallback to browser timezone
  const timezone = useMemo(
    () => TimezoneUtil.getUserTimezone(settings),
    [settings],
  );

  /**
   * Format a date in the user's timezone
   * @param date Date to format
   * @param formatString Optional date-fns format string (default: 'PPpp')
   * @returns Formatted date string in user's timezone
   */
  const formatDate = useCallback(
    (date: Date, formatString?: string) => {
      return TimezoneUtil.formatInUserTimezone(date, timezone, formatString);
    },
    [timezone],
  );

  /**
   * Convert a date to the user's timezone
   * @param date Date to convert
   * @returns Date object adjusted to user's timezone
   */
  const convertToUserTimezone = useCallback(
    (date: Date) => {
      return TimezoneUtil.convertToUserTimezone(date, timezone);
    },
    [timezone],
  );

  /**
   * Convert a date from user's timezone to UTC
   * @param date Date in user's timezone
   * @returns Date object in UTC
   */
  const convertFromUserTimezone = useCallback(
    (date: Date) => {
      return TimezoneUtil.convertFromUserTimezone(date, timezone);
    },
    [timezone],
  );

  return {
    timezone,
    formatDate,
    convertToUserTimezone,
    convertFromUserTimezone,
  };
};
