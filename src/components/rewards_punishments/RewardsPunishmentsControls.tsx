import React from "react";
import { FaFilter } from "../../utils/iconImport";
import { ManualEntryForm } from "./ManualEntryForm";
import type { RewardPunishmentLog } from "./index";

interface RewardsPunishmentsControlsProps {
  filter: "all" | "rewards" | "punishments";
  onFilterChange: (filter: "all" | "rewards" | "punishments") => void;
  logs: RewardPunishmentLog[];
  onManualEntry: (entry: Omit<RewardPunishmentLog, "id" | "createdAt">) => void;
}

export const RewardsPunishmentsControls: React.FC<
  RewardsPunishmentsControlsProps
> = ({ filter, onFilterChange, logs, onManualEntry }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <FaFilter className="text-nightly-celadon" />
        <select
          value={filter}
          onChange={(e) =>
            onFilterChange(e.target.value as "all" | "rewards" | "punishments")
          }
          className="bg-white/10 border border-white/10 rounded p-2 text-nightly-honeydew"
        >
          <option value="all">All ({logs.length})</option>
          <option value="rewards">
            Rewards ({logs.filter((l) => l.type === "reward").length})
          </option>
          <option value="punishments">
            Punishments ({logs.filter((l) => l.type === "punishment").length})
          </option>
        </select>
      </div>

      <ManualEntryForm onSubmit={onManualEntry} />
    </div>
  );
};
