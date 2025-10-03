/**
 * Message validation utilities
 */
export const validateMessage = (message: string | undefined): string[] => {
  const errors: string[] = [];
  if (message && message.length > 500) {
    errors.push("Message cannot exceed 500 characters");
  }
  return errors;
};
