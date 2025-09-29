/**
 * Relationship Statistics Service
 * Handles statistics and reporting for relationships
 */
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Firestore,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import {
  Relationship,
  RelationshipStatus,
  RelationshipRequest,
  RelationshipRequestStatus,
} from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RelationshipStatsService");

export interface RelationshipStats {
  totalRelationships: number;
  activeRelationships: number;
  pausedRelationships: number;
  endedRelationships: number;
  averageRelationshipDuration?: number; // in days
  longestRelationship?: number; // in days
  shortestRelationship?: number; // in days
}

export interface RelationshipRequestStats {
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
  acceptanceRate: number; // percentage
}

export interface UserRelationshipStats {
  asSubmissive: RelationshipStats;
  asKeyholder: RelationshipStats;
  requestStats: {
    sent: RelationshipRequestStats;
    received: RelationshipRequestStats;
  };
}

export class RelationshipStatsService {
  private db: Firestore | null = null;

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
   * Get comprehensive relationship statistics for a user
   */
  async getUserRelationshipStats(
    userId: string,
  ): Promise<UserRelationshipStats> {
    try {
      const [
        submissiveStats,
        keyholderStats,
        sentRequestStats,
        receivedRequestStats,
      ] = await Promise.all([
        this.getRelationshipStatsForRole(userId, "submissive"),
        this.getRelationshipStatsForRole(userId, "keyholder"),
        this.getRequestStatsForDirection(userId, "sent"),
        this.getRequestStatsForDirection(userId, "received"),
      ]);

      const userStats: UserRelationshipStats = {
        asSubmissive: submissiveStats,
        asKeyholder: keyholderStats,
        requestStats: {
          sent: sentRequestStats,
          received: receivedRequestStats,
        },
      };

      logger.debug("Retrieved user relationship stats", {
        userId,
        stats: userStats,
      });

      return userStats;
    } catch (error) {
      logger.error("Failed to get user relationship stats", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get relationship statistics for a specific role
   */
  private async getRelationshipStatsForRole(
    userId: string,
    role: "submissive" | "keyholder",
  ): Promise<RelationshipStats> {
    try {
      const db = await this.ensureDb();
      const userField = role === "submissive" ? "submissiveId" : "keyholderId";

      const relationshipsQuery = query(
        collection(db, "relationships"),
        where(userField, "==", userId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(relationshipsQuery);
      const relationships = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Relationship[];

      return this.calculateRelationshipStats(relationships);
    } catch (error) {
      logger.error("Failed to get relationship stats for role", {
        error: error as Error,
        userId,
        role,
      });
      throw error;
    }
  }

  /**
   * Calculate statistics from a list of relationships
   */
  private calculateRelationshipStats(
    relationships: Relationship[],
  ): RelationshipStats {
    const stats: RelationshipStats = {
      totalRelationships: relationships.length,
      activeRelationships: 0,
      pausedRelationships: 0,
      endedRelationships: 0,
    };

    if (relationships.length === 0) {
      return stats;
    }

    const durations: number[] = [];
    const now = new Date();

    relationships.forEach((rel) => {
      // Count by status
      switch (rel.status) {
        case RelationshipStatus.ACTIVE:
          stats.activeRelationships++;
          break;
        case RelationshipStatus.PAUSED:
          stats.pausedRelationships++;
          break;
        case RelationshipStatus.ENDED:
          stats.endedRelationships++;
          break;
      }

      // Calculate duration for ended relationships
      if (
        rel.status === RelationshipStatus.ENDED &&
        rel.endedAt &&
        rel.establishedAt
      ) {
        const duration =
          (rel.endedAt.toMillis() - rel.establishedAt.toMillis()) /
          (1000 * 60 * 60 * 24);
        durations.push(duration);
      } else if (
        rel.status === RelationshipStatus.ACTIVE &&
        rel.establishedAt
      ) {
        // For active relationships, calculate current duration
        const duration =
          (now.getTime() - rel.establishedAt.toMillis()) /
          (1000 * 60 * 60 * 24);
        durations.push(duration);
      }
    });

    // Calculate duration statistics
    if (durations.length > 0) {
      stats.averageRelationshipDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      stats.longestRelationship = Math.max(...durations);
      stats.shortestRelationship = Math.min(...durations);
    }

    return stats;
  }

  /**
   * Get request statistics for a specific direction
   */
  private async getRequestStatsForDirection(
    userId: string,
    direction: "sent" | "received",
  ): Promise<RelationshipRequestStats> {
    try {
      const db = await this.ensureDb();
      const userField = direction === "sent" ? "fromUserId" : "toUserId";

      const requestsQuery = query(
        collection(db, "relationshipRequests"),
        where(userField, "==", userId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as RelationshipRequest[];

      return this.calculateRequestStats(requests);
    } catch (error) {
      logger.error("Failed to get request stats for direction", {
        error: error as Error,
        userId,
        direction,
      });
      throw error;
    }
  }

  /**
   * Calculate statistics from a list of relationship requests
   */
  private calculateRequestStats(
    requests: RelationshipRequest[],
  ): RelationshipRequestStats {
    const stats: RelationshipRequestStats = {
      totalRequests: requests.length,
      pendingRequests: 0,
      acceptedRequests: 0,
      rejectedRequests: 0,
      expiredRequests: 0,
      acceptanceRate: 0,
    };

    if (requests.length === 0) {
      return stats;
    }

    requests.forEach((req) => {
      switch (req.status) {
        case RelationshipRequestStatus.PENDING:
          stats.pendingRequests++;
          break;
        case RelationshipRequestStatus.ACCEPTED:
          stats.acceptedRequests++;
          break;
        case RelationshipRequestStatus.REJECTED:
          stats.rejectedRequests++;
          break;
        case RelationshipRequestStatus.EXPIRED:
          stats.expiredRequests++;
          break;
      }
    });

    // Calculate acceptance rate (accepted / (accepted + rejected))
    const decidedRequests = stats.acceptedRequests + stats.rejectedRequests;
    if (decidedRequests > 0) {
      stats.acceptanceRate = (stats.acceptedRequests / decidedRequests) * 100;
    }

    return stats;
  }

  /**
   * Get recent relationship activity for a user
   */
  async getRecentActivity(
    userId: string,
    limitCount: number = 10,
  ): Promise<{
    recentRelationships: Relationship[];
    recentRequests: RelationshipRequest[];
  }> {
    try {
      const db = await this.ensureDb();

      // Get recent relationships (both as submissive and keyholder)
      const [submissiveRels, keyholderRels, sentRequests, receivedRequests] =
        await Promise.all([
          getDocs(
            query(
              collection(db, "relationships"),
              where("submissiveId", "==", userId),
              orderBy("updatedAt", "desc"),
              limit(limitCount),
            ),
          ),
          getDocs(
            query(
              collection(db, "relationships"),
              where("keyholderId", "==", userId),
              orderBy("updatedAt", "desc"),
              limit(limitCount),
            ),
          ),
          getDocs(
            query(
              collection(db, "relationshipRequests"),
              where("fromUserId", "==", userId),
              orderBy("createdAt", "desc"),
              limit(limitCount),
            ),
          ),
          getDocs(
            query(
              collection(db, "relationshipRequests"),
              where("toUserId", "==", userId),
              orderBy("createdAt", "desc"),
              limit(limitCount),
            ),
          ),
        ]);

      // Combine and sort relationships
      const allRelationships = [
        ...submissiveRels.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
        ...keyholderRels.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
      ] as Relationship[];

      const uniqueRelationships = allRelationships
        .filter(
          (rel, index, self) =>
            index === self.findIndex((r) => r.id === rel.id),
        )
        .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())
        .slice(0, limitCount);

      // Combine and sort requests
      const allRequests = [
        ...sentRequests.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
        ...receivedRequests.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
      ] as RelationshipRequest[];

      const uniqueRequests = allRequests
        .filter(
          (req, index, self) =>
            index === self.findIndex((r) => r.id === req.id),
        )
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, limitCount);

      logger.debug("Retrieved recent activity", {
        userId,
        relationshipsCount: uniqueRelationships.length,
        requestsCount: uniqueRequests.length,
      });

      return {
        recentRelationships: uniqueRelationships,
        recentRequests: uniqueRequests,
      };
    } catch (error) {
      logger.error("Failed to get recent activity", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

export const relationshipStatsService = new RelationshipStatsService();
