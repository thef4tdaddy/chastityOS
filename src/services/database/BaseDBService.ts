/**
 * Base Database Service
 * Provides common CRUD operations and sync management for all database entities
 */
import type { Table } from "dexie";
import { serviceLogger } from "@/utils/logging";
import type { SyncStatus } from "@/types/database";

const logger = serviceLogger("BaseDBService");

export abstract class BaseDBService<
  T extends {
    id: string;
    syncStatus: SyncStatus;
    lastModified: Date;
    userId?: string;
  },
> {
  protected constructor(protected table: Table<T>) {}

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | undefined> {
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
   * Find all records for a user
   */
  async findByUserId(userId: string): Promise<T[]> {
    try {
      const results = await this.table.where("userId").equals(userId).toArray();
      logger.debug("Find by user ID", { userId, count: results.length });
      return results;
    } catch (error) {
      logger.error("Failed to find by user ID", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(item: Omit<T, "lastModified" | "syncStatus">): Promise<string> {
    try {
      const fullItem = {
        ...item,
        lastModified: new Date(),
        syncStatus: "pending" as SyncStatus,
      } as T;

      const id = await this.table.add(fullItem);
      logger.debug("Created record", { id, type: this.constructor.name });
      return id as string;
    } catch (error) {
      logger.error("Failed to create record", { error: error as Error });
      throw error;
    }
  }

  /**
   * Update existing record
   */
  async update(id: string, updates: Partial<T>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        lastModified: new Date(),
        syncStatus: "pending" as SyncStatus,
      };

      // Using `any` here is a pragmatic choice to satisfy Dexie's UpdateSpec type
      // when dealing with a generic base class. The alternative would be complex
      // type manipulation for each specific service.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.table.update(id, updateData as any);
      logger.debug("Updated record", { id, updates: Object.keys(updateData) });
    } catch (error) {
      logger.error("Failed to update record", { error: error as Error, id });
      throw error;
    }
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    try {
      await this.table.delete(id);
      logger.debug("Deleted record", { id });
    } catch (error) {
      logger.error("Failed to delete record", { error: error as Error, id });
      throw error;
    }
  }

  /**
   * Get all records with pending sync status
   */
  async getPendingSync(userId?: string): Promise<T[]> {
    try {
      let query = this.table.where("syncStatus").equals("pending");
      if (userId) {
        query = query.and((doc) => doc.userId === userId);
      }
      const results = await query.toArray();
      logger.debug("Found pending sync records", {
        count: results.length,
        userId,
      });
      return results;
    } catch (error) {
      logger.error("Failed to get pending sync records", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Mark multiple records as synced
   */
  async bulkMarkAsSynced(ids: string[]): Promise<void> {
    try {
      await this.table.bulkUpdate(
        ids.map((id) => ({
          key: id,
          // Using `any` to satisfy Dexie's UpdateSpec within a bulk operation.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          changes: { syncStatus: "synced" } as any,
        })),
      );
      logger.debug("Bulk marked as synced", { count: ids.length });
    } catch (error) {
      logger.error("Failed to bulk mark as synced", {
        error: error as Error,
        count: ids.length,
      });
      throw error;
    }
  }

  /**
   * Get count of records
   */
  async count(): Promise<number> {
    try {
      const count = await this.table.count();
      logger.debug("Record count", { count, service: this.constructor.name });
      return count;
    } catch (error) {
      logger.error("Failed to get count", { error: error as Error });
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const record = await this.table.get(id);
      return !!record;
    } catch (error) {
      logger.error("Failed to check existence", { error: error as Error, id });
      return false;
    }
  }

  /**
   * Get paginated results
   */
  async paginate(
    userId: string,
    offset: number = 0,
    limit: number = 50,
    orderBy: keyof T = "lastModified" as keyof T,
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    try {
      const query = this.table.where("userId").equals(userId);

      const total = await query.count();
      const data = await query
        .reverse()
        .sortBy(orderBy as string)
        .then((results) => results.slice(offset, offset + limit));

      const hasMore = offset + limit < total;

      logger.debug("Paginated query", {
        userId,
        offset,
        limit,
        total,
        returned: data.length,
        hasMore,
      });

      return { data, total, hasMore };
    } catch (error) {
      logger.error("Failed to paginate", {
        error: error as Error,
        userId,
        offset,
        limit,
      });
      throw error;
    }
  }
}
