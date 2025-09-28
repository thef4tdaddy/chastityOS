/**
 * ProfileAchievements Component
 * Displays achievement grid - pure presentation component
 */

import React from "react";
import { FaTrophy } from "../../utils/iconImport";
import type { ProfileBadge } from "../../hooks/profile/useProfileAchievements";

interface ProfileAchievementsProps {
  badges: ProfileBadge[];
  isLoading: boolean;
  isOwnProfile: boolean;
}

const ProfileAchievements: React.FC<ProfileAchievementsProps> = ({
  badges,
  isLoading,
  isOwnProfile,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <FaTrophy className="text-nightly-lavender-floral" />
          <h2 className="text-xl font-semibold text-nightly-honeydew">
            Badges
          </h2>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4 h-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaTrophy className="text-nightly-lavender-floral" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">Badges</h2>
        {badges.length > 0 && (
          <span className="text-sm text-nightly-celadon">
            ({badges.length})
          </span>
        )}
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-nightly-celadon">
            {isOwnProfile
              ? "No badges earned yet"
              : "No public badges to display"}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white/5 rounded-lg p-4 flex items-center gap-4"
            >
              <div className="text-2xl">{badge.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium text-nightly-honeydew">
                  {badge.name}
                </h3>
                <p className="text-sm text-nightly-celadon mb-1">
                  {badge.description}
                </p>
                <div className="text-xs text-nightly-celadon/70">
                  Earned {badge.earnedDate.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileAchievements;
