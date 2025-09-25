import React, { useState } from "react";
import { useAuthState } from "../contexts";
import {
  LogItem,
  RewardPunishmentStats,
  ManualEntryForm,
} from "../components/rewards_punishments";
import type { RewardPunishmentLog } from "../components/rewards_punishments";
import { FaFilter, FaSpinner, FaTrophy } from "../utils/iconImport";
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
  const { user } = useAuthState();
  const [logs, setLogs] = useState<RewardPunishmentLog[]>(
    mockRewardsAndPunishments,
  );
  const [filter, setFilter] = useState<"all" | "rewards" | "punishments">(
    "all",
  );
  const [loading, setLoading] = useState(false);

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <FaFilter className="text-nightly-celadon" />
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "rewards" | "punishments")
              }
              className="bg-white/10 border border-white/10 rounded p-2 text-nightly-honeydew"
            >
              <option value="all">All ({logs.length})</option>
              <option value="rewards">
                Rewards ({logs.filter((l) => l.type === "reward").length})
              </option>
              <option value="punishments">
                Punishments (
                {logs.filter((l) => l.type === "punishment").length})
              </option>
            </select>
          </div>

          <ManualEntryForm onSubmit={handleManualEntry} />
        </div>

        {/* Logs */}
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
            <div className="text-nightly-celadon">
              Loading rewards and punishments...
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <FaTrophy className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
            <div className="text-nightly-celadon">
              No {filter === "all" ? "entries" : filter} found
            </div>
            <div className="text-sm text-nightly-celadon/70">
              {filter === "all"
                ? "Complete tasks or have your keyholder add entries"
                : `Switch to 'All' to see other entries`}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <LogItem key={log.id} item={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPunishmentsPage;
