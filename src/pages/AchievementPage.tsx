/**
 * Achievement Page
 * Dedicated page for viewing and managing achievements
 */

import React, { useState } from "react";
import { useAuthState } from "../contexts";
import { useAchievements } from "../hooks/useAchievements";
import {
  AchievementGallery,
  AchievementDashboard,
  AchievementLoadingState,
  AchievementSignInPrompt,
  AchievementViewToggle,
} from "../components/achievements";
import LeaderboardView from "../components/achievements/LeaderboardView";
import AchievementPrivacySettings from "../components/achievements/AchievementPrivacySettings";
import { FaTrophy } from "../utils/iconImport";

type ViewMode = "dashboard" | "gallery" | "leaderboards" | "privacy";

export const AchievementPage: React.FC = () => {
  const { user } = useAuthState();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  const {
    allAchievements: _allAchievements,
    getAchievementsWithProgress,
    toggleAchievementVisibility,
    isLoading,
  } = useAchievements(user?.uid);

  if (!user) {
    return <AchievementSignInPrompt />;
  }

  if (isLoading) {
    return <AchievementLoadingState />;
  }

  const achievementsWithProgress = getAchievementsWithProgress();

  return (
    <div className="text-nightly-spring-green">
      <div className="p-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaTrophy className="text-3xl text-nightly-lavender-floral" />
            <h1 className="text-3xl font-bold text-nightly-honeydew">
              Achievements
            </h1>
          </div>

          <AchievementViewToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />
        </div>

        {/* Content */}
        {viewMode === "dashboard" && <AchievementDashboard />}

        {viewMode === "gallery" && (
          <AchievementGallery
            achievementsWithProgress={achievementsWithProgress}
            onToggleVisibility={toggleAchievementVisibility}
            isOwnGallery={true}
          />
        )}

        {viewMode === "leaderboards" && <LeaderboardView />}

        {viewMode === "privacy" && (
          <AchievementPrivacySettings
            onClose={() => setViewMode("dashboard")}
          />
        )}
      </div>
    </div>
  );
};

export default AchievementPage;
