/**
 * Profile Achievements Utilities
 * Helper functions for achievement styling and formatting
 */

export const getTypeStyles = (type: string): string => {
  switch (type) {
    case "milestone":
      return "bg-nightly-aquamarine/20 text-nightly-aquamarine";
    case "streak":
      return "bg-red-400/20 text-red-400";
    case "goal":
      return "bg-nightly-lavender-floral/20 text-nightly-lavender-floral";
    default:
      return "bg-gray-400/20 text-gray-400";
  }
};
