/**
 * usePublicProfile Hook
 * Handles profile data fetching and management for public profiles
 */

import { useState, useEffect } from "react";
import { logger } from "../../utils/logging";
import type { User } from "../../types";

// Profile interface - keeping from original
export interface PublicProfile {
  username: string;
  displayName: string;
  bio: string;
  joinDate: Date;
  isPublic: boolean;
  shareStatistics: boolean;
  stats: {
    totalSessions: number;
    longestSession: number; // in seconds
    totalChastityTime: number; // in seconds
    streakDays: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earnedDate: Date;
    icon: string;
  }>;
  recentAchievements: Array<{
    id: string;
    title: string;
    date: Date;
    type: "milestone" | "streak" | "goal";
  }>;
}

// Mock profile data - in real app would come from API
const mockProfile: PublicProfile = {
  username: "dedication_seeker",
  displayName: "Alex Thompson",
  bio: "On a journey of self-discipline and personal growth. Exploring the intersection of mindfulness and commitment. Always looking to improve and support others on similar paths.",
  joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
  isPublic: true,
  shareStatistics: true,
  stats: {
    totalSessions: 47,
    longestSession: 15 * 24 * 60 * 60, // 15 days in seconds
    totalChastityTime: 180 * 24 * 60 * 60, // 180 days total
    streakDays: 12,
  },
  badges: [
    {
      id: "1",
      name: "First Week",
      description: "Completed your first 7-day session",
      earnedDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      icon: "🎯",
    },
    {
      id: "2",
      name: "Dedication",
      description: "Reached 30 total sessions",
      earnedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      icon: "💪",
    },
    {
      id: "3",
      name: "Consistency",
      description: "Maintained a 10-day streak",
      earnedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      icon: "🔥",
    },
  ],
  recentAchievements: [
    {
      id: "1",
      title: "Completed 2-week session",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      type: "milestone",
    },
    {
      id: "2",
      title: "12-day streak achieved",
      date: new Date(),
      type: "streak",
    },
  ],
};

export const usePublicProfile = (username?: string, currentUser?: User) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Simulate API call to fetch profile
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setProfile(mockProfile);

        // Check if this is the user's own profile
        if (
          currentUser &&
          username === currentUser.displayName?.toLowerCase().replace(" ", "_")
        ) {
          setIsOwnProfile(true);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        logger.error("Error fetching profile:", err, "usePublicProfile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  return {
    profile,
    loading,
    error,
    isOwnProfile,
  };
};
