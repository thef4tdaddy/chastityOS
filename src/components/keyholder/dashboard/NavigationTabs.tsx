import React from "react";
import { FaEye, FaLock, FaTasks, FaCog } from "@/utils/iconImport";
import { Button } from "@/components/ui";

// Navigation Tabs Component - memoized for performance
export const NavigationTabs = React.memo<{
  selectedTab: string;
  onSetSelectedTab: (
    tab: "overview" | "sessions" | "tasks" | "settings",
  ) => void;
}>(({ selectedTab, onSetSelectedTab }) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: FaEye },
    { id: "sessions", label: "Sessions", icon: FaLock },
    { id: "tasks", label: "Tasks", icon: FaTasks },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  // Keyboard navigation for tabs
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const tabsArray = tabs.map((t) => t.id);
    let newIndex = index;

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      newIndex = index > 0 ? index - 1 : tabs.length - 1;
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      newIndex = index < tabs.length - 1 ? index + 1 : 0;
    } else if (e.key === "Home") {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    onSetSelectedTab(
      tabsArray[newIndex] as "overview" | "sessions" | "tasks" | "settings",
    );
  };

  return (
    <nav
      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 bg-black/20 rounded-lg p-2 sm:p-1 mb-4 sm:mb-6"
      role="tablist"
      aria-label="Dashboard sections"
    >
      {tabs.map((tab, index) => (
        <Button
          key={tab.id}
          onClick={() =>
            onSetSelectedTab(
              tab.id as "overview" | "sessions" | "tasks" | "settings",
            )
          }
          onKeyDown={(e) => handleKeyDown(e, index)}
          role="tab"
          id={`${tab.id}-tab`}
          aria-selected={selectedTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          tabIndex={selectedTab === tab.id ? 0 : -1}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 touch-manipulation ${
            selectedTab === tab.id
              ? "bg-nightly-lavender-floral text-white"
              : "text-nightly-celadon hover:text-nightly-honeydew hover:bg-white/5"
          }`}
        >
          <tab.icon className="flex-shrink-0" aria-hidden="true" />
          <span>{tab.label}</span>
        </Button>
      ))}
    </nav>
  );
});
NavigationTabs.displayName = "NavigationTabs";
