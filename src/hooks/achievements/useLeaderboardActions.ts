import { useState } from "react";
import { useLeaderboards } from "../useLeaderboards";
import { LeaderboardCategory, LeaderboardPeriod } from "../../types";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useLeaderboardActions");

// Custom hook for leaderboard actions and state management
export const useLeaderboardActions = (
  userId?: string,
  initialCategory: LeaderboardCategory = LeaderboardCategory.TOTAL_POINTS,
  initialPeriod: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [isOptedIn, setIsOptedIn] = useState(false);

  const {
    leaderboardData,
    userRank,
    isLoading,
    error,
    optInToLeaderboards,
    optOutFromLeaderboards,
  } = useLeaderboards(userId, selectedCategory, selectedPeriod);

  // Handle opt-in to leaderboards
  const handleOptIn = async () => {
    if (userId) {
      try {
        await optInToLeaderboards();
        setIsOptedIn(true);
      } catch (error) {
        logger.error("Failed to opt in to leaderboards", { error });
        throw error; // Re-throw to allow UI error handling
      }
    }
  };

  // Handle opt-out from leaderboards
  const handleOptOut = async () => {
    if (userId) {
      try {
        await optOutFromLeaderboards();
        setIsOptedIn(false);
      } catch (error) {
        logger.error("Failed to opt out from leaderboards", { error });
        throw error; // Re-throw to allow UI error handling
      }
    }
  };

  // Handle category change
  const handleCategoryChange = (category: LeaderboardCategory) => {
    setSelectedCategory(category);
  };

  // Handle period change
  const handlePeriodChange = (period: LeaderboardPeriod) => {
    setSelectedPeriod(period);
  };

  // Skip opt-in prompt (set as opted in without actually opting in)
  const handleSkipOptIn = () => {
    setIsOptedIn(true);
  };

  return {
    // Leaderboard data
    leaderboardData,
    userRank,
    isLoading,
    error,

    // Filter state
    selectedCategory,
    selectedPeriod,

    // Participation state
    isOptedIn,

    // Actions
    handleOptIn,
    handleOptOut,
    handleSkipOptIn,
    handleCategoryChange,
    handlePeriodChange,

    // Helper for updating participation status
    setOptedIn: setIsOptedIn,
  };
};
