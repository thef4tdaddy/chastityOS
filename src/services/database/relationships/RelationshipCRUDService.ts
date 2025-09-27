/**
 * Relationship CRUD Service
 * Handles basic Create, Read, Update, Delete operations for relationships
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { getFirestore } from "@/services/firebase";
import { Relationship, RelationshipStatus } from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RelationshipCRUDService");

export class RelationshipCRUDService {
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

      const relationshipDoc = await getDoc(
        doc(db, "relationships", relationshipId),
      );

      if (!relationshipDoc.exists()) {
        return null;
      }

      const relationship = {
        ...relationshipDoc.data(),
        id: relationshipDoc.id,
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

      const firstDoc = relationships.docs[0];
      if (!firstDoc) {
        return null;
      }

      const relationship = {
        ...firstDoc.data(),
        id: firstDoc.id,
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

export const relationshipCRUDService = new RelationshipCRUDService();
