/**
 * Emergency PIN validation utilities
 */

export interface PinValidationParams {
  userId: string;
  pin: string;
  attemptCount: number;
  validatePin: (params: { userId: string; pin: string }) => Promise<boolean>;
  onSuccess: () => Promise<void>;
  onFailure: (error: string, attempts: number) => void;
  onMaxAttempts: () => void;
}

/**
 * Validate emergency PIN and handle attempts
 */
export const validateEmergencyPinAttempt = async ({
  userId,
  pin,
  attemptCount,
  validatePin,
  onSuccess,
  onFailure,
  onMaxAttempts,
}: PinValidationParams): Promise<boolean> => {
  if (!userId || !pin) return false;

  try {
    const isValid = await validatePin({ userId, pin });

    if (!isValid) {
      const newAttemptCount = attemptCount + 1;
      onFailure(`Invalid PIN. Attempt ${newAttemptCount}/5`, newAttemptCount);

      if (newAttemptCount >= 5) {
        onMaxAttempts();
      }
      return false;
    }

    await onSuccess();
    return true;
  } catch {
    onFailure("Failed to validate PIN. Please try again.", attemptCount);
    return false;
  }
};

/**
 * Handle lock combination retrieval
 */
export const retrieveLockCombination = async (
  fetchCombination: () => Promise<{ data: string | null }>,
): Promise<string | null> => {
  try {
    const { data: combination } = await fetchCombination();
    return combination;
  } catch {
    return null;
  }
};
