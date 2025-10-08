/**
 * Settings Validation Utilities
 * Validates user settings inputs before saving to database
 */

import { TimezoneUtil } from "@/utils/timezone";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateSettings = {
  /**
   * Validate submissive name
   * Must be 2-50 characters long
   */
  submissiveName: (name: string): ValidationResult => {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: "Submissive name cannot be empty" };
    }
    if (name.length < 2) {
      return {
        valid: false,
        error: "Submissive name must be at least 2 characters",
      };
    }
    if (name.length > 50) {
      return {
        valid: false,
        error: "Submissive name must be at most 50 characters",
      };
    }
    return { valid: true };
  },

  /**
   * Validate display name
   * Must be 2-50 characters long
   */
  displayName: (name: string): ValidationResult => {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: "Display name cannot be empty" };
    }
    if (name.length < 2) {
      return {
        valid: false,
        error: "Display name must be at least 2 characters",
      };
    }
    if (name.length > 50) {
      return {
        valid: false,
        error: "Display name must be at most 50 characters",
      };
    }
    return { valid: true };
  },

  /**
   * Validate timezone string
   * Must be a valid IANA timezone
   */
  timezone: (tz: string): ValidationResult => {
    if (!tz || tz.trim().length === 0) {
      return { valid: false, error: "Timezone cannot be empty" };
    }
    if (!TimezoneUtil.isValidTimezone(tz)) {
      return { valid: false, error: "Invalid timezone" };
    }
    return { valid: true };
  },

  /**
   * Validate bio text
   * Must be at most 500 characters
   */
  bio: (bio: string): ValidationResult => {
    if (bio && bio.length > 500) {
      return {
        valid: false,
        error: "Bio must be at most 500 characters",
      };
    }
    return { valid: true };
  },

  /**
   * Validate profile image URL
   * Must be a valid URL
   */
  profileImageUrl: (url: string): ValidationResult => {
    if (!url || url.trim().length === 0) {
      return { valid: true }; // Empty URL is valid
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL format" };
    }
  },

  /**
   * Validate email address
   * Basic email format validation
   */
  email: (email: string): ValidationResult => {
    if (!email || email.trim().length === 0) {
      return { valid: false, error: "Email cannot be empty" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Invalid email format" };
    }

    return { valid: true };
  },

  /**
   * Validate language code
   * Must be a valid ISO 639-1 language code
   */
  language: (lang: string): ValidationResult => {
    if (!lang || lang.trim().length === 0) {
      return { valid: false, error: "Language cannot be empty" };
    }

    // Basic validation for common language codes
    const validLanguages = [
      "en",
      "es",
      "fr",
      "de",
      "it",
      "pt",
      "ru",
      "zh",
      "ja",
      "ko",
    ];
    if (!validLanguages.includes(lang.toLowerCase())) {
      return { valid: false, error: "Invalid language code" };
    }

    return { valid: true };
  },

  /**
   * Validate session timeout
   * Must be between 5 and 120 minutes
   */
  sessionTimeout: (timeout: number): ValidationResult => {
    if (timeout < 5) {
      return {
        valid: false,
        error: "Session timeout must be at least 5 minutes",
      };
    }
    if (timeout > 120) {
      return {
        valid: false,
        error: "Session timeout must be at most 120 minutes",
      };
    }
    return { valid: true };
  },

  /**
   * Validate data retention period
   * Must be between 30 and 3650 days (10 years)
   */
  dataRetention: (days: number): ValidationResult => {
    if (days < 30) {
      return {
        valid: false,
        error: "Data retention must be at least 30 days",
      };
    }
    if (days > 3650) {
      return {
        valid: false,
        error: "Data retention must be at most 10 years",
      };
    }
    return { valid: true };
  },
};

/**
 * Validate account settings data
 */
export const validateAccountSettings = (data: {
  submissiveName?: string;
  displayName?: string;
}): ValidationResult => {
  if (data.submissiveName !== undefined) {
    const result = validateSettings.submissiveName(data.submissiveName);
    if (!result.valid) return result;
  }

  if (data.displayName !== undefined) {
    const result = validateSettings.displayName(data.displayName);
    if (!result.valid) return result;
  }

  return { valid: true };
};

/**
 * Validate display settings data
 */
export const validateDisplaySettings = (data: {
  timezone?: string;
  language?: string;
}): ValidationResult => {
  if (data.timezone !== undefined) {
    const result = validateSettings.timezone(data.timezone);
    if (!result.valid) return result;
  }

  if (data.language !== undefined) {
    const result = validateSettings.language(data.language);
    if (!result.valid) return result;
  }

  return { valid: true };
};

/**
 * Validate profile settings data
 */
export const validateProfileSettings = (data: {
  bio?: string;
  profileImageUrl?: string;
}): ValidationResult => {
  if (data.bio !== undefined) {
    const result = validateSettings.bio(data.bio);
    if (!result.valid) return result;
  }

  if (data.profileImageUrl !== undefined) {
    const result = validateSettings.profileImageUrl(data.profileImageUrl);
    if (!result.valid) return result;
  }

  return { valid: true };
};
