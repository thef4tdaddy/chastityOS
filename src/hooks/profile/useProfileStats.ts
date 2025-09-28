/**
 * useProfileStats Hook
 * Handles statistics computation and formatting for profiles
 */

import { useMemo } from "react";
import { FaChartBar, FaTrophy, FaClock, FaHeart } from "../../utils/iconImport";
import type { PublicProfile } from "./usePublicProfile";

export interface StatItem {
  label: string;
  value: string | number;
  icon: typeof FaChartBar;
  color: string;
}

export const useProfileStats = (profile: PublicProfile | null) => {
  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  const statItems: StatItem[] = useMemo(() => {
    if (!profile || !profile.shareStatistics) {
      return [];
    }

    return [
      {
        label: "Total Sessions",
        value: profile.stats.totalSessions,
        icon: FaChartBar,
        color: "text-nightly-aquamarine",
      },
      {
        label: "Longest Session",
        value: formatDuration(profile.stats.longestSession),
        icon: FaTrophy,
        color: "text-nightly-lavender-floral",
      },
      {
        label: "Total Time",
        value: formatDuration(profile.stats.totalChastityTime),
        icon: FaClock,
        color: "text-nightly-spring-green",
      },
      {
        label: "Current Streak",
        value: `${profile.stats.streakDays} days`,
        icon: FaHeart,
        color: "text-red-400",
      },
    ];
  }, [profile]);

  const isPrivate = !profile?.shareStatistics;

  return {
    statItems,
    isPrivate,
    formatDuration,
  };
};
