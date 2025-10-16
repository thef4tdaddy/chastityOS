/**
 * EmptyState Component
 * Display when there's no content to show
 */
import React from "react";

export interface EmptyStateProps {
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Primary action button
   */
  action?: React.ReactNode;
  /**
   * Secondary action button
   */
  secondaryAction?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Default Empty State Icon
 */
const DefaultIcon: React.FC = () => (
  <svg
    className="w-16 h-16 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

/**
 * EmptyState Component
 *
 * Display an empty state when there's no content to show.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No tasks yet"
 *   description="Get started by creating your first task"
 *   action={<Button onClick={handleCreate}>Create Task</Button>}
 * />
 *
 * <EmptyState
 *   icon={<InboxIcon />}
 *   title="No messages"
 *   description="You're all caught up!"
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}) => {
  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        text-center
        py-12
        px-4
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {/* Icon */}
      <div className="mb-4">{icon || <DefaultIcon />}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = "EmptyState";
