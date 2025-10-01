/**
 * Helper functions for relationship task operations
 */
import { relationshipChastityService } from "@/services/database/RelationshipChastityService";
import { RelationshipTask, RelationshipEvent } from "@/types/relationships";

/**
 * Load tasks for a relationship
 */
export const loadTasksFromService = async (
  relationshipId: string,
): Promise<RelationshipTask[]> => {
  return await relationshipChastityService.getTasks(relationshipId);
};

/**
 * Load events for a relationship
 */
export const loadEventsFromService = async (
  relationshipId: string,
): Promise<RelationshipEvent[]> => {
  return await relationshipChastityService.getEvents(relationshipId);
};

/**
 * Create a new task
 */
export const createTaskInService = async (
  relationshipId: string,
  taskData: {
    text: string;
    dueDate?: Date;
    consequence?: RelationshipTask["consequence"];
  },
  userId: string,
): Promise<void> => {
  await relationshipChastityService.createTask(
    relationshipId,
    taskData,
    userId,
  );
};

/**
 * Update task status
 */
export const updateTaskStatusInService = async (
  relationshipId: string,
  taskId: string,
  status: RelationshipTask["status"],
  userId: string,
  note?: string,
): Promise<void> => {
  await relationshipChastityService.updateTaskStatus(
    relationshipId,
    taskId,
    status,
    userId,
    note,
  );
};

/**
 * Log an event
 */
export const logEventInService = async (
  relationshipId: string,
  eventData: {
    type: RelationshipEvent["type"];
    details: RelationshipEvent["details"];
    isPrivate?: boolean;
    tags?: string[];
  },
  userId: string,
): Promise<void> => {
  await relationshipChastityService.logEvent(relationshipId, eventData, userId);
};
