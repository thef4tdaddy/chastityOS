/**
 * Divider Component
 * Visual separator between content sections
 */
import React from "react";

export interface DividerProps {
  /**
   * Divider orientation
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Label to display in the divider
   */
  label?: string;
  /**
   * Label position
   * @default 'center'
   */
  labelPosition?: "left" | "center" | "right";
  /**
   * Divider style
   * @default 'solid'
   */
  variant?: "solid" | "dashed" | "dotted";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Divider Component
 *
 * A visual separator to divide content sections.
 *
 * @example
 * ```tsx
 * <Divider />
 *
 * <Divider label="OR" />
 *
 * <Divider label="Section Title" labelPosition="left" />
 *
 * <Divider orientation="vertical" />
 * ```
 */
export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  label,
  labelPosition = "center",
  variant = "solid",
  className = "",
}) => {
  // Variant styles
  const variantClasses = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  if (orientation === "vertical") {
    return (
      <div
        className={`
          inline-block
          h-full
          min-h-[1rem]
          border-l
          ${variantClasses[variant]}
          border-gray-300
          dark:border-gray-600
          ${className}
        `
          .trim()
          .replace(/\s+/g, " ")}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // Horizontal divider without label
  if (!label) {
    return (
      <hr
        className={`
          border-t
          ${variantClasses[variant]}
          border-gray-300
          dark:border-gray-600
          ${className}
        `
          .trim()
          .replace(/\s+/g, " ")}
        role="separator"
      />
    );
  }

  // Horizontal divider with label
  const labelPositionClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div
      className={`flex items-center ${labelPositionClasses[labelPosition]} ${className}`}
      role="separator"
    >
      {labelPosition !== "left" && (
        <div
          className={`
            flex-1
            border-t
            ${variantClasses[variant]}
            border-gray-300
            dark:border-gray-600
            ${labelPosition === "center" ? "mr-3" : ""}
          `
            .trim()
            .replace(/\s+/g, " ")}
        />
      )}
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3">
        {label}
      </span>
      {labelPosition !== "right" && (
        <div
          className={`
            flex-1
            border-t
            ${variantClasses[variant]}
            border-gray-300
            dark:border-gray-600
            ${labelPosition === "center" ? "ml-3" : ""}
          `
            .trim()
            .replace(/\s+/g, " ")}
        />
      )}
    </div>
  );
};

Divider.displayName = "Divider";
