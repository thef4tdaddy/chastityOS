/**
 * Relationship Invitation Service
 * Handles relationship request operations (invitations)
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Firestore,
  WriteBatch,
  FieldValue,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import {
  Relationship,
  RelationshipRequest,
  RelationshipStatus,
  RelationshipRequestStatus,
  DefaultRelationshipPermissions,
} from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";
import { relationshipCRUDService } from "./RelationshipCRUDService";

const logger = serviceLogger("RelationshipInviteService");

/**
 * Default permissions for new relationships
 */
const getDefaultPermissions = (): DefaultRelationshipPermissions => ({
  keyholderCanEdit: {
    sessions: true,
    tasks: true,
    goals: true,
    punishments: true,
    settings: false, // Keep settings private by default
  },
  submissiveCanPause: true,
  emergencyUnlock: true,
  requireApproval: {
    sessionEnd: false,
    taskCompletion: true,
    goalChanges: true,
  },
});

export class RelationshipInviteService {
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
   * Send a relationship request to another user
   */
  async sendRelationshipRequest(
    fromUserId: string,
    toUserId: string,
    fromRole: "submissive" | "keyholder",
    message?: string,
  ): Promise<string> {
    try {
      const db = await this.ensureDb();
      const requestId = generateUUID();

      // Check if a request already exists between these users
      const existingRequests = await getDocs(
        query(
          collection(db, "relationshipRequests"),
          where("fromUserId", "==", fromUserId),
          where("toUserId", "==", toUserId),
          where("status", "==", RelationshipRequestStatus.PENDING),
        ),
      );

      if (!existingRequests.empty) {
        throw new Error("A pending request already exists between these users");
      }

      // Check if they already have an active relationship
      const existingRelationship =
        await relationshipCRUDService.getRelationshipBetweenUsers(
          fromUserId,
          toUserId,
        );
      if (
        existingRelationship &&
        existingRelationship.status === RelationshipStatus.ACTIVE
      ) {
        throw new Error(
          "An active relationship already exists between these users",
        );
      }

      const toRole = fromRole === "submissive" ? "keyholder" : "submissive";
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Expire in 7 days

      const request: Omit<RelationshipRequest, "createdAt" | "expiresAt"> = {
        id: requestId,
        fromUserId,
        toUserId,
        fromRole,
        toRole,
        status: RelationshipRequestStatus.PENDING,
        message,
      };

      await addDoc(collection(db, "relationshipRequests"), {
        ...request,
        createdAt: serverTimestamp(),
        expiresAt: expirationDate,
      });

      logger.info("Relationship request sent", {
        requestId,
        fromUserId,
        toUserId,
        fromRole,
        toRole,
      });

      return requestId;
    } catch (error) {
      logger.error("Failed to send relationship request", {
        error: error as Error,
        fromUserId,
        toUserId,
        fromRole,
      });
      throw error;
    }
  }

  /**
   * Accept a relationship request
   */
  async acceptRelationshipRequest(
    requestId: string,
    acceptingUserId: string,
  ): Promise<string> {
    try {
      const db = await this.ensureDb();
      const batch = writeBatch(db);

      // Get the request
      const requestDoc = await getDoc(
        doc(db, "relationshipRequests", requestId),
      );
      if (!requestDoc.exists()) {
        throw new Error("Relationship request not found");
      }

      const request = requestDoc.data() as RelationshipRequest;

      // Verify the accepting user is the target of the request
      if (request.toUserId !== acceptingUserId) {
        throw new Error("Only the target user can accept this request");
      }

      // Verify request is still pending
      if (request.status !== RelationshipRequestStatus.PENDING) {
        throw new Error("Request is no longer pending");
      }

      // Create the relationship
      const relationshipId = generateUUID();
      const submissiveId =
        request.toRole === "submissive" ? request.toUserId : request.fromUserId;
      const keyholderId =
        request.toRole === "keyholder" ? request.toUserId : request.fromUserId;

      const relationship: Omit<
        Relationship,
        "createdAt" | "updatedAt" | "establishedAt"
      > = {
        id: relationshipId,
        submissiveId,
        keyholderId,
        status: RelationshipStatus.ACTIVE,
        permissions: getDefaultPermissions(),
        notes: request.message,
      };

      // Add relationship to batch
      batch.set(doc(db, "relationships", relationshipId), {
        ...relationship,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        establishedAt: serverTimestamp(),
      });

      // Update request status
      batch.update(doc(db, "relationshipRequests", requestId), {
        status: RelationshipRequestStatus.ACCEPTED,
        respondedAt: serverTimestamp(),
      });

      // Initialize chastity data for the relationship
      await this.initializeChastityData(
        relationshipId,
        submissiveId,
        keyholderId,
        batch,
      );

      // Commit all changes
      await batch.commit();

      logger.info("Relationship request accepted", {
        requestId,
        relationshipId,
        submissiveId,
        keyholderId,
      });

      return relationshipId;
    } catch (error) {
      logger.error("Failed to accept relationship request", {
        error: error as Error,
        requestId,
        acceptingUserId,
      });
      throw error;
    }
  }

  /**
   * Reject a relationship request
   */
  async rejectRelationshipRequest(
    requestId: string,
    rejectingUserId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Get the request
      const requestDoc = await getDoc(
        doc(db, "relationshipRequests", requestId),
      );
      if (!requestDoc.exists()) {
        throw new Error("Relationship request not found");
      }

      const request = requestDoc.data() as RelationshipRequest;

      // Verify the rejecting user is the target of the request
      if (request.toUserId !== rejectingUserId) {
        throw new Error("Only the target user can reject this request");
      }

      // Update request status
      await updateDoc(doc(db, "relationshipRequests", requestId), {
        status: RelationshipRequestStatus.REJECTED,
        respondedAt: serverTimestamp(),
      });

      logger.info("Relationship request rejected", {
        requestId,
        rejectingUserId,
      });
    } catch (error) {
      logger.error("Failed to reject relationship request", {
        error: error as Error,
        requestId,
        rejectingUserId,
      });
      throw error;
    }
  }

  /**
   * Get pending requests for a user
   */
  async getPendingRequests(userId: string): Promise<RelationshipRequest[]> {
    try {
      const db = await this.ensureDb();

      const requests = await getDocs(
        query(
          collection(db, "relationshipRequests"),
          where("toUserId", "==", userId),
          where("status", "==", RelationshipRequestStatus.PENDING),
          orderBy("createdAt", "desc"),
        ),
      );

      const result = requests.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as RelationshipRequest[];

      logger.debug("Retrieved pending requests", {
        userId,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error("Failed to get pending requests", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Initialize chastity data for a new relationship
   */
  private async initializeChastityData(
    relationshipId: string,
    submissiveId: string,
    keyholderId: string,
    batch?: WriteBatch,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      const useBatch = batch || writeBatch(db);

      const chastityData = {
        relationshipId,
        submissiveId,
        keyholderId,
        currentSession: {
          id: "",
          isActive: false,
          startTime: serverTimestamp() as FieldValue,
          accumulatedPauseTime: 0,
          keyholderApprovalRequired: false,
        },
        goals: {
          personal: {
            duration: 0,
            type: "soft",
            setBy: "submissive",
          },
          keyholder: {
            minimumDuration: 0,
            canBeModified: true,
          },
        },
        settings: {
          allowPausing: true,
          pauseCooldown: 300, // 5 minutes
          requireReasonForEnd: false,
          trackingEnabled: true,
        },
      };

      useBatch.set(doc(db, "chastityData", relationshipId), {
        ...chastityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (!batch) {
        await useBatch.commit();
      }

      logger.info("Initialized chastity data", {
        relationshipId,
        submissiveId,
        keyholderId,
      });
    } catch (error) {
      logger.error("Failed to initialize chastity data", {
        error: error as Error,
        relationshipId,
        submissiveId,
        keyholderId,
      });
      throw error;
    }
  }
}

export const relationshipInviteService = new RelationshipInviteService();
