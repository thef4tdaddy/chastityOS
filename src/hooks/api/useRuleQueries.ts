/**
 * Rule TanStack Query Hooks
 * Manages keyholder rules with Dexie as backend
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ruleDBService } from "@/services/database/RuleDBService";
import type { KeyholderRule } from "@/types/core";
import { serviceLogger } from "@/utils/logging";
import { Timestamp } from "firebase/firestore";

const logger = serviceLogger("useRuleQueries");

/**
 * Query for getting rules by user role
 */
export function useRulesQuery(
  userId: string | undefined,
  role: "keyholder" | "submissive",
) {
  return useQuery({
    queryKey: ["rules", role, userId],
    queryFn: async () => {
      if (!userId) return [];

      // Read from local Dexie based on role
      const rules =
        role === "keyholder"
          ? await ruleDBService.findByKeyholder(userId)
          : await ruleDBService.findBySubmissive(userId);

      logger.debug("Rules fetched", {
        role,
        userId,
        count: rules.length,
      });

      return rules;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Query for getting active rules only
 */
export function useActiveRulesQuery(
  userId: string | undefined,
  role: "keyholder" | "submissive",
) {
  return useQuery({
    queryKey: ["rules", role, userId, "active"],
    queryFn: async () => {
      if (!userId) return [];

      // Read active rules from local Dexie based on role
      const rules =
        role === "keyholder"
          ? await ruleDBService.findActiveByKeyholder(userId)
          : await ruleDBService.findActiveBySubmissive(userId);

      logger.debug("Active rules fetched", {
        role,
        userId,
        count: rules.length,
      });

      return rules;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Mutations for rule operations
 */
export function useRuleMutations() {
  const queryClient = useQueryClient();

  const createRule = useMutation({
    mutationFn: async (
      rule: Omit<
        KeyholderRule,
        "id" | "createdAt" | "syncStatus" | "lastModified"
      >,
    ) => {
      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const newRule: Omit<KeyholderRule, "syncStatus" | "lastModified"> = {
        ...rule,
        id: ruleId,
        createdAt: Timestamp.now().toDate(), // Convert to Date
      };

      await ruleDBService.create(newRule);

      logger.info("Rule created", { ruleId, title: rule.title });
      return ruleId;
    },
    onSuccess: async () => {
      // Invalidate all rule queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
    onError: (error) => {
      logger.error("Failed to create rule", { error });
    },
  });

  const updateRule = useMutation({
    mutationFn: async (params: {
      ruleId: string;
      updates: Partial<KeyholderRule>;
    }) => {
      await ruleDBService.update(params.ruleId, params.updates);

      logger.info("Rule updated", {
        ruleId: params.ruleId,
        updates: params.updates,
      });
    },
    onSuccess: async () => {
      // Invalidate all rule queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
    onError: (error) => {
      logger.error("Failed to update rule", { error });
    },
  });

  const toggleRule = useMutation({
    mutationFn: async (ruleId: string) => {
      await ruleDBService.toggleActive(ruleId);

      logger.info("Rule toggled", { ruleId });
    },
    onSuccess: async () => {
      // Invalidate all rule queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
    onError: (error) => {
      logger.error("Failed to toggle rule", { error });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      await ruleDBService.delete(ruleId);

      logger.info("Rule deleted", { ruleId });
    },
    onSuccess: async () => {
      // Invalidate all rule queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
    onError: (error) => {
      logger.error("Failed to delete rule", { error });
    },
  });

  return {
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
  };
}
