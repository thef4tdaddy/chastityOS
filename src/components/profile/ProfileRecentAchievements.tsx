/**
 * ProfileRecentAchievements Component
 * Displays recent achievements - pure presentation component
 */

import React from "react";
import { FaCalendar } from "../../utils/iconImport";
import type { ProfileAchievement } from "../../hooks/profile/useProfileAchievements";

interface ProfileRecentAchievementsProps {
  recentAchievements: ProfileAchievement[];
  isLoading: boolean;
  isOwnProfile: boolean;
  getTypeStyles: (type: string) => string;
}

const ProfileRecentAchievements: React.FC<ProfileRecentAchievementsProps> = ({
  recentAchievements,
  isLoading,
  isOwnProfile,
  getTypeStyles,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaCalendar className="text-nightly-spring-green" />
          <h2 className="text-xl font-semibold text-nightly-honeydew">
            Recent Achievements
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaCalendar className="text-nightly-spring-green" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Recent Achievements
        </h2>
        {recentAchievements.length > 0 && (
          <span className="text-sm text-nightly-celadon">
            ({recentAchievements.length})
          </span>
        )}
      </div>

      {recentAchievements.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-nightly-celadon">
            {isOwnProfile
              ? "No recent achievements"
              : "No recent public achievements"}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recentAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center justify-between bg-white/5 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <div className="text-nightly-honeydew font-medium">
                    {achievement.title}
                  </div>
                  <div className="text-xs text-nightly-celadon/70">
                    {achievement.date.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded ${getTypeStyles(achievement.type)}`}
              >
                {achievement.type.charAt(0).toUpperCase() +
                  achievement.type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileRecentAchievements;
