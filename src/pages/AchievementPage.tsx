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
} from "../components/achievements";
import LeaderboardView from "../components/achievements/LeaderboardView";
import AchievementPrivacySettings from "../components/achievements/AchievementPrivacySettings";
import { FaTrophy, FaList, FaChartBar, FaUsers, FaCog } from "../utils/iconImport";

type ViewMode = "dashboard" | "gallery" | "leaderboards" | "privacy";

export const AchievementPage: React.FC = () => {
  const { user } = useAuthState();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  const {
    allAchievements,
    getAchievementsWithProgress,
    toggleAchievementVisibility,
    isLoading,
  } = useAchievements(user?.uid);

  if (!user) {
    return (
      <div className="text-nightly-spring-green">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FaTrophy className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
            <div className="text-nightly-celadon">
              Please sign in to view achievements
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-nightly-spring-green">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-nightly-aquamarine border-t-transparent rounded-full mb-4 mx-auto"></div>
            <div className="text-nightly-celadon">Loading achievements...</div>
          </div>
        </div>
      </div>
    );
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

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("dashboard")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === "dashboard"
                  ? "bg-nightly-aquamarine text-black font-semibold"
                  : "text-nightly-celadon hover:text-nightly-honeydew"
              }`}
            >
              <FaChartBar />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode("gallery")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === "gallery"
                  ? "bg-nightly-aquamarine text-black font-semibold"
                  : "text-nightly-celadon hover:text-nightly-honeydew"
              }`}
            >
              <FaList />
              <span>Gallery</span>
            </button>
            <button
              onClick={() => setViewMode("leaderboards")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === "leaderboards"
                  ? "bg-nightly-aquamarine text-black font-semibold"
                  : "text-nightly-celadon hover:text-nightly-honeydew"
              }`}
            >
              <FaUsers />
              <span>Leaderboards</span>
            </button>
            <button
              onClick={() => setViewMode("privacy")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === "privacy"
                  ? "bg-nightly-aquamarine text-black font-semibold"
                  : "text-nightly-celadon hover:text-nightly-honeydew"
              }`}
            >
              <FaCog />
              <span>Privacy</span>
            </button>
          </div>
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
          <AchievementPrivacySettings onClose={() => setViewMode("dashboard")} />
        )}
      </div>
    </div>
  );
};

export default AchievementPage;
