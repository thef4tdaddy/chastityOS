/**
 * Relationship Service for Dual-Account Keyholder System
 * Handles all operations related to relationships between submissives and keyholders
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import {
  Relationship,
  RelationshipRequest,
  RelationshipStatus,
  RelationshipRequestStatus,
  RelationshipPermissions,
  RelationshipChastityData,
  DefaultRelationshipPermissions,
} from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("RelationshipService");

/**
 * Default permissions for new relationships
 */
export const getDefaultPermissions = (): DefaultRelationshipPermissions => ({
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

class RelationshipService {
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

  // ==================== RELATIONSHIP REQUESTS ====================

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
      const existingRelationship = await this.getRelationshipBetweenUsers(
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

  // ==================== RELATIONSHIP MANAGEMENT ====================

  /**
   * Get relationships for a user (both as submissive and keyholder)
   */
  async getUserRelationships(userId: string): Promise<Relationship[]> {
    try {
      const db = await this.ensureDb();

      // Get relationships where user is submissive
      const submissiveRelationships = await getDocs(
        query(
          collection(db, "relationships"),
          where("submissiveId", "==", userId),
          orderBy("createdAt", "desc"),
        ),
      );

      // Get relationships where user is keyholder
      const keyholderRelationships = await getDocs(
        query(
          collection(db, "relationships"),
          where("keyholderId", "==", userId),
          orderBy("createdAt", "desc"),
        ),
      );

      const allRelationships = [
        ...submissiveRelationships.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })),
        ...keyholderRelationships.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })),
      ] as Relationship[];

      // Remove duplicates (shouldn't happen but just in case)
      const uniqueRelationships = allRelationships.filter(
        (rel, index, self) => index === self.findIndex((r) => r.id === rel.id),
      );

      logger.debug("Retrieved user relationships", {
        userId,
        count: uniqueRelationships.length,
      });

      return uniqueRelationships;
    } catch (error) {
      logger.error("Failed to get user relationships", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get a specific relationship by ID
   */
  async getRelationship(relationshipId: string): Promise<Relationship | null> {
    try {
      const db = await this.ensureDb();

      const doc = await getDoc(
        db.collection("relationships").doc(relationshipId),
      );
      if (!doc.exists()) {
        return null;
      }

      const relationship = {
        ...doc.data(),
        id: doc.id,
      } as Relationship;

      logger.debug("Retrieved relationship", { relationshipId });
      return relationship;
    } catch (error) {
      logger.error("Failed to get relationship", {
        error: error as Error,
        relationshipId,
      });
      throw error;
    }
  }

  /**
   * Get relationship between two specific users
   */
  async getRelationshipBetweenUsers(
    user1Id: string,
    user2Id: string,
  ): Promise<Relationship | null> {
    try {
      const db = await this.ensureDb();

      // Check both directions (user1 as submissive, user2 as keyholder)
      let relationshipQuery = query(
        collection(db, "relationships"),
        where("submissiveId", "==", user1Id),
        where("keyholderId", "==", user2Id),
      );

      let relationships = await getDocs(relationshipQuery);

      if (relationships.empty) {
        // Check the other direction (user2 as submissive, user1 as keyholder)
        relationshipQuery = query(
          collection(db, "relationships"),
          where("submissiveId", "==", user2Id),
          where("keyholderId", "==", user1Id),
        );

        relationships = await getDocs(relationshipQuery);
      }

      if (relationships.empty) {
        return null;
      }

      const relationship = {
        ...relationships.docs[0].data(),
        id: relationships.docs[0].id,
      } as Relationship;

      logger.debug("Retrieved relationship between users", {
        user1Id,
        user2Id,
        relationshipId: relationship.id,
      });

      return relationship;
    } catch (error) {
      logger.error("Failed to get relationship between users", {
        error: error as Error,
        user1Id,
        user2Id,
      });
      throw error;
    }
  }

  /**
   * Update relationship permissions
   */
  async updateRelationshipPermissions(
    relationshipId: string,
    permissions: RelationshipPermissions,
    updatingUserId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Get the relationship to verify the user can update permissions
      const relationship = await this.getRelationship(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Only keyholder can modify permissions
      if (relationship.keyholderId !== updatingUserId) {
        throw new Error("Only keyholder can modify permissions");
      }

      await updateDoc(doc(db, "relationships", relationshipId), {
        permissions,
        updatedAt: serverTimestamp(),
      });

      logger.info("Updated relationship permissions", {
        relationshipId,
        updatingUserId,
      });
    } catch (error) {
      logger.error("Failed to update relationship permissions", {
        error: error as Error,
        relationshipId,
        updatingUserId,
      });
      throw error;
    }
  }

  /**
   * End a relationship
   */
  async endRelationship(
    relationshipId: string,
    endingUserId: string,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();

      // Get the relationship to verify the user can end it
      const relationship = await this.getRelationship(relationshipId);
      if (!relationship) {
        throw new Error("Relationship not found");
      }

      // Both parties can end the relationship
      if (
        relationship.submissiveId !== endingUserId &&
        relationship.keyholderId !== endingUserId
      ) {
        throw new Error(
          "Only relationship participants can end the relationship",
        );
      }

      await updateDoc(doc(db, "relationships", relationshipId), {
        status: RelationshipStatus.ENDED,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      logger.info("Relationship ended", {
        relationshipId,
        endingUserId,
      });
    } catch (error) {
      logger.error("Failed to end relationship", {
        error: error as Error,
        relationshipId,
        endingUserId,
      });
      throw error;
    }
  }

  // ==================== CHASTITY DATA INITIALIZATION ====================

  /**
   * Initialize chastity data for a new relationship
   */
  private async initializeChastityData(
    relationshipId: string,
    submissiveId: string,
    keyholderId: string,
    batch?: any,
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      const useBatch = batch || writeBatch(db);

      const chastityData: Omit<
        RelationshipChastityData,
        "createdAt" | "updatedAt"
      > = {
        relationshipId,
        submissiveId,
        keyholderId,
        currentSession: {
          id: "",
          isActive: false,
          startTime: serverTimestamp() as any,
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

  // ==================== PERMISSION CHECKS ====================

  /**
   * Check if a user has permission to perform an action in a relationship
   */
  async checkPermission(
    relationshipId: string,
    userId: string,
    action:
      | keyof RelationshipPermissions["keyholderCanEdit"]
      | "pauseSession"
      | "emergencyUnlock",
  ): Promise<boolean> {
    try {
      const relationship = await this.getRelationship(relationshipId);
      if (!relationship) {
        return false;
      }

      const isSubmissive = relationship.submissiveId === userId;
      const isKeyholder = relationship.keyholderId === userId;

      if (!isSubmissive && !isKeyholder) {
        return false;
      }

      // Check specific permissions
      if (action === "pauseSession") {
        return isSubmissive && relationship.permissions.submissiveCanPause;
      }

      if (action === "emergencyUnlock") {
        return isSubmissive && relationship.permissions.emergencyUnlock;
      }

      // For keyholder edit permissions
      if (isKeyholder && action in relationship.permissions.keyholderCanEdit) {
        return relationship.permissions.keyholderCanEdit[
          action as keyof RelationshipPermissions["keyholderCanEdit"]
        ];
      }

      return false;
    } catch (error) {
      logger.error("Failed to check permission", {
        error: error as Error,
        relationshipId,
        userId,
        action,
      });
      return false;
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  /**
   * Listen to relationship changes for a user
   */
  subscribeToUserRelationships(
    userId: string,
    callback: (relationships: Relationship[]) => void,
  ): Unsubscribe {
    const unsubscribers: Unsubscribe[] = [];

    const handleRelationships = async () => {
      try {
        const relationships = await this.getUserRelationships(userId);
        callback(relationships);
      } catch (error) {
        logger.error("Error in relationship subscription", {
          error: error as Error,
          userId,
        });
      }
    };

    // Set up real-time listeners
    this.ensureDb().then((db) => {
      // Listen to relationships where user is submissive
      const submissiveUnsub = onSnapshot(
        query(
          collection(db, "relationships"),
          where("submissiveId", "==", userId),
        ),
        handleRelationships,
      );

      // Listen to relationships where user is keyholder
      const keyholderUnsub = onSnapshot(
        query(
          collection(db, "relationships"),
          where("keyholderId", "==", userId),
        ),
        handleRelationships,
      );

      unsubscribers.push(submissiveUnsub, keyholderUnsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }
}

export const relationshipService = new RelationshipService();
