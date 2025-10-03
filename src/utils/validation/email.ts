/**
 * Email validation utilities
 */
export const validateEmail = (email: string): string[] => {
  const errors: string[] = [];
  if (!email.trim()) {
    errors.push("Email is required");
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push("Email format is invalid");
  }
  return errors;
};
