/**
 * Card Component
 * Container component for content sections
 */
import React from "react";

export interface CardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Card variant
   * @default 'default'
   */
  variant?: "default" | "bordered" | "elevated" | "glass";
  /**
   * Card padding
   * @default 'md'
   */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Make card clickable
   */
  onClick?: () => void;
  /**
   * Hover effect for clickable cards
   * @default false
   */
  hoverable?: boolean;
}

// Variant classes
const variantClasses = {
  default: "bg-white dark:bg-gray-800",
  bordered:
    "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700",
  elevated:
    "bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-200",
  glass: "glass-card",
};

// Padding classes - glass variant already has padding built in
const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const getPaddingClass = (
  padding: CardProps["padding"],
  variant: CardProps["variant"],
) => {
  // glass-card already has padding: 1.5rem built in, so use empty string as default
  if (variant === "glass" && padding === "md") {
    return "";
  }
  return paddingClasses[padding || "md"];
};

/**
 * Card Component
 *
 * A container component for grouping related content.
 *
 * @example
 * ```tsx
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </Card>
 *
 * <Card variant="bordered" padding="lg">
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 * </Card>
 *
 * <Card hoverable onClick={handleClick}>
 *   Clickable card
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      className = "",
      onClick,
      hoverable = false,
      ...props
    },
    ref,
  ) => {
    const isClickable = !!onClick;

    const cardClasses = `
      ${variantClasses[variant]}
      ${getPaddingClass(padding, variant)}
      ${variant !== "glass" ? "rounded-lg" : ""}
      ${isClickable || hoverable ? "cursor-pointer transition-all duration-200 hover:shadow-md" : ""}
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    if (isClickable) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={cardClasses}
          onClick={onClick}
          {...props}
        >
          {children}
        </button>
      );
    }

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

/**
 * CardHeader Component
 */
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`
        border-b
        border-gray-200
        dark:border-gray-700
        pb-4
        mb-4
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </div>
  );
};

CardHeader.displayName = "CardHeader";

/**
 * CardBody Component
 */
export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = "",
}) => {
  return <div className={className}>{children}</div>;
};

CardBody.displayName = "CardBody";

/**
 * CardFooter Component
 */
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`
        border-t
        border-gray-200
        dark:border-gray-700
        pt-4
        mt-4
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = "CardFooter";
