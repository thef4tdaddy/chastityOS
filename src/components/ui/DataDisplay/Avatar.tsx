/**
 * Avatar Component
 * Display user avatar image or initials
 */
import React from "react";

export interface AvatarProps {
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Alternative text for image
   */
  alt?: string;
  /**
   * User name (for generating initials)
   */
  name?: string;
  /**
   * Avatar size
   * @default 'md'
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /**
   * Avatar shape
   * @default 'circle'
   */
  shape?: "circle" | "square";
  /**
   * Show online status indicator
   */
  status?: "online" | "offline" | "away" | "busy";
  /**
   * Fallback icon when no image or name provided
   */
  fallback?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Size classes
const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
  "2xl": "w-20 h-20 text-2xl",
};

// Status indicator sizes
const statusSizes = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
  "2xl": "w-4 h-4",
};

// Status colors
const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500",
  busy: "bg-red-500",
};

/**
 * Generate initials from name
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Default fallback icon
 */
const DefaultFallback: React.FC = () => (
  <svg
    className="w-full h-full text-gray-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

/**
 * Avatar Component
 *
 * Display user avatars with images, initials, or fallback icons.
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" />
 *
 * <Avatar name="John Doe" status="online" />
 *
 * <Avatar name="Jane Smith" size="lg" shape="square" />
 * ```
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = "md",
  shape = "circle",
  status,
  fallback,
  className = "",
}) => {
  const [imageError, setImageError] = React.useState(false);

  const containerClasses = `
    relative
    inline-block
    ${sizeClasses[size]}
    ${shape === "circle" ? "rounded-full" : "rounded-lg"}
    overflow-hidden
    bg-gray-200
    dark:bg-gray-700
    flex
    items-center
    justify-center
    font-semibold
    text-gray-600
    dark:text-gray-300
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  // Display image if available and not errored
  const showImage = src && !imageError;

  // Display initials if name provided and no image
  const showInitials = name && !showImage;

  // Display fallback if nothing else to show
  const showFallback = !showImage && !showInitials;

  return (
    <div className={containerClasses}>
      {showImage && (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {showInitials && <span>{getInitials(name)}</span>}

      {showFallback && (fallback || <DefaultFallback />)}

      {/* Status Indicator */}
      {status && (
        <span
          className={`
            absolute
            bottom-0
            right-0
            ${statusSizes[size]}
            ${statusColors[status]}
            border-2
            border-white
            dark:border-gray-900
            rounded-full
          `
            .trim()
            .replace(/\s+/g, " ")}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

Avatar.displayName = "Avatar";
