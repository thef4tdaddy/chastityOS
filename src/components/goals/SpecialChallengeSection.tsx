import React from "react";
import {
  FaCalendarAlt,
  FaTrophy,
  FaLock,
  FaBan,
  FaCheckCircle,
  FaSpinner,
} from "@/utils/iconImport";
import {
  useSpecialChallenges,
  type SpecialChallengeStatus,
} from "@/hooks/useSpecialChallenges";
import { logger } from "@/utils/logging";

interface SpecialChallengeSectionProps {
  userId: string | null;
}

// Loading State Component
const LoadingState: React.FC = () => (
  <div className="bg-white/10 backdrop-blur-xs border-white/20 p-4 rounded-lg">
    <div className="flex items-center justify-center py-8">
      <FaSpinner className="animate-spin text-2xl text-blue-400" />
      <span className="ml-2 text-blue-200">Loading challenges...</span>
    </div>
  </div>
);

// Error State Component
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-900/20 border-red-500/50 p-4 rounded-lg">
    <p className="text-red-300">Error loading challenges: {error}</p>
  </div>
);

// Challenge State Components
const ChallengeNotAvailable: React.FC<{ month: string }> = ({ month }) => (
  <div className="text-center py-3">
    <p className="text-sm opacity-60">Available during {month} only</p>
  </div>
);

const ChallengeJoinButton: React.FC<{
  onJoin: () => void;
}> = ({ onJoin }) => (
  <Button
    onClick={onJoin}
    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
  >
    <FaTrophy className="mr-2" />
    Join Challenge
  </Button>
);

const ChallengeActiveState: React.FC<{ progress: number }> = ({ progress }) => (
  <div>
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>Progress</span>
        <span>{progress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
    <div className="text-center py-2">
      <div className="flex items-center justify-center text-green-400">
        <FaCheckCircle className="mr-2" />
        <span className="font-semibold">Challenge Active!</span>
      </div>
      <p className="text-xs opacity-70 mt-1">
        Keep going to complete the challenge
      </p>
    </div>
  </div>
);

const ChallengeCompletedState: React.FC = () => (
  <div className="text-center py-3">
    <div className="flex items-center justify-center text-gold-400 mb-2">
      <FaTrophy className="text-2xl mr-2" />
      <span className="text-lg font-bold">Completed!</span>
    </div>
    <p className="text-sm opacity-80">
      Congratulations on completing the challenge!
    </p>
  </div>
);

// Challenge Card Component
const ChallengeCard: React.FC<{
  type: "locktober" | "no_nut_november";
  title: string;
  description: string;
  icon: React.ReactNode;
  month: string;
  colorClasses: string;
  challengeStatus: SpecialChallengeStatus;
  onJoinChallenge: (type: "locktober" | "no_nut_november") => void;
  getChallengeProgress: (type: "locktober" | "no_nut_november") => number;
}> = ({
  type,
  title,
  description,
  icon,
  month,
  colorClasses,
  challengeStatus,
  onJoinChallenge,
  getChallengeProgress,
}) => {
  const challengeMap = {
    locktober: challengeStatus.locktober,
    no_nut_november: challengeStatus.noNutNovember,
  };
  const challenge = challengeMap[type as keyof typeof challengeMap];
  const progress = getChallengeProgress(type);

  return (
    <div className={`p-4 rounded-lg border ${colorClasses}`}>
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-xl font-bold ml-2">{title}</h3>
      </div>

      <p className="text-sm opacity-80 mb-4">{description}</p>

      <div className="flex items-center text-sm mb-3">
        <FaCalendarAlt className="mr-2" />
        <span>Active during {month}</span>
      </div>

      {!challenge.available && <ChallengeNotAvailable month={month} />}

      {challenge.available && !challenge.active && !challenge.completed && (
        <ChallengeJoinButton onJoin={() => onJoinChallenge(type)} />
      )}

      {challenge.active && <ChallengeActiveState progress={progress} />}

      {challenge.completed && <ChallengeCompletedState />}
    </div>
  );
};

export const SpecialChallengeSection: React.FC<
  SpecialChallengeSectionProps
> = ({ userId }) => {
  const {
    challengeStatus,
    isLoading,
    error,
    joinChallenge,
    getChallengeProgress,
  } = useSpecialChallenges(userId);

  const handleJoinChallenge = async (
    challengeType: "locktober" | "no_nut_november",
  ) => {
    try {
      await joinChallenge(challengeType);
    } catch (err) {
      // Error is handled by the hook
      logger.error(
        "Failed to join challenge",
        { error: err },
        "SpecialChallengeSection",
      );
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Only show section if at least one challenge is available or active
  const shouldShow =
    challengeStatus.locktober.available ||
    challengeStatus.noNutNovember.available ||
    challengeStatus.locktober.active ||
    challengeStatus.noNutNovember.active ||
    challengeStatus.locktober.completed ||
    challengeStatus.noNutNovember.completed;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-xs border-white/20 p-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <FaCalendarAlt className="mr-2 text-purple-400" />
        Special Challenges
      </h2>

      <p className="text-sm opacity-80 mb-6">
        Take on month-long challenges for special achievements and recognition!
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <ChallengeCard
          type="locktober"
          title="Locktober"
          description="Stay locked in chastity for the entire month of October"
          icon={<FaLock className="text-2xl text-orange-400" />}
          month="October"
          colorClasses="bg-orange-900/20 border-orange-500/50 text-orange-100"
          challengeStatus={challengeStatus}
          onJoinChallenge={handleJoinChallenge}
          getChallengeProgress={getChallengeProgress}
        />

        <ChallengeCard
          type="no_nut_november"
          title="No Nut November"
          description="Abstain from orgasms for the entire month of November"
          icon={<FaBan className="text-2xl text-blue-400" />}
          month="November"
          colorClasses="bg-blue-900/20 border-blue-500/50 text-blue-100"
          challengeStatus={challengeStatus}
          onJoinChallenge={handleJoinChallenge}
          getChallengeProgress={getChallengeProgress}
        />
      </div>
    </div>
  );
};
