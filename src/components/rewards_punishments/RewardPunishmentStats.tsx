import React from "react";
import { RewardPunishmentLog } from "./LogItem";
import { FaTrophy } from "../../utils/iconImport";

// Statistics Component
interface RewardPunishmentStatsProps {
  logs: RewardPunishmentLog[];
}

export const RewardPunishmentStats: React.FC<RewardPunishmentStatsProps> = ({
  logs,
}) => {
  const stats = {
    totalRewards: logs.filter((l) => l.type === "reward").length,
    totalPunishments: logs.filter((l) => l.type === "punishment").length,
    timeReduced: logs
      .filter((l) => l.type === "reward")
      .reduce((acc, l) => acc + Math.abs(l.timeChangeSeconds), 0),
    timeAdded: logs
      .filter((l) => l.type === "punishment")
      .reduce((acc, l) => acc + Math.abs(l.timeChangeSeconds), 0),
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaTrophy className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">Summary</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {stats.totalRewards}
          </div>
          <div className="text-sm text-nightly-celadon">Rewards</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            {stats.totalPunishments}
          </div>
          <div className="text-sm text-nightly-celadon">Punishments</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            -{formatDuration(stats.timeReduced)}
          </div>
          <div className="text-sm text-nightly-celadon">Time Reduced</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            +{formatDuration(stats.timeAdded)}
          </div>
          <div className="text-sm text-nightly-celadon">Time Added</div>
        </div>
      </div>
    </div>
  );
};
