/**
 * Form validation utilities for personal goal creation
 */

export interface PinValidationResult {
  isValid: boolean;
  error?: string;
}

export interface HardcoreModeValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validate emergency PIN requirements
 */
export const validateEmergencyPin = (
  pin: string,
  confirmPin: string,
): PinValidationResult => {
  if (!pin || pin.length < 4) {
    return {
      isValid: false,
      error: "Emergency PIN must be at least 4 characters",
    };
  }

  if (pin !== confirmPin) {
    return {
      isValid: false,
      error: "PINs do not match",
    };
  }

  return { isValid: true };
};

/**
 * Validate hardcore mode requirements
 */
export const validateHardcoreMode = (
  hasEmergencyPin: boolean,
  emergencyPinInput: string,
  confirmEmergencyPin: string,
  saveLockCombination: boolean,
  isSignedInWithGoogle: boolean,
): HardcoreModeValidation => {
  // If user doesn't have emergency PIN, they must set one
  if (!hasEmergencyPin) {
    const pinValidation = validateEmergencyPin(
      emergencyPinInput,
      confirmEmergencyPin,
    );
    if (!pinValidation.isValid) {
      return pinValidation;
    }
  }

  // If saving lock combination, require Google sign-in
  if (saveLockCombination && !isSignedInWithGoogle) {
    return {
      isValid: false,
      error:
        "Google sign-in required to save lock combinations. Please sign in with Google first.",
    };
  }

  return { isValid: true };
};

/**
 * Calculate total seconds from days and hours
 */
export const calculateTotalSeconds = (days: number, hours: number): number => {
  return days * 86400 + hours * 3600;
};

/**
 * Validate goal form inputs
 */
export const validateGoalForm = (
  title: string,
  days: number,
  hours: number,
): { isValid: boolean; error?: string } => {
  if (!title.trim()) {
    return { isValid: false, error: "Title is required" };
  }

  const totalSeconds = calculateTotalSeconds(days, hours);
  if (totalSeconds <= 0) {
    return { isValid: false, error: "Duration must be greater than 0" };
  }

  return { isValid: true };
};
