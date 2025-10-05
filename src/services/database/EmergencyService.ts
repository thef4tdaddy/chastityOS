/**
 * Emergency Service
 * Handles emergency unlock operations with safety confirmations and audit trails
 */
import { sessionDBService } from "./SessionDBService";
import { eventDBService } from "./EventDBService";
import { settingsDBService } from "./SettingsDBService";
import type {
  EmergencyUnlockReason,
  EmergencyUnlockEventDetails,
} from "../../types/events";
import { serviceLogger } from "../../utils/logging";
import { generateUUID } from "../../utils/helpers/hash";

const logger = serviceLogger("EmergencyService");

export interface EmergencyUnlockOptions {
  sessionId: string;
  userId: string;
  reason: EmergencyUnlockReason;
  additionalNotes?: string;
}

export interface EmergencyUnlockResult {
  success: boolean;
  message: string;
  sessionId?: string;
  cooldownUntil?: Date;
}

class EmergencyService {
  /**
   * Perform emergency unlock with complete audit trail
   */
  async performEmergencyUnlock(
    options: EmergencyUnlockOptions,
  ): Promise<EmergencyUnlockResult> {
    const { sessionId, userId, reason, additionalNotes } = options;

    try {
      logger.info("Starting emergency unlock process", {
        sessionId,
        userId,
        reason,
      });

      // 1. Validate session exists and is active
      const session = await sessionDBService.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.userId !== userId) {
        throw new Error("Session does not belong to user");
      }

      if (session.endTime) {
        throw new Error("Session is already ended");
      }

      // 2. Check cooldown if enabled
      const cooldownCheck = await this.checkEmergencyUnlockCooldown(userId);
      if (!cooldownCheck.allowed) {
        logger.warn("Emergency unlock blocked by cooldown", {
          userId,
          cooldownUntil: cooldownCheck.cooldownUntil,
        });
        return {
          success: false,
          message: `Emergency unlock on cooldown until ${cooldownCheck.cooldownUntil?.toLocaleString()}`,
          cooldownUntil: cooldownCheck.cooldownUntil,
        };
      }

      // 3. End session immediately (bypasses all restrictions)
      const endTime = new Date();
      await sessionDBService.update(sessionId, {
        endTime,
        endReason: "emergency_unlock",
        isEmergencyUnlock: true,
        emergencyReason: reason,
        emergencyNotes: additionalNotes,
        emergencyPinUsed: session.isHardcoreMode || false,
        isPaused: false,
        pauseStartTime: undefined,
      });

      // 4. Calculate session duration for logging
      const sessionDuration = Math.floor(
        (endTime.getTime() - session.startTime.getTime()) / 1000,
      );

      // 5. Log emergency event with detailed information
      await eventDBService.create({
        id: generateUUID(),
        userId,
        sessionId,
        type: "session_end" as const,
        timestamp: endTime,
        details: {
          endReason: "emergency_unlock",
          emergencyReason: reason,
          emergencyNotes: additionalNotes,
          sessionDuration,
          wasHardcoreMode: session.isHardcoreMode,
          wasKeyholderControlled: session.keyholderApprovalRequired,
          accumulatedPauseTime: session.accumulatedPauseTime,
        },
        isPrivate: false,
      });

      // 6. Clear any active restrictions
      await this.clearActiveRestrictions(userId);

      // 7. Set emergency cooldown period
      await this.setEmergencyCooldown(userId);

      logger.info("Emergency unlock completed successfully", {
        sessionId,
        userId,
        reason,
        sessionDuration,
      });

      return {
        success: true,
        message: "Emergency unlock successful. Session ended immediately.",
        sessionId,
      };
    } catch (error) {
      logger.error("Emergency unlock failed", {
        error: error as Error,
        sessionId,
        userId,
        reason,
      });

      return {
        success: false,
        message: `Emergency unlock failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Check if emergency unlock is allowed (not on cooldown)
   */
  private async checkEmergencyUnlockCooldown(userId: string): Promise<{
    allowed: boolean;
    cooldownUntil?: Date;
  }> {
    try {
      const settings = await settingsDBService.getSettings(userId);
      if (!settings || !settings.chastity.emergencyUnlockCooldown) {
        return { allowed: true };
      }

      // Check for recent emergency unlocks by getting all events for user
      const recentEvents = await eventDBService.getEvents(userId, {}, 100, 0);

      const recentEmergencyUnlocks = recentEvents.filter(
        (event) =>
          event.type === "session_end" &&
          event.details?.endReason === "emergency_unlock" &&
          event.timestamp.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      );

      if (recentEmergencyUnlocks.length === 0) {
        return { allowed: true };
      }

      // Find most recent emergency unlock
      const lastEmergencyUnlock = recentEmergencyUnlocks.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      )[0];

      if (!lastEmergencyUnlock) {
        // This should never happen due to the length check above, but TypeScript safety
        return { allowed: true };
      }

      const cooldownHours = settings.chastity.emergencyUnlockCooldown;
      const cooldownUntil = new Date(
        lastEmergencyUnlock.timestamp.getTime() +
          cooldownHours * 60 * 60 * 1000,
      );

      const isOnCooldown = new Date() < cooldownUntil;

      return {
        allowed: !isOnCooldown,
        cooldownUntil: isOnCooldown ? cooldownUntil : undefined,
      };
    } catch (error) {
      logger.error("Failed to check emergency unlock cooldown", {
        error: error as Error,
        userId,
      });
      // If we can't check cooldown, allow the unlock for safety
      return { allowed: true };
    }
  }

  /**
   * Clear any active restrictions that might prevent normal app functionality
   */
  private async clearActiveRestrictions(userId: string): Promise<void> {
    try {
      logger.debug("Clearing active restrictions", { userId });

      // For now, this is a placeholder for future restriction clearing logic
      // This could include:
      // - Temporarily disabling hardcore mode restrictions
      // - Clearing keyholder locks
      // - Resetting any temporary blocks

      // The actual implementation would depend on how restrictions are stored
      // and managed in the application
    } catch (error) {
      logger.error("Failed to clear restrictions", {
        error: error as Error,
        userId,
      });
      // Don't throw - restriction clearing is nice-to-have, not critical
    }
  }

  /**
   * Set emergency unlock cooldown period
   */
  private async setEmergencyCooldown(userId: string): Promise<void> {
    try {
      const settings = await settingsDBService.getSettings(userId);
      if (!settings || !settings.chastity.emergencyUnlockCooldown) {
        return; // No cooldown configured
      }

      logger.debug("Emergency cooldown already handled by event logging", {
        userId,
      });
      // Cooldown is handled by checking recent emergency unlock events
      // No additional storage needed
    } catch (error) {
      logger.error("Failed to set emergency cooldown", {
        error: error as Error,
        userId,
      });
      // Don't throw - cooldown is a secondary safety feature
    }
  }

  /**
   * Get emergency unlock usage statistics for a user
   */
  async getEmergencyUnlockStats(
    userId: string,
    daysPeriod: number = 30,
  ): Promise<{
    totalEmergencyUnlocks: number;
    lastEmergencyUnlock?: Date;
    reasonBreakdown: Record<string, number>;
    isOnCooldown: boolean;
    cooldownUntil?: Date;
  }> {
    try {
      const events = await eventDBService.getEvents(userId, {}, 200, 0);

      const startDate = new Date(Date.now() - daysPeriod * 24 * 60 * 60 * 1000);
      const emergencyUnlocks = events.filter(
        (event) =>
          event.type === "session_end" &&
          event.details?.endReason === "emergency_unlock" &&
          event.timestamp >= startDate,
      );

      const reasonBreakdown: Record<string, number> = {};
      emergencyUnlocks.forEach((event) => {
        const details = event.details as EmergencyUnlockEventDetails;
        const reason = details?.emergencyReason || "Unknown";
        reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
      });

      const lastEmergencyUnlock =
        emergencyUnlocks.length > 0
          ? (() => {
              const sortedUnlocks = emergencyUnlocks.sort(
                (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
              );
              const firstUnlock = sortedUnlocks[0];
              return firstUnlock?.timestamp;
            })()
          : undefined;

      const cooldownCheck = await this.checkEmergencyUnlockCooldown(userId);

      return {
        totalEmergencyUnlocks: emergencyUnlocks.length,
        lastEmergencyUnlock,
        reasonBreakdown,
        isOnCooldown: !cooldownCheck.allowed,
        cooldownUntil: cooldownCheck.cooldownUntil,
      };
    } catch (error) {
      logger.error("Failed to get emergency unlock stats", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

export const emergencyService = new EmergencyService();
