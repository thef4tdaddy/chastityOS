import React from "react";
import { Button } from "@/components/ui";
import { FaChartBar, FaList, FaUsers, FaCog } from "../../utils/iconImport";

type ViewMode = "dashboard" | "gallery" | "leaderboards" | "privacy";

interface AchievementViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const AchievementViewToggle: React.FC<AchievementViewToggleProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div
      className="flex items-center bg-white/10 rounded-lg p-1"
      role="tablist"
      aria-label="Achievement view options"
    >
      <Button
        onClick={() => onViewModeChange("dashboard")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
          viewMode === "dashboard"
            ? "bg-nightly-aquamarine text-black font-semibold"
            : "text-nightly-celadon hover:text-nightly-honeydew"
        }`}
        role="tab"
        aria-selected={viewMode === "dashboard"}
        aria-controls="achievement-view-panel"
        aria-label="Dashboard view"
      >
        <FaChartBar aria-hidden="true" />
        <span>Dashboard</span>
      </Button>
      <Button
        onClick={() => onViewModeChange("gallery")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
          viewMode === "gallery"
            ? "bg-nightly-aquamarine text-black font-semibold"
            : "text-nightly-celadon hover:text-nightly-honeydew"
        }`}
        role="tab"
        aria-selected={viewMode === "gallery"}
        aria-controls="achievement-view-panel"
        aria-label="Gallery view"
      >
        <FaList aria-hidden="true" />
        <span>Gallery</span>
      </Button>
      <Button
        onClick={() => onViewModeChange("leaderboards")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
          viewMode === "leaderboards"
            ? "bg-nightly-aquamarine text-black font-semibold"
            : "text-nightly-celadon hover:text-nightly-honeydew"
        }`}
        role="tab"
        aria-selected={viewMode === "leaderboards"}
        aria-controls="achievement-view-panel"
        aria-label="Leaderboards view"
      >
        <FaUsers aria-hidden="true" />
        <span>Leaderboards</span>
      </Button>
      <Button
        onClick={() => onViewModeChange("privacy")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
          viewMode === "privacy"
            ? "bg-nightly-aquamarine text-black font-semibold"
            : "text-nightly-celadon hover:text-nightly-honeydew"
        }`}
        role="tab"
        aria-selected={viewMode === "privacy"}
        aria-controls="achievement-view-panel"
        aria-label="Privacy settings view"
      >
        <FaCog aria-hidden="true" />
        <span>Privacy</span>
      </Button>
    </div>
  );
};
