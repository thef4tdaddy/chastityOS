/**
 * Rule Database Service
 * Manages keyholder rules in Dexie database
 */
import { db } from "../storage/ChastityDB";
import type { KeyholderRule } from "@/types/core";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RuleDBService");

class RuleDBService {
  private table = db.rules;

  /**
   * Find rule by ID
   */
  async findById(id: string): Promise<KeyholderRule | undefined> {
    try {
      const result = await this.table.get(id);
      logger.debug("Find by ID", { id, found: !!result });
      return result;
    } catch (error) {
      logger.error("Failed to find by ID", { error: error as Error, id });
      throw error;
    }
  }

  /**
   * Find rules by keyholder user ID
   */
  async findByKeyholder(keyholderUserId: string): Promise<KeyholderRule[]> {
    try {
      const results = await this.table
        .where("keyholderUserId")
        .equals(keyholderUserId)
        .toArray();
      logger.debug("Find by keyholder", {
        keyholderUserId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error("Failed to find by keyholder", {
        error: error as Error,
        keyholderUserId,
      });
      throw error;
    }
  }

  /**
   * Find rules by submissive user ID
   */
  async findBySubmissive(submissiveUserId: string): Promise<KeyholderRule[]> {
    try {
      const results = await this.table
        .where("submissiveUserId")
        .equals(submissiveUserId)
        .toArray();
      logger.debug("Find by submissive", {
        submissiveUserId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error("Failed to find by submissive", {
        error: error as Error,
        submissiveUserId,
      });
      throw error;
    }
  }

  /**
   * Find active rules by keyholder
   */
  async findActiveByKeyholder(
    keyholderUserId: string,
  ): Promise<KeyholderRule[]> {
    try {
      const allRules = await this.findByKeyholder(keyholderUserId);
      const results = allRules.filter((rule) => rule.isActive);
      logger.debug("Find active by keyholder", {
        keyholderUserId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error("Failed to find active by keyholder", {
        error: error as Error,
        keyholderUserId,
      });
      throw error;
    }
  }

  /**
   * Find active rules by submissive
   */
  async findActiveBySubmissive(
    submissiveUserId: string,
  ): Promise<KeyholderRule[]> {
    try {
      const allRules = await this.findBySubmissive(submissiveUserId);
      const results = allRules.filter((rule) => rule.isActive);
      logger.debug("Find active by submissive", {
        submissiveUserId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error("Failed to find active by submissive", {
        error: error as Error,
        submissiveUserId,
      });
      throw error;
    }
  }

  /**
   * Toggle rule active status
   */
  async toggleActive(ruleId: string): Promise<void> {
    try {
      const rule = await this.findById(ruleId);
      if (!rule) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      await this.update(ruleId, {
        isActive: !rule.isActive,
        lastModified: new Date(),
        syncStatus: "pending",
      });

      logger.info("Rule active status toggled", {
        ruleId,
        newStatus: !rule.isActive,
      });
    } catch (error) {
      logger.error("Failed to toggle rule active status", {
        error: error as Error,
        ruleId,
      });
      throw error;
    }
  }

  /**
   * Create a new rule
   */
  async create(
    rule: Omit<KeyholderRule, "syncStatus" | "lastModified">,
  ): Promise<string> {
    try {
      const ruleWithMeta: KeyholderRule = {
        ...rule,
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await this.table.add(ruleWithMeta);
      logger.info("Rule created", { ruleId: rule.id, title: rule.title });
      return rule.id;
    } catch (error) {
      logger.error("Failed to create rule", {
        error: error as Error,
        ruleId: rule.id,
      });
      throw error;
    }
  }

  /**
   * Update rule
   */
  async update(ruleId: string, updates: Partial<KeyholderRule>): Promise<void> {
    try {
      await this.table.update(ruleId, {
        ...updates,
        lastModified: new Date(),
        syncStatus: "pending",
      });
      logger.info("Rule updated", { ruleId, updates });
    } catch (error) {
      logger.error("Failed to update rule", {
        error: error as Error,
        ruleId,
      });
      throw error;
    }
  }

  /**
   * Delete rule
   */
  async delete(ruleId: string): Promise<void> {
    try {
      await this.table.delete(ruleId);
      logger.info("Rule deleted", { ruleId });
    } catch (error) {
      logger.error("Failed to delete rule", {
        error: error as Error,
        ruleId,
      });
      throw error;
    }
  }
}

export const ruleDBService = new RuleDBService();
