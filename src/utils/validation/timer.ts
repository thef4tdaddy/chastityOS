/**
 * Timer Validation Utilities
 * Validation functions for timer operations
 */
import { LiveTimer } from "../../types/realtime";

/**
 * Validate timer permissions for operations
 * Ensures only authorized users can perform operations on keyholder-controlled timers
 */
export const validateTimerPermissions = (
  timer: LiveTimer,
  userId: string,
  operation: string,
): void => {
  if (timer.isKeyholderControlled && timer.keyholderUserId !== userId) {
    throw new Error(`Only the keyholder can ${operation} this timer`);
  }
};
