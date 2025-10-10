import React from "react";
import { FaFilter, FaPlus } from "../../utils/iconImport";
import type { ChastityRule } from "./RuleCard";
import { Select, SelectOption } from "@/components/ui";

interface RulesPageControlsProps {
  filter: "all" | "active" | "inactive";
  onFilterChange: (filter: "all" | "active" | "inactive") => void;
  rules: ChastityRule[];
  onCreateNew: () => void;
}

export const RulesPageControls: React.FC<RulesPageControlsProps> = ({
  filter,
  onFilterChange,
  rules,
  onCreateNew,
}) => {
  const filterOptions: SelectOption[] = [
    { value: "all", label: `All Rules (${rules.length})` },
    {
      value: "active",
      label: `Active (${rules.filter((r) => r.isActive).length})`,
    },
    {
      value: "inactive",
      label: `Inactive (${rules.filter((r) => !r.isActive).length})`,
    },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <FaFilter className="text-nightly-celadon" />
        <Select
          value={filter}
          onChange={(value) =>
            onFilterChange(value as "all" | "active" | "inactive")
          }
          options={filterOptions}
          size="sm"
          fullWidth={false}
        />
      </div>

      <Button
        onClick={onCreateNew}
        className="flex items-center gap-2 bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-black px-4 py-2 rounded-lg transition-colors"
      >
        <FaPlus />
        New Rule
      </Button>
    </div>
  );
};
