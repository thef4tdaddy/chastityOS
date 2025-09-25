/**
 * Event Database Service
 * Handles all local database operations for events
 */
import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import type { DBEvent, EventFilters } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("EventDBService");

class EventDBService extends BaseDBService<DBEvent> {
  constructor() {
    super(db.events);
  }

  /**
   * Log a new event
   */
  async logEvent(
    userId: string,
    type: DBEvent["type"],
    details: DBEvent["details"],
    options: {
      sessionId?: string;
      isPrivate?: boolean;
      timestamp?: Date;
    } = {},
  ): Promise<string> {
    try {
      const eventId = generateUUID();
      const event: Omit<DBEvent, "lastModified" | "syncStatus"> = {
        id: eventId,
        userId,
        type,
        details,
        sessionId: options.sessionId,
        isPrivate: options.isPrivate || false,
        timestamp: options.timestamp || new Date(),
      };

      await this.create(event);

      logger.info("Logged new event", { eventId, userId, type });
      return eventId;
    } catch (error) {
      logger.error("Failed to log event", {
        error: error as Error,
        userId,
        type,
      });
      throw error;
    }
  }

  /**
   * Get events for a user, with optional filtering
   */
  async getEvents(
    userId: string,
    filters: EventFilters = {},
    limit: number = 50,
    offset: number = 0,
  ): Promise<DBEvent[]> {
    try {
      let query = this.table.where("userId").equals(userId);

      if (filters.type) {
        query = query.and((event) => event.type === filters.type);
      }
      if (filters.sessionId) {
        query = query.and((event) => event.sessionId === filters.sessionId);
      }
      if (filters.dateRange) {
        query = query.and(
          (event) =>
            event.timestamp >= filters.dateRange.start &&
            event.timestamp <= filters.dateRange.end,
        );
      }
      if (typeof filters.isPrivate === "boolean") {
        query = query.and((event) => event.isPrivate === filters.isPrivate);
      }

      const events = await query
        .reverse()
        .sortBy("timestamp")
        .then((results) => results.slice(offset, offset + limit));

      logger.debug("Get events", {
        userId,
        filters,
        limit,
        offset,
        returned: events.length,
      });
      return events;
    } catch (error) {
      logger.error("Failed to get events", {
        error: error as Error,
        userId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get all events for a specific session
   */
  async getSessionEvents(sessionId: string): Promise<DBEvent[]> {
    try {
      const events = await this.table
        .where("sessionId")
        .equals(sessionId)
        .sortBy("timestamp");

      logger.debug("Get session events", {
        sessionId,
        count: events.length,
      });
      return events;
    } catch (error) {
      logger.error("Failed to get session events", {
        error: error as Error,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Find events by filter criteria
   */
  async findByFilter(filters: Partial<EventFilters>): Promise<DBEvent[]> {
    try {
      let query = this.table.toCollection();

      if (filters.userId) {
        query = this.table.where("userId").equals(filters.userId);
      }
      if (filters.sessionId) {
        query = query.and ? query.and((event) => event.sessionId === filters.sessionId) 
          : this.table.where("sessionId").equals(filters.sessionId);
      }
      if (filters.type) {
        query = query.and ? query.and((event) => event.type === filters.type)
          : this.table.where("type").equals(filters.type);
      }
      if (filters.dateRange) {
        query = query.and((event) =>
          event.timestamp >= filters.dateRange!.start &&
          event.timestamp <= filters.dateRange!.end,
        );
      }
      if (typeof filters.isPrivate === "boolean") {
        query = query.and((event) => event.isPrivate === filters.isPrivate);
      }

      const events = await query.reverse().sortBy("timestamp");

      logger.debug("Find by filter", {
        filters,
        returned: events.length,
      });
      return events;
    } catch (error) {
      logger.error("Failed to find events by filter", {
        error: error as Error,
        filters,
      });
      throw error;
    }
  }
}

export const eventDBService = new EventDBService();
