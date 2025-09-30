import React, { useState } from "react";
import {
  RewardPunishmentStats,
  RewardsPunishmentsControls,
  RewardsPunishmentsContent,
} from "../components/rewards_punishments";
import type { RewardPunishmentLog } from "../components/rewards_punishments";
// Mock data for demonstration
const mockRewardsAndPunishments: RewardPunishmentLog[] = [
  {
    id: "1",
    type: "reward",
    title: "Task Completed Early",
    description: "Completed daily exercise routine ahead of schedule",
    timeChangeSeconds: -7200, // 2 hours removed
    source: "task_completion",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    notes: "Excellent dedication to fitness goals",
  },
  {
    id: "2",
    type: "punishment",
    title: "Late Task Submission",
    description: "Failed to submit daily report on time",
    timeChangeSeconds: 14400, // 4 hours added
    source: "rule_violation",
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
  },
  {
    id: "3",
    type: "reward",
    title: "Weekly Milestone",
    description: "Successfully completed one week of consistent tracking",
    timeChangeSeconds: -10800, // 3 hours removed
    source: "milestone",
    createdAt: new Date(Date.now() - 604800000), // 1 week ago
    notes: "Keep up the great progress!",
  },
];

const RewardsPunishmentsPage: React.FC = () => {
  const [logs, setLogs] = useState<RewardPunishmentLog[]>(
    mockRewardsAndPunishments,
  );
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
