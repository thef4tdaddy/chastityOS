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
} from "../components/achievements";
import LeaderboardView from "../components/achievements/LeaderboardView";
import AchievementPrivacySettings from "../components/achievements/AchievementPrivacySettings";
import {
  FaTrophy,
  FaChartBar,
  FaList,
  FaUsers,
  FaCog,
} from "../utils/iconImport";
import { Tabs, TabsContent } from "@/components/ui";

type ViewMode = "dashboard" | "gallery" | "leaderboards" | "privacy";

export const AchievementPage: React.FC = () => {
  const { user } = useAuthState();
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");

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

  const tabs = [
    { value: "dashboard", label: "Dashboard", icon: <FaChartBar /> },
    { value: "gallery", label: "Gallery", icon: <FaList /> },
    { value: "leaderboards", label: "Leaderboards", icon: <FaUsers /> },
    { value: "privacy", label: "Privacy", icon: <FaCog /> },
  ];

  return (
    <div className="text-nightly-spring-green">
      <div className="p-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <FaTrophy className="text-3xl text-nightly-lavender-floral" />
          <h1 className="text-3xl font-bold text-nightly-honeydew">
            Achievements
          </h1>
        </div>

        {/* Tabs Navigation and Content */}
        <Tabs
          value={viewMode}
          onValueChange={setViewMode}
          tabs={tabs}
          orientation="horizontal"
        >
          <TabsContent value="dashboard">
            <AchievementDashboard />
          </TabsContent>

          <TabsContent value="gallery">
            <AchievementGallery
              achievementsWithProgress={achievementsWithProgress}
              onToggleVisibility={toggleAchievementVisibility}
              isOwnGallery={true}
            />
          </TabsContent>

          <TabsContent value="leaderboards">
            <LeaderboardView />
          </TabsContent>

          <TabsContent value="privacy">
            <AchievementPrivacySettings
              onClose={() => setViewMode("dashboard")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AchievementPage;
