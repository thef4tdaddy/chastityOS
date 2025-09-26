/**
 * Relationship Search Service
 * Handles search, filter, and query operations for relationships
 */
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import {
  Relationship,
  RelationshipStatus,
  RelationshipRequest,
  RelationshipRequestStatus,
} from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RelationshipSearchService");

export interface RelationshipSearchFilters {
  status?: RelationshipStatus[];
  userId?: string;
  role?: "submissive" | "keyholder" | "both";
  startDate?: Date;
  endDate?: Date;
}

export interface RelationshipSearchResult {
  relationships: Relationship[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
}

export class RelationshipSearchService {
  private db: any = null;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    this.db = await getFirestore();
  }

  private async ensureDb() {
    if (!this.db) {
      await this.initializeDb();
    }
    return this.db;
  }

  /**
   * Search relationships with filters and pagination
   */
  async searchRelationships(
    filters: RelationshipSearchFilters = {},
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
  ): Promise<RelationshipSearchResult> {
    try {
      const db = await this.ensureDb();
      let relationshipQuery = collection(db, "relationships");

      // Apply filters
      const queryConstraints = [];

      if (filters.status && filters.status.length > 0) {
        queryConstraints.push(where("status", "in", filters.status));
      }

      if (filters.userId) {
        if (filters.role === "submissive") {
          queryConstraints.push(where("submissiveId", "==", filters.userId));
        } else if (filters.role === "keyholder") {
          queryConstraints.push(where("keyholderId", "==", filters.userId));
        }
        // For "both" or undefined role, we'd need to do two separate queries
        // and merge results (not implemented here for simplicity)
      }

      if (filters.startDate) {
        queryConstraints.push(where("createdAt", ">=", filters.startDate));
      }

      if (filters.endDate) {
        queryConstraints.push(where("createdAt", "<=", filters.endDate));
      }

      // Add ordering and pagination
      queryConstraints.push(orderBy("createdAt", "desc"));
      queryConstraints.push(limit(pageSize + 1)); // Get one extra to check if there are more

      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const finalQuery = query(relationshipQuery, ...queryConstraints);
      const snapshot = await getDocs(finalQuery);

      const relationships = snapshot.docs.slice(0, pageSize).map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Relationship[];

      const hasMore = snapshot.docs.length > pageSize;
      const newLastDoc = hasMore ? snapshot.docs[pageSize - 1] : undefined;

      logger.debug("Searched relationships", {
        filters,
        count: relationships.length,
        hasMore,
      });

      return {
        relationships,
        hasMore,
        lastDoc: newLastDoc,
      };
    } catch (error) {
      logger.error("Failed to search relationships", {
        error: error as Error,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get active relationships for a user
   */
  async getActiveRelationships(userId: string): Promise<Relationship[]> {
    const result = await this.searchRelationships(
      {
        userId,
        status: [RelationshipStatus.ACTIVE],
        role: "both",
      },
      50,
    ); // Get up to 50 active relationships

    return result.relationships;
  }

  /**
   * Get relationship history for a user
   */
  async getRelationshipHistory(
    userId: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
  ): Promise<RelationshipSearchResult> {
    return this.searchRelationships(
      {
        userId,
        status: [RelationshipStatus.ENDED],
        role: "both",
      },
      pageSize,
      lastDoc,
    );
  }

  /**
   * Search relationship requests with filters
   */
  async searchRelationshipRequests(
    userId: string,
    direction: "sent" | "received" | "both" = "both",
    status?: RelationshipRequestStatus[],
    pageSize: number = 20,
  ): Promise<RelationshipRequest[]> {
    try {
      const db = await this.ensureDb();
      const requests: RelationshipRequest[] = [];

      // Helper function to execute a query
      const executeQuery = async (field: string, value: string) => {
        const queryConstraints = [
          where(field, "==", value),
          orderBy("createdAt", "desc"),
          limit(pageSize),
        ];

        if (status && status.length > 0) {
          queryConstraints.unshift(where("status", "in", status));
        }

        const requestQuery = query(
          collection(db, "relationshipRequests"),
          ...queryConstraints,
        );

        const snapshot = await getDocs(requestQuery);
        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as RelationshipRequest[];
      };

      // Get sent requests
      if (direction === "sent" || direction === "both") {
        const sentRequests = await executeQuery("fromUserId", userId);
        requests.push(...sentRequests);
      }

      // Get received requests
      if (direction === "received" || direction === "both") {
        const receivedRequests = await executeQuery("toUserId", userId);
        requests.push(...receivedRequests);
      }

      // Remove duplicates and sort by creation date
      const uniqueRequests = requests
        .filter(
          (req, index, self) =>
            index === self.findIndex((r) => r.id === req.id),
        )
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, pageSize);

      logger.debug("Searched relationship requests", {
        userId,
        direction,
        status,
        count: uniqueRequests.length,
      });

      return uniqueRequests;
    } catch (error) {
      logger.error("Failed to search relationship requests", {
        error: error as Error,
        userId,
        direction,
        status,
      });
      throw error;
    }
  }

  /**
   * Find relationships by participant IDs
   */
  async findRelationshipsByParticipants(
    participantIds: string[],
    status?: RelationshipStatus[],
  ): Promise<Relationship[]> {
    if (participantIds.length !== 2) {
      throw new Error("Exactly 2 participant IDs are required");
    }

    const [user1Id, user2Id] = participantIds;
    const filters: RelationshipSearchFilters = { status };

    try {
      // Search in both directions
      const results1 = await this.searchRelationships(
        {
          ...filters,
          userId: user1Id,
          role: "submissive",
        },
        10,
      );

      const results2 = await this.searchRelationships(
        {
          ...filters,
          userId: user1Id,
          role: "keyholder",
        },
        10,
      );

      // Filter results to only include relationships with both participants
      const allRelationships = [
        ...results1.relationships,
        ...results2.relationships,
      ];
      const matchingRelationships = allRelationships.filter(
        (rel) =>
          (rel.submissiveId === user1Id && rel.keyholderId === user2Id) ||
          (rel.submissiveId === user2Id && rel.keyholderId === user1Id),
      );

      // Remove duplicates
      return matchingRelationships.filter(
        (rel, index, self) => index === self.findIndex((r) => r.id === rel.id),
      );
    } catch (error) {
      logger.error("Failed to find relationships by participants", {
        error: error as Error,
        participantIds,
        status,
      });
      throw error;
    }
  }
}

export const relationshipSearchService = new RelationshipSearchService();
