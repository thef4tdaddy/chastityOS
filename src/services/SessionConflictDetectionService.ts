/**
 * SessionConflictDetectionService
 * Detects and handles concurrent session operations to prevent conflicts
 */

import { serviceLogger } from "../utils/logging";
import type { DBSession } from "../types/database";

const logger = serviceLogger("SessionConflictDetection");

interface PendingOperation {
  type: "start" | "end" | "pause" | "resume";
  timestamp: number;
  sessionId?: string;
}

class SessionConflictDetectionService {
  private pendingOperations: Map<string, PendingOperation> = new Map();
  private readonly OPERATION_TIMEOUT = 30000; // 30 seconds

  /**
   * Check if an operation is already in progress for a user
   */
  isOperationInProgress(userId: string, operationType?: string): boolean {
    const pending = this.pendingOperations.get(userId);
    if (!pending) return false;

    // Check if operation has timed out
    const age = Date.now() - pending.timestamp;
    if (age > this.OPERATION_TIMEOUT) {
      logger.warn("Clearing timed out operation", {
        userId,
        operationType: pending.type,
        age,
      });
      this.pendingOperations.delete(userId);
      return false;
    }

    // If checking for specific operation type
    if (operationType && pending.type !== operationType) {
      return false;
    }

    return true;
  }

  /**
   * Mark an operation as started
   */
  startOperation(
    userId: string,
    operationType: PendingOperation["type"],
    sessionId?: string,
  ): void {
    if (this.isOperationInProgress(userId)) {
      const existing = this.pendingOperations.get(userId);
      logger.warn("Starting operation while another is in progress", {
        userId,
        newOperation: operationType,
        existingOperation: existing?.type,
      });
    }

    this.pendingOperations.set(userId, {
      type: operationType,
      timestamp: Date.now(),
      sessionId,
    });

    logger.debug("Operation started", { userId, operationType, sessionId });
  }

  /**
   * Mark an operation as completed
   */
  completeOperation(userId: string, operationType: string): void {
    const pending = this.pendingOperations.get(userId);
    if (!pending) {
      logger.debug("No pending operation to complete", {
        userId,
        operationType,
      });
      return;
    }

    if (pending.type !== operationType) {
      logger.warn("Completing different operation than expected", {
        userId,
        expected: pending.type,
        actual: operationType,
      });
    }

    this.pendingOperations.delete(userId);
    logger.debug("Operation completed", { userId, operationType });
  }

  /**
   * Detect session state conflicts
   */
  detectSessionConflict(
    currentSession: DBSession | null,
    expectedState: Partial<DBSession>,
  ): {
    hasConflict: boolean;
    conflictType?: string;
    message?: string;
  } {
    if (!currentSession) {
      return { hasConflict: false };
    }

    // Check for modification conflicts
    if (
      expectedState.lastModified &&
      currentSession.lastModified &&
      expectedState.lastModified < currentSession.lastModified
    ) {
      return {
        hasConflict: true,
        conflictType: "stale_data",
        message:
          "Session was modified by another device. Please refresh and try again.",
      };
    }

    // Check for state conflicts (e.g., trying to pause an ended session)
    if (expectedState.endTime === undefined && currentSession.endTime) {
      return {
        hasConflict: true,
        conflictType: "session_ended",
        message: "Session has already ended. Cannot perform this operation.",
      };
    }

    if (
      expectedState.isPaused !== undefined &&
      currentSession.isPaused !== expectedState.isPaused
    ) {
      return {
        hasConflict: true,
        conflictType: "pause_state_mismatch",
        message: `Session pause state has changed. Expected ${expectedState.isPaused ? "paused" : "active"}, but found ${currentSession.isPaused ? "paused" : "active"}.`,
      };
    }

    return { hasConflict: false };
  }

  /**
   * Get current pending operations (for debugging)
   */
  getPendingOperations(): Map<string, PendingOperation> {
    return new Map(this.pendingOperations);
  }

  /**
   * Clear all pending operations (for testing/cleanup)
   */
  clearAllOperations(): void {
    this.pendingOperations.clear();
    logger.debug("All pending operations cleared");
  }

  /**
   * Clear stale operations
   */
  clearStaleOperations(): void {
    const now = Date.now();
    let clearedCount = 0;

    for (const [userId, operation] of this.pendingOperations.entries()) {
      const age = now - operation.timestamp;
      if (age > this.OPERATION_TIMEOUT) {
        this.pendingOperations.delete(userId);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      logger.info(`Cleared ${clearedCount} stale operation(s)`);
    }
  }
}

// Singleton instance
export const sessionConflictDetection = new SessionConflictDetectionService();

// Auto-cleanup stale operations every minute
if (typeof window !== "undefined") {
  setInterval(() => {
    sessionConflictDetection.clearStaleOperations();
  }, 60000);
}
