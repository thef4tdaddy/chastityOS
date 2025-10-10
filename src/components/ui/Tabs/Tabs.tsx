/**
 * Tabs Component
 * Accessible tabs component for section navigation with keyboard support
 */
import React, { useRef, useEffect } from "react";

export interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  /**
   * Currently active tab value
   */
  value: string;
  /**
   * Callback when active tab changes
   */
  onValueChange: (value: string) => void;
  /**
   * Array of tab definitions
   */
  tabs: Tab[];
  /**
   * Tab content
   */
  children: React.ReactNode;
  /**
   * Layout orientation
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Additional CSS classes for the root element
   */
  className?: string;
}

export interface TabsListProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  active: boolean;
  onSelect: (value: string) => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export interface TabsContentProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * TabsList - Container for tab triggers
 */
export const TabsList: React.FC<TabsListProps> = ({
  children,
  orientation = "horizontal",
  className = "",
}) => {
  const isVertical = orientation === "vertical";

  const baseClasses = `
    ${isVertical ? "flex flex-col space-y-2" : "flex items-center space-x-1"}
    ${isVertical ? "border-r border-white/10" : "border-b border-white/10"}
    ${isVertical ? "pr-4" : "pb-0"}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div role="tablist" aria-orientation={orientation} className={baseClasses}>
      {children}
    </div>
  );
};

/**
 * TabsTrigger - Individual tab button
 */
export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  active,
  onSelect,
  icon,
  children,
  orientation = "horizontal",
  className = "",
}) => {
  const isVertical = orientation === "vertical";
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentButton = e.currentTarget;
    const tablist = currentButton.parentElement;
    if (!tablist) return;

    const tabs = Array.from(
      tablist.querySelectorAll('[role="tab"]'),
    ) as HTMLButtonElement[];
    const currentIndex = tabs.indexOf(currentButton);

    let nextIndex = currentIndex;

    if (isVertical) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      }
    } else {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      }
    }

    if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    }
  };

  const baseClasses = `
    ${isVertical ? "w-full" : ""}
    flex items-center gap-3 px-4 py-3 rounded-lg
    font-medium text-sm transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
    ${
      active
        ? "bg-nightly-aquamarine text-black font-semibold shadow-md"
        : "text-nightly-celadon hover:bg-white/10 hover:text-nightly-honeydew"
    }
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <button
      ref={buttonRef}
      role="tab"
      aria-selected={active}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      tabIndex={active ? 0 : -1}
      onClick={() => onSelect(value)}
      onKeyDown={handleKeyDown}
      className={baseClasses}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

/**
 * TabsContent - Content panel for a tab
 */
export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  activeValue,
  children,
  className = "",
}) => {
  const isActive = value === activeValue;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={`focus:outline-none ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Tabs - Main tabs component with built-in layout
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { value: 'tab1', label: 'Tab 1', icon: <Icon /> },
 *   { value: 'tab2', label: 'Tab 2' },
 * ];
 *
 * <Tabs value={activeTab} onValueChange={setActiveTab} tabs={tabs}>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  tabs,
  children,
  orientation = "horizontal",
  className = "",
}) => {
  const isVertical = orientation === "vertical";

  // Set up initial focus
  useEffect(() => {
    const activeTab = document.getElementById(`tab-${value}`);
    if (activeTab && document.activeElement?.getAttribute("role") === "tab") {
      activeTab.focus();
    }
  }, [value]);

  const rootClasses = `
    ${isVertical ? "flex flex-col lg:flex-row" : "flex flex-col"}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const contentClasses = `
    ${isVertical ? "flex-1 lg:pl-6" : "mt-4"}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className={rootClasses}>
      <TabsList orientation={orientation}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            active={value === tab.value}
            onSelect={onValueChange}
            icon={tab.icon}
            orientation={orientation}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className={contentClasses}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement<TabsContentProps>(child)) {
            return React.cloneElement(child, { activeValue: value });
          }
          return child;
        })}
      </div>
    </div>
  );
};

// Export individual components for custom layouts
export default Tabs;
