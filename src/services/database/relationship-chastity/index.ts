/**
 * Relationship Chastity Services Index
 * Provides backward compatibility facade and exports all services
 */

// Export individual services
export { relationshipCoreService } from "./RelationshipCoreService";
export { chastitySessionService } from "./ChastitySessionService";
export { chastityTaskService } from "./ChastityTaskService";
export { chastityEventService } from "./ChastityEventService";
export { relationshipPermissionService } from "./RelationshipPermissionService";

// Re-export types for convenience
export type {
  RelationshipChastityData,
  RelationshipSession,
  RelationshipTask,
  RelationshipEvent,
  SessionEvent,
  RelationshipTaskStatus,
} from "@/types/relationships";

import { relationshipCoreService } from "./RelationshipCoreService";
import { chastitySessionService } from "./ChastitySessionService";
import { chastityTaskService } from "./ChastityTaskService";
import { chastityEventService } from "./ChastityEventService";
import { relationshipPermissionService as _relationshipPermissionService } from "./RelationshipPermissionService";
import { serviceLogger } from "@/utils/logging";
import type {
  RelationshipChastityData,
  RelationshipSession,
  RelationshipTask,
  RelationshipEvent,
  RelationshipTaskStatus,
} from "@/types/relationships";

const logger = serviceLogger("RelationshipChastityServiceFacade");

/**
 * Facade class that maintains backward compatibility
 * Delegates calls to appropriate domain services
 */
class RelationshipChastityServiceFacade {
  // ==================== CHASTITY DATA MANAGEMENT ====================

  async getChastityData(
    relationshipId: string,
  ): Promise<RelationshipChastityData | null> {
    return relationshipCoreService.getChastityData(relationshipId);
  }

  async updateChastitySettings(
    relationshipId: string,
    settings: Partial<RelationshipChastityData["settings"]>,
    userId: string,
  ): Promise<void> {
    return relationshipCoreService.updateChastitySettings(
      relationshipId,
      settings,
      userId,
    );
  }

  // ==================== SESSION MANAGEMENT ====================

  async startSession(
    relationshipId: string,
    userId: string,
    options: {
      goalDuration?: number;
      isHardcoreMode?: boolean;
      notes?: string;
    } = {},
  ): Promise<string> {
    return chastitySessionService.startSession(relationshipId, userId, options);
  }

  async endSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
    endReason?: string,
  ): Promise<void> {
    return chastitySessionService.endSession(
      relationshipId,
      sessionId,
      userId,
      endReason,
    );
  }

  async pauseSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
    pauseReason?: string,
  ): Promise<void> {
    return chastitySessionService.pauseSession(
      relationshipId,
      sessionId,
      userId,
      pauseReason,
    );
  }

  async resumeSession(
    relationshipId: string,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    return chastitySessionService.resumeSession(
      relationshipId,
      sessionId,
      userId,
    );
  }

  async getSessionHistory(
    relationshipId: string,
    limitCount: number = 50,
  ): Promise<RelationshipSession[]> {
    return chastitySessionService.getSessionHistory(relationshipId, limitCount);
  }

  // ==================== TASK MANAGEMENT ====================

  async createTask(
    relationshipId: string,
    taskData: {
      text: string;
      dueDate?: Date;
      consequence?: RelationshipTask["consequence"];
    },
    userId: string,
  ): Promise<string> {
    return chastityTaskService.createTask(relationshipId, taskData, userId);
  }

  async updateTaskStatus(
    relationshipId: string,
    taskId: string,
    status: RelationshipTaskStatus,
    userId: string,
    note?: string,
  ): Promise<void> {
    return chastityTaskService.updateTaskStatus(
      relationshipId,
      taskId,
      status,
      userId,
      note,
    );
  }

  async getTasks(
    relationshipId: string,
    limitCount: number = 50,
  ): Promise<RelationshipTask[]> {
    return chastityTaskService.getTasks(relationshipId, limitCount);
  }

  // ==================== EVENT LOGGING ====================

  async logEvent(
    relationshipId: string,
    eventData: {
      type: RelationshipEvent["type"];
      details: RelationshipEvent["details"];
      isPrivate?: boolean;
      tags?: string[];
    },
    userId: string,
  ): Promise<string> {
    return chastityEventService.logEvent(relationshipId, eventData, userId);
  }

  async getEvents(
    relationshipId: string,
    limitCount: number = 100,
  ): Promise<RelationshipEvent[]> {
    return chastityEventService.getEvents(relationshipId, limitCount);
  }

  // ==================== REAL-TIME LISTENERS ====================

  subscribeToChastityData(
    relationshipId: string,
    callback: (data: RelationshipChastityData | null) => void,
  ) {
    return relationshipCoreService.subscribeToChastityData(
      relationshipId,
      callback,
    );
  }

  subscribeToTasks(
    relationshipId: string,
    callback: (tasks: RelationshipTask[]) => void,
  ) {
    return chastityTaskService.subscribeToTasks(relationshipId, callback);
  }

  // ==================== HELPER METHODS ====================

  async getKeyholderId(relationshipId: string): Promise<string> {
    return relationshipCoreService.getKeyholderId(relationshipId);
  }
}

// Export singleton instance for backward compatibility
export const relationshipChastityService =
  new RelationshipChastityServiceFacade();

// Log successful split
logger.info(
  "RelationshipChastityService successfully split into domain services",
  {
    services: [
      "RelationshipCoreService",
      "ChastitySessionService",
      "ChastityTaskService",
      "ChastityEventService",
      "RelationshipPermissionService",
    ],
  },
);
