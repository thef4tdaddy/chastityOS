import { useState, useMemo } from "react";
import { useRulesQuery, useRuleMutations } from "./api/useRuleQueries";
import type { ChastityRule } from "../components/rules";
import type { KeyholderRule } from "@/types/core";

// Helper to convert KeyholderRule to ChastityRule for UI compatibility
const convertToChastityRule = (rule: KeyholderRule): ChastityRule => ({
  id: rule.id,
  title: rule.title,
  content: rule.description,
  isActive: rule.isActive,
  createdBy: "keyholder", // Default to keyholder for now
  createdAt: rule.createdAt.toDate(),
  lastModified: rule.lastModified || new Date(),
});

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

export const useRulesPage = (
  userId: string | undefined,
  role: "keyholder" | "submissive",
) => {
  const { data: dbRules = [], isLoading } = useRulesQuery(userId, role);
  const { createRule, updateRule, toggleRule } = useRuleMutations();

  const [editingRule, setEditingRule] = useState<ChastityRule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  // Convert database rules to UI format
  const rules = useMemo(() => dbRules.map(convertToChastityRule), [dbRules]);

  const filteredRules = useMemo(
    () => filterAndSortRules(rules, filter),
    [rules, filter],
  );

  const handleEditRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    setEditingRule(rule || null);
    setShowEditor(true);
  };

  const handleToggleRule = async (ruleId: string) => {
    await toggleRule.mutateAsync(ruleId);
  };

  const handleSaveRule = async (
    ruleData: Omit<ChastityRule, "id" | "createdAt" | "lastModified">,
  ) => {
    if (!userId) return;

    if (editingRule) {
      // Update existing rule
      await updateRule.mutateAsync({
        ruleId: editingRule.id,
        updates: {
          title: ruleData.title,
          description: ruleData.content,
          isActive: ruleData.isActive,
        },
      });
    } else {
      // Create new rule
      await createRule.mutateAsync({
        keyholderUserId: role === "keyholder" ? userId : "", // Will need proper keyholder ID
        submissiveUserId: role === "submissive" ? userId : "", // Will need proper submissive ID
        title: ruleData.title,
        description: ruleData.content,
        isActive: ruleData.isActive,
      });
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
    isLoading,
    setFilter,
    handleEditRule,
    handleToggleRule,
    handleSaveRule,
    handleCancelEdit,
    handleCreateNew,
  };
};
