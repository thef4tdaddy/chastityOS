import React from "react";
import { FaFilter } from "../../utils/iconImport";
import { ManualEntryForm } from "./ManualEntryForm";
import type { RewardPunishmentLog } from "./index";
import { Select, SelectOption } from "@/components/ui";

interface RewardsPunishmentsControlsProps {
  filter: "all" | "rewards" | "punishments";
  onFilterChange: (filter: "all" | "rewards" | "punishments") => void;
  logs: RewardPunishmentLog[];
  onManualEntry: (entry: Omit<RewardPunishmentLog, "id" | "createdAt">) => void;
}

export const RewardsPunishmentsControls: React.FC<
  RewardsPunishmentsControlsProps
> = ({ filter, onFilterChange, logs, onManualEntry }) => {
  const filterOptions: SelectOption[] = [
    { value: "all", label: `All (${logs.length})` },
    {
      value: "rewards",
      label: `Rewards (${logs.filter((l) => l.type === "reward").length})`,
    },
    {
      value: "punishments",
      label: `Punishments (${logs.filter((l) => l.type === "punishment").length})`,
    },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <FaFilter className="text-nightly-celadon" />
        <Select
          value={filter}
          onChange={(value) =>
            onFilterChange(value as "all" | "rewards" | "punishments")
          }
          options={filterOptions}
          size="sm"
          fullWidth={false}
        />
      </div>

      <ManualEntryForm onSubmit={onManualEntry} />
    </div>
  );
};
