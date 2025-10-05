/**
 * Release Request Database Service
 * Handles "Beg for Release" requests between submissives and keyholders
 */
import { db } from "../storage/ChastityDB";
import { BaseDBService } from "./BaseDBService";
import type { DBReleaseRequest } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { v4 as uuidv4 } from "uuid";

const logger = serviceLogger("ReleaseRequestDBService");

class ReleaseRequestDBService extends BaseDBService<DBReleaseRequest> {
  constructor() {
    super(db.releaseRequests);
  }

  /**
   * Create a new release request
   */
  async createRequest(params: {
    submissiveUserId: string;
    keyholderUserId: string;
    sessionId: string;
    reason?: string;
  }): Promise<string> {
    try {
      // Check for existing pending request for this session
      const existingRequest = await this.table
        .where({ sessionId: params.sessionId, status: "pending" })
        .first();

      if (existingRequest) {
        logger.warn("Pending request already exists for session", {
          sessionId: params.sessionId,
        });
        throw new Error(
          "A pending release request already exists for this session",
        );
      }

      const request: DBReleaseRequest = {
        id: uuidv4(),
        submissiveUserId: params.submissiveUserId,
        keyholderUserId: params.keyholderUserId,
        sessionId: params.sessionId,
        requestedAt: new Date(),
        status: "pending",
        reason: params.reason,
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await this.table.add(request);

      logger.info("Release request created", {
        requestId: request.id,
        sessionId: params.sessionId,
      });

      return request.id;
    } catch (error) {
      logger.error("Failed to create release request", {
        error: error as Error,
        params,
      });
      throw error;
    }
  }

  /**
   * Get all pending requests for a keyholder
   */
  async getPendingRequests(
    keyholderUserId: string,
  ): Promise<DBReleaseRequest[]> {
    try {
      const requests = await this.table
        .where({ keyholderUserId, status: "pending" })
        .reverse()
        .sortBy("requestedAt");

      logger.debug("Retrieved pending requests", {
        keyholderUserId,
        count: requests.length,
      });

      return requests;
    } catch (error) {
      logger.error("Failed to get pending requests", {
        error: error as Error,
        keyholderUserId,
      });
      throw error;
    }
  }

  /**
   * Get all requests for a specific session
   */
  async getRequestsForSession(sessionId: string): Promise<DBReleaseRequest[]> {
    try {
      const requests = await this.table
        .where("sessionId")
        .equals(sessionId)
        .reverse()
        .sortBy("requestedAt");

      logger.debug("Retrieved requests for session", {
        sessionId,
        count: requests.length,
      });

      return requests;
    } catch (error) {
      logger.error("Failed to get requests for session", {
        error: error as Error,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get pending request for a session (if exists)
   */
  async getPendingRequestForSession(
    sessionId: string,
  ): Promise<DBReleaseRequest | undefined> {
    try {
      const request = await this.table
        .where({ sessionId, status: "pending" })
        .first();

      logger.debug("Retrieved pending request for session", {
        sessionId,
        found: !!request,
      });

      return request;
    } catch (error) {
      logger.error("Failed to get pending request for session", {
        error: error as Error,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Approve a release request
   */
  async approveRequest(
    requestId: string,
    keyholderResponse?: string,
  ): Promise<void> {
    try {
      const request = await this.findById(requestId);

      if (!request) {
        throw new Error("Release request not found");
      }

      if (request.status !== "pending") {
        throw new Error(
          `Cannot approve request with status: ${request.status}`,
        );
      }

      await this.table.update(requestId, {
        status: "approved",
        approvedAt: new Date(),
        keyholderResponse,
        syncStatus: "pending",
        lastModified: new Date(),
      });

      logger.info("Release request approved", {
        requestId,
        sessionId: request.sessionId,
      });
    } catch (error) {
      logger.error("Failed to approve release request", {
        error: error as Error,
        requestId,
      });
      throw error;
    }
  }

  /**
   * Deny a release request
   */
  async denyRequest(
    requestId: string,
    keyholderResponse?: string,
  ): Promise<void> {
    try {
      const request = await this.findById(requestId);

      if (!request) {
        throw new Error("Release request not found");
      }

      if (request.status !== "pending") {
        throw new Error(`Cannot deny request with status: ${request.status}`);
      }

      await this.table.update(requestId, {
        status: "denied",
        deniedAt: new Date(),
        keyholderResponse,
        syncStatus: "pending",
        lastModified: new Date(),
      });

      logger.info("Release request denied", {
        requestId,
        sessionId: request.sessionId,
      });
    } catch (error) {
      logger.error("Failed to deny release request", {
        error: error as Error,
        requestId,
      });
      throw error;
    }
  }

  /**
   * Cancel a pending request (submissive side)
   */
  async cancelRequest(requestId: string): Promise<void> {
    try {
      const request = await this.findById(requestId);

      if (!request) {
        throw new Error("Release request not found");
      }

      if (request.status !== "pending") {
        throw new Error(`Cannot cancel request with status: ${request.status}`);
      }

      await this.table.delete(requestId);

      logger.info("Release request cancelled", {
        requestId,
        sessionId: request.sessionId,
      });
    } catch (error) {
      logger.error("Failed to cancel release request", {
        error: error as Error,
        requestId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const releaseRequestDBService = new ReleaseRequestDBService();
