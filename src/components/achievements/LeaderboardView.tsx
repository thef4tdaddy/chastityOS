/**
 * Leaderboard View Component
 * Displays achievement-based leaderboards and competitive features
 */

import React from "react";
import { FaTrophy, FaUsers, FaEye, FaEyeSlash } from "../../utils/iconImport";
import { useAuthState } from "../../contexts";
import { LeaderboardCategory, LeaderboardPeriod } from "../../types";
import { useLeaderboardActions } from "../../hooks/achievements/useLeaderboardActions";
import { Button } from "@/components/ui";

export interface LeaderboardViewProps {
  category?: LeaderboardCategory;
  period?: LeaderboardPeriod;
  showOptInPrompt?: boolean;
}

// Helper functions
function getRankIcon(rank: number): string {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return `#${rank}`;
  }
}

function getCategoryLabel(category: LeaderboardCategory): string {
  switch (category) {
    case LeaderboardCategory.TOTAL_POINTS:
      return "Total Points";
    case LeaderboardCategory.ACHIEVEMENTS_EARNED:
      return "Achievements Earned";
    case LeaderboardCategory.LONGEST_STREAK:
      return "Longest Streak";
    case LeaderboardCategory.SESSION_COUNT:
      return "Session Count";
    case LeaderboardCategory.TOTAL_TIME:
      return "Total Time";
    default:
      return "Unknown";
  }
}

function getPeriodLabel(period: LeaderboardPeriod): string {
  switch (period) {
    case LeaderboardPeriod.ALL_TIME:
      return "All Time";
    case LeaderboardPeriod.THIS_YEAR:
      return "This Year";
    case LeaderboardPeriod.THIS_MONTH:
      return "This Month";
    case LeaderboardPeriod.THIS_WEEK:
      return "This Week";
    default:
      return "Unknown";
  }
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${Math.floor(seconds / 60)}m`;
  }
}

function formatValue(value: number, category: LeaderboardCategory): string {
  switch (category) {
    case LeaderboardCategory.TOTAL_TIME:
      return formatDuration(value);
    case LeaderboardCategory.LONGEST_STREAK:
      return `${value} days`;
    default:
      return value.toLocaleString();
  }
}

// Opt-in prompt component
interface OptInPromptProps {
  onOptIn: () => void;
  onSkip: () => void;
}

const OptInPrompt: React.FC<OptInPromptProps> = ({ onOptIn, onSkip }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
    <div className="text-6xl mb-6">🏆</div>
    <h2 className="text-2xl font-bold text-nightly-honeydew mb-4">
      Join the Leaderboards!
    </h2>
    <p className="text-nightly-celadon mb-6 max-w-md mx-auto">
      Compete with other users and see how your achievement progress stacks up.
      Your participation is completely optional and anonymous.
    </p>

    <div className="bg-blue-900/30 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
      <h3 className="font-semibold text-blue-300 mb-2">🔒 Privacy Features:</h3>
      <ul className="text-sm text-blue-200 space-y-1">
        <li>• Use anonymous display names</li>
        <li>• Choose which stats to share</li>
        <li>• Opt out anytime</li>
        <li>• No personal information displayed</li>
      </ul>
    </div>

    <div className="flex gap-4 justify-center">
      <Button
        onClick={onOptIn}
        className="px-6 py-3 bg-nightly-aquamarine text-black font-semibold rounded-lg hover:bg-nightly-aquamarine/80 transition-colors"
      >
        Join Leaderboards
      </Button>
      <Button
        onClick={onSkip}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
      >
        Maybe Later
      </Button>
    </div>
  </div>
);

// Loading state component
const LoadingState: React.FC = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-300 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

// Error state component
const ErrorState: React.FC = () => (
  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
    <div className="text-red-400 text-xl mb-2">⚠️</div>
    <h3 className="text-red-300 font-semibold mb-2">Leaderboard Error</h3>
    <p className="text-red-200 text-sm">
      Unable to load leaderboard data. Please try again later.
    </p>
  </div>
);

// Leaderboard filters component
interface LeaderboardFiltersProps {
  selectedCategory: LeaderboardCategory;
  selectedPeriod: LeaderboardPeriod;
  onCategoryChange: (category: LeaderboardCategory) => void;
  onPeriodChange: (period: LeaderboardPeriod) => void;
}

const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({
  selectedCategory,
  selectedPeriod,
  onCategoryChange,
  onPeriodChange,
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
    <div className="flex flex-wrap gap-4 items-center">
      <div>
        <label className="block text-sm text-nightly-celadon mb-1">
          Category
        </label>
        <Select
          value={selectedCategory}
          onChange={(e) =>
            onCategoryChange(e.target.value as LeaderboardCategory)
          }
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
        >
          <option value={LeaderboardCategory.TOTAL_POINTS}>Total Points</option>
          <option value={LeaderboardCategory.ACHIEVEMENTS_EARNED}>
            Achievements Earned
          </option>
          <option value={LeaderboardCategory.LONGEST_STREAK}>
            Longest Streak
          </option>
          <option value={LeaderboardCategory.SESSION_COUNT}>
            Session Count
          </option>
          <option value={LeaderboardCategory.TOTAL_TIME}>Total Time</option>
        </Select>
      </div>

      <div>
        <label className="block text-sm text-nightly-celadon mb-1">
          Period
        </label>
        <Select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value as LeaderboardPeriod)}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
        >
          <option value={LeaderboardPeriod.ALL_TIME}>All Time</option>
          <option value={LeaderboardPeriod.THIS_YEAR}>This Year</option>
          <option value={LeaderboardPeriod.THIS_MONTH}>This Month</option>
          <option value={LeaderboardPeriod.THIS_WEEK}>This Week</option>
        </Select>
      </div>
    </div>
  </div>
);

// User rank display component
interface UserRankProps {
  userRank: {
    rank: number;
    value: number;
    totalParticipants: number;
  };
  selectedCategory: LeaderboardCategory;
}

const UserRank: React.FC<UserRankProps> = ({ userRank, selectedCategory }) => (
  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{getRankIcon(userRank.rank)}</div>
        <div>
          <div className="font-semibold text-nightly-honeydew">Your Rank</div>
          <div className="text-sm text-nightly-celadon">
            #{userRank.rank} of {userRank.totalParticipants}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-xl text-nightly-aquamarine">
          {formatValue(userRank.value, selectedCategory)}
        </div>
        <div className="text-xs text-nightly-celadon">
          {getCategoryLabel(selectedCategory)}
        </div>
      </div>
    </div>
  </div>
);

// Leaderboard table component
interface LeaderboardTableProps {
  leaderboardData: Array<{
    id: string;
    displayName: string;
    value: number;
    isCurrentUser: boolean;
  }>;
  selectedCategory: LeaderboardCategory;
  selectedPeriod: LeaderboardPeriod;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  leaderboardData,
  selectedCategory,
  selectedPeriod,
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg">
    <div className="p-4 border-b border-white/20">
      <h3 className="font-semibold text-nightly-honeydew">
        {getCategoryLabel(selectedCategory)} - {getPeriodLabel(selectedPeriod)}
      </h3>
    </div>

    <div className="divide-y divide-white/10">
      {leaderboardData.map((entry, index) => (
        <div
          key={entry.id}
          className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${
            entry.isCurrentUser
              ? "bg-blue-900/20 border-l-4 border-blue-400"
              : ""
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="text-2xl min-w-[40px] text-center">
              {getRankIcon(index + 1)}
            </div>
            <div>
              <div className="font-semibold text-nightly-honeydew">
                {entry.displayName}
              </div>
              <div className="text-sm text-nightly-celadon">
                Rank #{index + 1}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold text-lg text-nightly-aquamarine">
              {formatValue(entry.value, selectedCategory)}
            </div>
            <div className="text-xs text-nightly-celadon">
              {getCategoryLabel(selectedCategory)}
            </div>
          </div>
        </div>
      ))}
    </div>

    {leaderboardData.length === 0 && (
      <div className="p-8 text-center text-nightly-celadon">
        <FaUsers className="text-4xl mx-auto mb-4 opacity-50" />
        <p>No participants in this leaderboard yet.</p>
        <p className="text-sm mt-2">Be the first to join!</p>
      </div>
    )}
  </div>
);

// Leaderboard header component
interface LeaderboardHeaderProps {
  isOptedIn: boolean;
  onOptIn: () => void;
  onOptOut: () => void;
}

const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({
  isOptedIn,
  onOptIn,
  onOptOut,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <FaTrophy className="text-2xl text-nightly-lavender-floral" />
      <h2 className="text-2xl font-bold text-nightly-honeydew">Leaderboards</h2>
    </div>
    <div className="flex items-center space-x-2 text-sm">
      {isOptedIn ? (
        <Button
          onClick={onOptOut}
          className="flex items-center space-x-1 text-red-400 hover:text-red-300"
        >
          <FaEyeSlash />
          <span>Opt Out</span>
        </Button>
      ) : (
        <Button
          onClick={onOptIn}
          className="flex items-center space-x-1 text-green-400 hover:text-green-300"
        >
          <FaEye />
          <span>Join</span>
        </Button>
      )}
    </div>
  </div>
);

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  category = LeaderboardCategory.TOTAL_POINTS,
  period = LeaderboardPeriod.ALL_TIME,
  showOptInPrompt = true,
}) => {
  const { user } = useAuthState();

  const {
    leaderboardData,
    userRank,
    isLoading,
    error,
    selectedCategory,
    selectedPeriod,
    isOptedIn,
    handleOptIn,
    handleOptOut,
    handleSkipOptIn,
    handleCategoryChange,
    handlePeriodChange,
  } = useLeaderboardActions(user?.uid, category, period);

  // If user hasn't opted in and prompt is enabled, show opt-in screen
  if (showOptInPrompt && !isOptedIn && user) {
    return <OptInPrompt onOptIn={handleOptIn} onSkip={handleSkipOptIn} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-6">
      <LeaderboardHeader
        isOptedIn={isOptedIn}
        onOptIn={handleOptIn}
        onOptOut={handleOptOut}
      />

      <LeaderboardFilters
        selectedCategory={selectedCategory}
        selectedPeriod={selectedPeriod}
        onCategoryChange={handleCategoryChange}
        onPeriodChange={handlePeriodChange}
      />

      {userRank && (
        <UserRank userRank={userRank} selectedCategory={selectedCategory} />
      )}

      <LeaderboardTable
        leaderboardData={leaderboardData}
        selectedCategory={selectedCategory}
        selectedPeriod={selectedPeriod}
      />
    </div>
  );
};

export default LeaderboardView;
