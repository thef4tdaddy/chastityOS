/**
 * Emergency PIN Database Service
 * Handles storage and validation of emergency unlock PINs for hardcore mode
 */
import { db } from "../storage/ChastityDB";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("EmergencyPinDBService");

interface DBEmergencyPin {
  userId: string;
  hashedPin: string; // Hashed PIN for security
  createdAt: Date;
  lastModified: Date;
}

export class EmergencyPinDBService {
  /**
   * Hash a PIN using a simple hash function
   * Note: In production, use a proper hashing library like bcrypt
   */
  private static async hashPin(pin: string): Promise<string> {
    // Simple hash for now - replace with bcrypt in production
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Set or update emergency PIN for a user
   */
  static async setEmergencyPin(
    userId: string,
    pin: string,
  ): Promise<DBEmergencyPin> {
    try {
      const hashedPin = await this.hashPin(pin);
      const now = new Date();

      const emergencyPin: DBEmergencyPin = {
        userId,
        hashedPin,
        createdAt: now,
        lastModified: now,
      };

      await db.emergencyPins.put(emergencyPin);

      logger.info("Emergency PIN set successfully", { userId });
      return emergencyPin;
    } catch (error) {
      logger.error("Failed to set emergency PIN", { error: error as Error });
      throw error;
    }
  }

  /**
   * Validate emergency PIN for a user
   */
  static async validatePin(userId: string, pin: string): Promise<boolean> {
    try {
      const storedPin = await db.emergencyPins.get(userId);

      if (!storedPin) {
        logger.warn("No emergency PIN found for user", { userId });
        return false;
      }

      const hashedAttempt = await this.hashPin(pin);
      const isValid = hashedAttempt === storedPin.hashedPin;

      if (isValid) {
        logger.info("Emergency PIN validated successfully", { userId });
      } else {
        logger.warn("Invalid emergency PIN attempt", { userId });
      }

      return isValid;
    } catch (error) {
      logger.error("Failed to validate emergency PIN", {
        error: error as Error,
      });
      return false;
    }
  }

  /**
   * Check if user has an emergency PIN set
   */
  static async hasEmergencyPin(userId: string): Promise<boolean> {
    try {
      const pin = await db.emergencyPins.get(userId);
      return !!pin;
    } catch (error) {
      logger.error("Failed to check emergency PIN existence", {
        error: error as Error,
      });
      return false;
    }
  }

  /**
   * Remove emergency PIN for a user
   */
  static async removeEmergencyPin(userId: string): Promise<void> {
    try {
      await db.emergencyPins.delete(userId);
      logger.info("Emergency PIN removed", { userId });
    } catch (error) {
      logger.error("Failed to remove emergency PIN", { error: error as Error });
      throw error;
    }
  }

  /**
   * Get emergency PIN info (without revealing the actual PIN)
   */
  static async getEmergencyPinInfo(
    userId: string,
  ): Promise<{ exists: boolean; createdAt?: Date } | null> {
    try {
      const pin = await db.emergencyPins.get(userId);

      if (!pin) {
        return { exists: false };
      }

      return {
        exists: true,
        createdAt: pin.createdAt,
      };
    } catch (error) {
      logger.error("Failed to get emergency PIN info", {
        error: error as Error,
      });
      return null;
    }
  }
}
