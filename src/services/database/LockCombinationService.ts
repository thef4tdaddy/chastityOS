/**
 * Lock Combination Service
 * Handles encryption/decryption and storage of physical lock combinations
 * for hardcore mode sessions
 */
import { db } from "../storage/ChastityDB";
import { serviceLogger } from "../../utils/logging";
import type { SyncStatus } from "../../types/database";

const logger = serviceLogger("LockCombinationService");

export interface DBLockCombination {
  id: string;
  userId: string;
  sessionId: string;
  encryptedCombination: string; // Encrypted with emergency PIN
  createdAt: Date;
  lastModified: Date;
  syncStatus: SyncStatus;
}

export class LockCombinationService {
  /**
   * Encrypt a lock combination with the user's emergency PIN
   * Uses AES-GCM encryption for security
   */
  private static async encryptCombination(
    combination: string,
    pin: string,
  ): Promise<string> {
    try {
      const encoder = new TextEncoder();

      // Derive encryption key from PIN using PBKDF2
      const pinBuffer = encoder.encode(pin);
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        pinBuffer,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"],
      );

      // Use a salt (in production, store this per-user)
      const salt = encoder.encode("chastityos-lock-combination-salt");

      // Derive AES key
      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );

      // Generate IV (initialization vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the combination
      const combinationBuffer = encoder.encode(combination);
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        combinationBuffer,
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error("Failed to encrypt combination", { error: error as Error });
      throw new Error("Failed to encrypt lock combination");
    }
  }

  /**
   * Decrypt a lock combination with the user's emergency PIN
   */
  private static async decryptCombination(
    encryptedCombination: string,
    pin: string,
  ): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedCombination), (c) =>
        c.charCodeAt(0),
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Derive encryption key from PIN (same process as encryption)
      const pinBuffer = encoder.encode(pin);
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        pinBuffer,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"],
      );

      const salt = encoder.encode("chastityos-lock-combination-salt");

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        encryptedData,
      );

      return decoder.decode(decryptedBuffer);
    } catch (error) {
      logger.error("Failed to decrypt combination", { error: error as Error });
      throw new Error("Failed to decrypt lock combination - invalid PIN?");
    }
  }

  /**
   * Save a lock combination for a hardcore mode session
   */
  static async saveCombination(
    userId: string,
    sessionId: string,
    combination: string,
    pin: string,
  ): Promise<DBLockCombination> {
    try {
      const encryptedCombination = await this.encryptCombination(
        combination,
        pin,
      );
      const now = new Date();

      const lockCombination: DBLockCombination = {
        id: `${userId}-${sessionId}`,
        userId,
        sessionId,
        encryptedCombination,
        createdAt: now,
        lastModified: now,
        syncStatus: "pending",
      };

      await db.lockCombinations.put(lockCombination);

      logger.info("Lock combination saved", { userId, sessionId });
      return lockCombination;
    } catch (error) {
      logger.error("Failed to save lock combination", {
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Retrieve and decrypt a lock combination
   */
  static async getCombination(
    userId: string,
    sessionId: string,
    pin: string,
  ): Promise<string | null> {
    try {
      const lockCombination = await db.lockCombinations.get(
        `${userId}-${sessionId}`,
      );

      if (!lockCombination) {
        logger.debug("No lock combination found", { userId, sessionId });
        return null;
      }

      const decrypted = await this.decryptCombination(
        lockCombination.encryptedCombination,
        pin,
      );

      logger.info("Lock combination retrieved", { userId, sessionId });
      return decrypted;
    } catch (error) {
      logger.error("Failed to retrieve lock combination", {
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Check if a session has a saved lock combination
   */
  static async hasCombination(
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    try {
      const combination = await db.lockCombinations.get(
        `${userId}-${sessionId}`,
      );
      return !!combination;
    } catch (error) {
      logger.error("Failed to check lock combination existence", {
        error: error as Error,
      });
      return false;
    }
  }

  /**
   * Delete a lock combination (called when session ends normally)
   */
  static async deleteCombination(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    try {
      await db.lockCombinations.delete(`${userId}-${sessionId}`);
      logger.info("Lock combination deleted", { userId, sessionId });
    } catch (error) {
      logger.error("Failed to delete lock combination", {
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Delete all lock combinations for a user
   */
  static async deleteAllUserCombinations(userId: string): Promise<void> {
    try {
      const combinations = await db.lockCombinations
        .where("userId")
        .equals(userId)
        .toArray();

      for (const combo of combinations) {
        await db.lockCombinations.delete(combo.id);
      }

      logger.info("All user lock combinations deleted", { userId });
    } catch (error) {
      logger.error("Failed to delete user lock combinations", {
        error: error as Error,
      });
      throw error;
    }
  }
}
