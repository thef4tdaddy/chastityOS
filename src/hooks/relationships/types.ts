/**
 * Shared types and interfaces for relationship hooks
 * Extracted from useRelationships.ts for reuse across focused hooks
 */
import {
  Relationship,
  RelationshipRequest,
  RelationshipChastityData,
  RelationshipTask,
  RelationshipEvent,
  RelationshipSession,
} from "@/types/relationships";

export interface RelationshipState {
  relationships: Relationship[];
  pendingRequests: RelationshipRequest[];
  activeRelationship: Relationship | null;
  chastityData: RelationshipChastityData | null;
  tasks: RelationshipTask[];
  events: RelationshipEvent[];
  sessions: RelationshipSession[];
  isLoading: boolean;
  error: string | null;
  needsMigration: boolean;
}

export interface BaseHookState {
  isLoading: boolean;
  error: string | null;
}

export interface BaseHookActions {
  clearError: () => void;
}
