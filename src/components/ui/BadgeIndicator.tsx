/**
 * BadgeIndicator Component
 * Displays a small badge count on navigation items or other UI elements
 */
import React from "react";

export interface BadgeIndicatorProps {
  count: number;
  max?: number;
  className?: string;
  show?: boolean;
}

export const BadgeIndicator: React.FC<BadgeIndicatorProps> = ({
  count,
  max = 99,
  className = "",
  show = true,
}) => {
  if (!show || count <= 0) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}
      aria-label={`${count} items`}
    >
      {displayCount}
    </span>
  );
};
