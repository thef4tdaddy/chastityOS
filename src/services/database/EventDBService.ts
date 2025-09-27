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
   * Create a new event (alias for create method)
   */
  async createEvent(
    eventData: Omit<DBEvent, "id" | "lastModified" | "syncStatus">,
  ): Promise<string> {
    try {
      const eventId = generateUUID();
      const event: Omit<DBEvent, "lastModified" | "syncStatus"> = {
        id: eventId,
        ...eventData,
      };

      await this.create(event);
      logger.info("Created new event", { eventId, userId: eventData.userId });
      return eventId;
    } catch (error) {
      logger.error("Failed to create event", { error: error as Error });
      throw error;
    }
  }

  /**
   * Update an existing event (alias for update method)
   */
  async updateEvent(eventId: string, updates: Partial<DBEvent>): Promise<void> {
    try {
      await this.update(eventId, updates);
      logger.info("Updated event", { eventId });
    } catch (error) {
      logger.error("Failed to update event", {
        error: error as Error,
        eventId,
      });
      throw error;
    }
  }

  /**
   * Delete an event (alias for delete method)
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.delete(eventId);
      logger.info("Deleted event", { eventId });
    } catch (error) {
      logger.error("Failed to delete event", {
        error: error as Error,
        eventId,
      });
      throw error;
    }
  }
}

export const eventDBService = new EventDBService();
