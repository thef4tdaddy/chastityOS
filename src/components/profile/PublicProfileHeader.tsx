/**
 * PublicProfileHeader Component
 * Displays profile header and basic info - pure presentation component
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  FaCalendar,
  FaGlobe,
  FaUserPlus,
  FaShare,
} from "../../utils/iconImport";
import { Button } from "@/components/ui";
import type { PublicProfile } from "../../hooks/profile/usePublicProfile";

interface PublicProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  onShare?: () => void;
}

const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onShare,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      {/* Avatar and Basic Info */}
      <div className="flex items-start gap-6 mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-nightly-aquamarine to-nightly-lavender-floral rounded-full flex items-center justify-center text-2xl text-white font-bold">
          {profile.displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-nightly-honeydew">
              {profile.displayName}
            </h1>
            {profile.isPublic && (
              <FaGlobe
                className="text-nightly-spring-green"
                title="Public Profile"
              />
            )}
          </div>
          <div className="text-nightly-celadon mb-3">@{profile.username}</div>
          <div className="flex items-center gap-2 text-sm text-nightly-celadon/70 mb-4">
            <FaCalendar />
            <span>Joined {profile.joinDate.toLocaleDateString()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isOwnProfile && (
              <>
                <Button className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
                  <FaUserPlus />
                  Follow
                </Button>
                <Button
                  onClick={onShare}
                  className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                >
                  <FaShare />
                  Share
                </Button>
              </>
            )}
            {isOwnProfile && (
              <Link
                to="/settings?tab=profile"
                className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-nightly-celadon leading-relaxed">{profile.bio}</p>
        </div>
      )}
    </div>
  );
};

export default PublicProfileHeader;
