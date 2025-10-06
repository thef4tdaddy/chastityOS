/**
 * Helper functions for rule editor operations
 */

import { Rule, Condition, RuleAction } from "./useRuleEditor";

/**
 * Add a condition to a rule
 */
export function addConditionToRule(rule: Rule, condition: Condition): Rule {
  return {
    ...rule,
    conditions: [...rule.conditions, condition],
  };
}

/**
 * Remove a condition from a rule by index
 */
export function removeConditionFromRule(rule: Rule, index: number): Rule {
  return {
    ...rule,
    conditions: rule.conditions.filter((_, i) => i !== index),
  };
}

/**
 * Update a condition in a rule by index
 */
export function updateConditionInRule(
  rule: Rule,
  index: number,
  condition: Condition,
): Rule {
  return {
    ...rule,
    conditions: rule.conditions.map((c, i) => (i === index ? condition : c)),
  };
}

/**
 * Add an action to a rule
 */
export function addActionToRule(rule: Rule, action: RuleAction): Rule {
  return {
    ...rule,
    actions: [...rule.actions, action],
  };
}

/**
 * Remove an action from a rule by index
 */
export function removeActionFromRule(rule: Rule, index: number): Rule {
  return {
    ...rule,
    actions: rule.actions.filter((_, i) => i !== index),
  };
}

/**
 * Update an action in a rule by index
 */
export function updateActionInRule(
  rule: Rule,
  index: number,
  action: RuleAction,
): Rule {
  return {
    ...rule,
    actions: rule.actions.map((a, i) => (i === index ? action : a)),
  };
}
