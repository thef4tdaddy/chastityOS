import React from "react";
import { FaSpinner, FaTrophy } from "../../utils/iconImport";
import { LogItem } from "./LogItem";
import type { RewardPunishmentLog } from "./index";

interface RewardsPunishmentsContentProps {
  filteredLogs: RewardPunishmentLog[];
  loading: boolean;
  filter: "all" | "rewards" | "punishments";
}

export const RewardsPunishmentsContent: React.FC<
  RewardsPunishmentsContentProps
> = ({ filteredLogs, loading, filter }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
        <div className="text-nightly-celadon">
          Loading rewards and punishments...
        </div>
      </div>
    );
  }

  if (filteredLogs.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {filteredLogs.map((log) => (
        <LogItem key={log.id} item={log} />
      ))}
    </div>
  );
};
