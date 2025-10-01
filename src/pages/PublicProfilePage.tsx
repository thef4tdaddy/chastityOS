import React from "react";
import { useParams } from "react-router-dom";
import { useAuthState } from "../contexts";
import {
  usePublicProfile,
  useProfileStats,
  useProfileAchievements,
  useProfilePrivacy,
  useProfileSharing,
} from "../hooks/profile";
import {
  PublicProfileHeader,
  ProfileStatistics,
  ProfileAchievements,
  ProfileRecentAchievements,
  ProfileLoadingState,
  ProfileNotFoundState,
  ProfilePrivateState,
} from "../components/profile";

// Moved all component logic to separate components and hooks

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthState();

  // Use extracted hooks
  const { profile, loading, error, isOwnProfile } = usePublicProfile(
    username,
    user || undefined,
  );
  const { statItems, isPrivate } = useProfileStats(profile);
  const {
    badges,
    recentAchievements,
    isLoading: achievementsLoading,
    getTypeStyles,
  } = useProfileAchievements(user?.uid || "", isOwnProfile);
  const { privacyStatus } = useProfilePrivacy(profile, isOwnProfile);
  const { shareProfile } = useProfileSharing(username);

  // Handle loading state
  if (loading) {
    return <ProfileLoadingState />;
  }

  // Handle error states
  if (error || !profile) {
    return <ProfileNotFoundState />;
  }

  if (privacyStatus === "private") {
    return <ProfilePrivateState />;
  }

  return (
    <div className="text-nightly-spring-green">
      <div className="p-4 max-w-4xl mx-auto">
        <PublicProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onShare={shareProfile}
        />
        <ProfileStatistics statItems={statItems} isPrivate={isPrivate} />
        <ProfileAchievements
          badges={badges}
          isLoading={achievementsLoading}
          isOwnProfile={isOwnProfile}
        />
        <ProfileRecentAchievements
          recentAchievements={recentAchievements}
          isLoading={achievementsLoading}
          isOwnProfile={isOwnProfile}
          getTypeStyles={getTypeStyles}
        />
      </div>
    </div>
  );
};

export default PublicProfilePage;
