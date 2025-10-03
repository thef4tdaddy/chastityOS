/**
 * Role validation utilities
 */
export const validateRole = (role: string): string[] => {
  const errors: string[] = [];
  if (!role) {
    errors.push("Role is required");
  }
  return errors;
};
