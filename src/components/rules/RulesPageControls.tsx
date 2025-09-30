import React from "react";
import { FaFilter, FaPlus } from "../../utils/iconImport";
import type { ChastityRule } from "./RuleCard";

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
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <FaFilter className="text-nightly-celadon" />
        <select
          value={filter}
          onChange={(e) =>
            onFilterChange(e.target.value as "all" | "active" | "inactive")
          }
          className="bg-white/10 border border-white/10 rounded p-2 text-nightly-honeydew"
        >
          <option value="all">All Rules ({rules.length})</option>
          <option value="active">
            Active ({rules.filter((r) => r.isActive).length})
          </option>
          <option value="inactive">
            Inactive ({rules.filter((r) => !r.isActive).length})
          </option>
        </select>
      </div>

      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-black px-4 py-2 rounded-lg transition-colors"
      >
        <FaPlus />
        New Rule
      </button>
    </div>
  );
};
