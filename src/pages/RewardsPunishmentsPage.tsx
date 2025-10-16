import React, { useState } from "react";
import {
  RewardPunishmentStats,
  RewardsPunishmentsControls,
  RewardsPunishmentsContent,
} from "../components/rewards_punishments";
import type { RewardPunishmentLog } from "../components/rewards_punishments";

const RewardsPunishmentsPage: React.FC = () => {
  const [logs, setLogs] = useState<RewardPunishmentLog[]>([]);
  const [filter, setFilter] = useState<"all" | "rewards" | "punishments">(
    "all",
  );
  const [loading] = useState(false);

  const filteredLogs = logs
    .filter((log) => {
      if (filter === "all") return true;
      if (filter === "rewards") return log.type === "reward";
      if (filter === "punishments") return log.type === "punishment";
      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleManualEntry = (
    entry: Omit<RewardPunishmentLog, "id" | "createdAt">,
  ) => {
    const newEntry: RewardPunishmentLog = {
      ...entry,
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    setLogs((prev) => [newEntry, ...prev]);
  };

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        <RewardPunishmentStats logs={logs} />

        {/* Controls */}
        <RewardsPunishmentsControls
          filter={filter}
          onFilterChange={setFilter}
          logs={logs}
          onManualEntry={handleManualEntry}
        />

        {/* Content */}
        <RewardsPunishmentsContent
          filteredLogs={filteredLogs}
          loading={loading}
          filter={filter}
        />
      </div>
    </div>
  );
};

export default RewardsPunishmentsPage;
