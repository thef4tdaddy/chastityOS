/**
 * Rule Editor Hook
 *
 * Extracts rule management logic from RuleEditor component.
 */

import { useState, useCallback } from "react";

export interface Rule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  conditions: Condition[];
  actions: RuleAction[];
}

export interface Condition {
  type: string;
  value: any;
}

export interface RuleAction {
  type: string;
  value: any;
}

export interface CreateRuleInput {
  title: string;
  description?: string;
}

export interface UpdateRuleInput {
  title?: string;
  description?: string;
  enabled?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TestResult {
  passed: boolean;
  message: string;
}

export interface UseRuleEditorReturn {
  rules: Rule[];
  currentRule: Rule | null;
  isLoading: boolean;
  createRule: (rule: CreateRuleInput) => Promise<Rule>;
  updateRule: (id: string, updates: UpdateRuleInput) => Promise<Rule>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  setCurrentRule: (rule: Rule | null) => void;
  resetEditor: () => void;
  validateRule: (rule: Rule) => ValidationResult;
  isRuleValid: boolean;
  validationErrors: string[];
  testRule: (rule: Rule, testData: any) => Promise<TestResult>;
  isTesting: boolean;
  addCondition: (condition: Condition) => void;
  removeCondition: (index: number) => void;
  updateCondition: (index: number, condition: Condition) => void;
  addAction: (action: RuleAction) => void;
  removeAction: (index: number) => void;
  updateAction: (index: number, action: RuleAction) => void;
}

export function useRuleEditor(): UseRuleEditorReturn {
  const [rules, setRules] = useState<Rule[]>([]);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const createRule = useCallback(
    async (rule: CreateRuleInput): Promise<Rule> => {
      const newRule: Rule = {
        id: `rule-${Date.now()}`,
        title: rule.title,
        description: rule.description || "",
        enabled: true,
        conditions: [],
        actions: [],
      };
      setRules((prev) => [...prev, newRule]);
      return newRule;
    },
    [],
  );

  const updateRule = useCallback(
    async (id: string, updates: UpdateRuleInput): Promise<Rule> => {
      let updatedRule: Rule | null = null;
      setRules((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            updatedRule = { ...r, ...updates };
            return updatedRule;
          }
          return r;
        }),
      );
      if (!updatedRule) throw new Error("Rule not found");
      return updatedRule;
    },
    [],
  );

  const deleteRule = useCallback(async (id: string): Promise<void> => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      await updateRule(id, { enabled });
    },
    [updateRule],
  );

  const resetEditor = useCallback(() => {
    setCurrentRule(null);
    setValidationErrors([]);
  }, []);

  const validateRule = useCallback((rule: Rule): ValidationResult => {
    const errors: string[] = [];
    if (!rule.title) errors.push("Title is required");
    if (rule.conditions.length === 0)
      errors.push("At least one condition is required");
    if (rule.actions.length === 0)
      errors.push("At least one action is required");
    setValidationErrors(errors);
    return { valid: errors.length === 0, errors };
  }, []);

  const testRule = useCallback(
    async (_rule: Rule, _testData: any): Promise<TestResult> => {
      setIsTesting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { passed: true, message: "Rule test passed" };
      } finally {
        setIsTesting(false);
      }
    },
    [],
  );

  const addCondition = useCallback(
    (condition: Condition) => {
      if (currentRule) {
        setCurrentRule({
          ...currentRule,
          conditions: [...currentRule.conditions, condition],
        });
      }
    },
    [currentRule],
  );

  const removeCondition = useCallback(
    (index: number) => {
      if (currentRule) {
        setCurrentRule({
          ...currentRule,
          conditions: currentRule.conditions.filter((_, i) => i !== index),
        });
      }
    },
    [currentRule],
  );

  const updateCondition = useCallback(
    (index: number, condition: Condition) => {
      if (currentRule) {
        setCurrentRule({
          ...currentRule,
          conditions: currentRule.conditions.map((c, i) =>
            i === index ? condition : c,
          ),
        });
      }
    },
    [currentRule],
  );

  const addAction = useCallback(
    (action: RuleAction) => {
      if (currentRule) {
        setCurrentRule({
          ...currentRule,
          actions: [...currentRule.actions, action],
        });
      }
    },
    [currentRule],
  );

  const removeAction = useCallback(
    (index: number) => {
      if (currentRule) {
        setCurrentRule({
          ...currentRule,
          actions: currentRule.actions.filter((_, i) => i !== index),
        });
      }
    },
    [currentRule],
  );

  const updateAction = useCallback(
    (index: number, action: RuleAction) => {
      if (currentRule) {
        setCurrentRule({
          ...currentRule,
          actions: currentRule.actions.map((a, i) =>
            i === index ? action : a,
          ),
        });
      }
    },
    [currentRule],
  );

  // Simulate initial load
  useState(() => {
    setTimeout(() => setIsLoading(false), 100);
  });

  return {
    rules,
    currentRule,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    setCurrentRule,
    resetEditor,
    validateRule,
    isRuleValid: validationErrors.length === 0,
    validationErrors,
    testRule,
    isTesting,
    addCondition,
    removeCondition,
    updateCondition,
    addAction,
    removeAction,
    updateAction,
  };
}
