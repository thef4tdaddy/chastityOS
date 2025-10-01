import { useState } from "react";
import type { ChastityRule } from "../components/rules";

// Helper function to filter and sort rules
const filterAndSortRules = (
  rules: ChastityRule[],
  filter: "all" | "active" | "inactive",
): ChastityRule[] => {
  return rules
    .filter((rule) => {
      if (filter === "all") return true;
      if (filter === "active") return rule.isActive;
      if (filter === "inactive") return !rule.isActive;
      return true;
    })
    .sort((a, b) => {
      // Active rules first, then by last modified
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.lastModified.getTime() - a.lastModified.getTime();
    });
};

export const useRulesPage = (initialRules: ChastityRule[]) => {
  const [rules, setRules] = useState<ChastityRule[]>(initialRules);
  const [editingRule, setEditingRule] = useState<ChastityRule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredRules = filterAndSortRules(rules, filter);

  const handleEditRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    setEditingRule(rule || null);
    setShowEditor(true);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? { ...rule, isActive: !rule.isActive, lastModified: new Date() }
          : rule,
      ),
    );
  };

  const handleSaveRule = (
    ruleData: Omit<ChastityRule, "id" | "createdAt" | "lastModified">,
  ) => {
    const now = new Date();

    if (editingRule) {
      // Update existing rule
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === editingRule.id
            ? {
                ...rule,
                ...ruleData,
                lastModified: now,
              }
            : rule,
        ),
      );
    } else {
      // Create new rule
      const newRule: ChastityRule = {
        ...ruleData,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        lastModified: now,
      };
      setRules((prev) => [newRule, ...prev]);
    }

    setShowEditor(false);
    setEditingRule(null);
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingRule(null);
  };

  const handleCreateNew = () => {
    setEditingRule(null);
    setShowEditor(true);
  };

  return {
    rules,
    editingRule,
    showEditor,
    filter,
    filteredRules,
    setFilter,
    handleEditRule,
    handleToggleRule,
    handleSaveRule,
    handleCancelEdit,
    handleCreateNew,
  };
};
