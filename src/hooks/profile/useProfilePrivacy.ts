/**
 * useProfilePrivacy Hook
 * Handles privacy settings management for profiles
 */

import { useMemo } from "react";
import type { PublicProfile } from "./usePublicProfile";

export const useProfilePrivacy = (
  profile: PublicProfile | null,
  isOwnProfile: boolean,
) => {
  const isPublicProfile = profile?.isPublic ?? false;
  const canViewProfile = useMemo(() => {
    return isPublicProfile || isOwnProfile;
  }, [isPublicProfile, isOwnProfile]);

  const canViewStatistics = useMemo(() => {
    return canViewProfile && profile?.shareStatistics;
  }, [canViewProfile, profile?.shareStatistics]);

  const privacyStatus = useMemo(() => {
    if (!profile) return "not-found";
    if (!isPublicProfile && !isOwnProfile) return "private";
    return "accessible";
  }, [profile, isPublicProfile, isOwnProfile]);

  return {
    isPublicProfile,
    canViewProfile,
    canViewStatistics,
    privacyStatus,
  };
};
