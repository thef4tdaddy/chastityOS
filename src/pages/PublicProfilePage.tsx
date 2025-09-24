import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthState } from "../contexts";
import { logger } from "../utils/logging";
import {
  FaUser,
  FaCalendar,
  FaClock,
  FaTrophy,
  FaChartBar,
  FaLock,
  FaShare,
  FaHeart,
  FaGlobe,
  FaShieldAlt,
  FaUserPlus,
} from "../utils/iconImport";

// Mock public profile data - in real app would come from API
interface PublicProfile {
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

// Mock profile data
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

// Profile Header Component
const ProfileHeader: React.FC<{
  profile: PublicProfile;
  isOwnProfile: boolean;
}> = ({ profile, isOwnProfile }) => (
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
              <button className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
                <FaUserPlus />
                Follow
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
                <FaShare />
                Share
              </button>
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

// Statistics Section
const StatisticsSection: React.FC<{ profile: PublicProfile }> = ({
  profile,
}) => {
  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  if (!profile.shareStatistics) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 text-center">
        <FaLock className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
        <div className="text-nightly-celadon">Statistics are private</div>
        <div className="text-sm text-nightly-celadon/70">
          This user has chosen to keep their statistics private
        </div>
      </div>
    );
  }

  const statItems = [
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

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaChartBar className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Statistics
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="text-center">
              <Icon className={`text-2xl mb-2 mx-auto ${item.color}`} />
              <div className="text-lg font-semibold text-nightly-honeydew mb-1">
                {item.value}
              </div>
              <div className="text-sm text-nightly-celadon">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Badges Section
const BadgesSection: React.FC<{ badges: PublicProfile["badges"] }> = ({
  badges,
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
    <div className="flex items-center gap-3 mb-6">
      <FaTrophy className="text-nightly-lavender-floral" />
      <h2 className="text-xl font-semibold text-nightly-honeydew">Badges</h2>
    </div>

    {badges.length === 0 ? (
      <div className="text-center py-4">
        <div className="text-nightly-celadon">No badges earned yet</div>
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

// Recent Achievements Section
const RecentAchievementsSection: React.FC<{
  achievements: PublicProfile["recentAchievements"];
}> = ({ achievements }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
    <div className="flex items-center gap-3 mb-6">
      <FaCalendar className="text-nightly-spring-green" />
      <h2 className="text-xl font-semibold text-nightly-honeydew">
        Recent Achievements
      </h2>
    </div>

    {achievements.length === 0 ? (
      <div className="text-center py-4">
        <div className="text-nightly-celadon">No recent achievements</div>
      </div>
    ) : (
      <div className="space-y-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-center justify-between bg-white/5 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              {achievement.type === "milestone" && (
                <FaTrophy className="text-nightly-aquamarine" />
              )}
              {achievement.type === "streak" && (
                <FaHeart className="text-red-400" />
              )}
              {achievement.type === "goal" && (
                <FaChartBar className="text-nightly-lavender-floral" />
              )}
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
              className={`px-2 py-1 text-xs rounded ${
                achievement.type === "milestone"
                  ? "bg-nightly-aquamarine/20 text-nightly-aquamarine"
                  : achievement.type === "streak"
                    ? "bg-red-400/20 text-red-400"
                    : "bg-nightly-lavender-floral/20 text-nightly-lavender-floral"
              }`}
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

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthState();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch profile
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // In real app, would fetch from API using username parameter
        // For now, using mock data
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

        setProfile(mockProfile);

        // Check if this is the user's own profile
        if (
          user &&
          username === user.displayName?.toLowerCase().replace(" ", "_")
        ) {
          setIsOwnProfile(true);
        }
      } catch (error) {
        logger.error("Error fetching profile:", error, "PublicProfilePage");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, user]);

  if (loading) {
    return (
      <div className="text-nightly-spring-green">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-nightly-aquamarine border-t-transparent rounded-full mb-4 mx-auto"></div>
            <div className="text-nightly-celadon">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-nightly-spring-green">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FaUser className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
            <div className="text-nightly-celadon">Profile not found</div>
            <div className="text-sm text-nightly-celadon/70">
              This user doesn't exist or their profile is private
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile.isPublic && !isOwnProfile) {
    return (
      <div className="text-nightly-spring-green">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FaShieldAlt className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
            <div className="text-nightly-celadon">Private Profile</div>
            <div className="text-sm text-nightly-celadon/70">
              This user has set their profile to private
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
        <StatisticsSection profile={profile} />
        <BadgesSection badges={profile.badges} />
        <RecentAchievementsSection achievements={profile.recentAchievements} />
      </div>
    </div>
  );
};

export default PublicProfilePage;
