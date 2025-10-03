/**
 * Session Persistence Service
 * Handles automatic session restoration, backup, and synchronization
 * Built on top of existing SessionDBService and sync infrastructure
 */
import { serviceLogger } from "../utils/logging";
import { sessionDBService } from "./database";
import { firebaseSync } from "./sync";
import type { DBSession } from "../types/database";

const logger = serviceLogger("SessionPersistenceService");

export interface SessionPersistenceState {
  activeSessionId?: string;
  sessionStartTime?: string;
  lastHeartbeat?: string;
  pauseState?: {
    isPaused: boolean;
    pauseStartTime?: string;
    accumulatedPauseTime: number;
  };
}

export interface SessionRestorationResult {
  success: boolean;
  session?: DBSession;
  wasRestored: boolean;
  error?: string;
}

interface SessionBroadcastData {
  sessionId?: string;
  userId?: string;
  timestamp?: number;
  pauseState?: SessionPersistenceState["pauseState"];
  [key: string]: unknown;
}

export class SessionPersistenceService {
  private static instance: SessionPersistenceService;
  private heartbeatInterval: number | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
  private readonly BACKUP_KEY = "chastity_session_backup";
  private readonly MAX_INTERRUPTION_TIME_MS = 5 * 60 * 1000; // 5 minutes
  private broadcastChannel: BroadcastChannel;

  constructor() {
    this.broadcastChannel = new BroadcastChannel("chastity_session_sync");
    this.setupCrossTabSync();
    logger.info("SessionPersistenceService initialized");
  }

  static getInstance(): SessionPersistenceService {
    if (!SessionPersistenceService.instance) {
      SessionPersistenceService.instance = new SessionPersistenceService();
    }
    return SessionPersistenceService.instance;
  }

  /**
   * Initialize session state on app load
   */
  async initializeSessionState(
    userId: string,
  ): Promise<SessionRestorationResult> {
    try {
      logger.info("Initializing session state", { userId });

      // 1. Check for active session in Dexie
      const activeSession = await sessionDBService.getCurrentSession(userId);

      if (activeSession) {
        // Make sure the session hasn't ended
        if (activeSession.endTime) {
          logger.info("Session has ended, clearing backup", {
            sessionId: activeSession.id,
          });
          localStorage.removeItem(this.BACKUP_KEY);
          return {
            success: true,
            wasRestored: false,
          };
        }

        // 2. Validate session integrity
        const isValid = await this.validateSessionIntegrity(activeSession);

        if (isValid) {
          // 3. Restore session state
          await this.restoreActiveSession(activeSession);
          this.startHeartbeat(activeSession.id);

          logger.info("Session restored successfully", {
            sessionId: activeSession.id,
          });
          return {
            success: true,
            session: activeSession,
            wasRestored: true,
          };
        } else {
          // 4. Attempt recovery if validation failed
          logger.warn("Session validation failed, attempting recovery", {
            sessionId: activeSession.id,
          });
          return await this.attemptSessionRecovery(userId, activeSession);
        }
      }

      // 5. Check backup sources if no active session
      const backupResult = await this.checkBackupSources(userId);
      if (backupResult.success) {
        return backupResult;
      }

      // 6. Clear any stale backups
      logger.debug("No session to restore, clearing backup");
      localStorage.removeItem(this.BACKUP_KEY);

      return {
        success: true,
        wasRestored: false,
      };
    } catch (error) {
      logger.error("Session restoration failed", {
        error: error as Error,
        userId,
      });
      return {
        success: false,
        error: (error as Error).message,
        wasRestored: false,
      };
    }
  }

  /**
   * Backup session state continuously
   */
  async backupSessionState(session: DBSession): Promise<void> {
    try {
      // Update Dexie (primary storage)
      await sessionDBService.update(session.id, session);

      // Create backup state for localStorage
      const backupState: SessionPersistenceState = {
        activeSessionId: session.id,
        sessionStartTime: session.startTime.toISOString(),
        lastHeartbeat: new Date().toISOString(),
        pauseState: {
          isPaused: session.isPaused,
          pauseStartTime: session.pauseStartTime?.toISOString(),
          accumulatedPauseTime: session.accumulatedPauseTime,
        },
      };

      // Update localStorage (backup)
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupState));

      // Sync to Firebase (if online and user authenticated)
      if (navigator.onLine) {
        try {
          await firebaseSync.syncSingleSession(session);
        } catch (syncError) {
          logger.warn("Firebase sync failed during backup", {
            error: syncError as Error,
            sessionId: session.id,
          });
          // Don't fail the backup if sync fails
        }
      }

      // Broadcast to other tabs
      this.broadcastSessionEvent("SESSION_UPDATED", {
        sessionId: session.id,
        userId: session.userId,
        isPaused: session.isPaused,
        timestamp: Date.now(),
      });

      logger.debug("Session state backed up", { sessionId: session.id });
    } catch (error) {
      logger.error("Failed to backup session state", {
        error: error as Error,
        sessionId: session.id,
      });
      throw error;
    }
  }

  /**
   * Start heartbeat system
   */
  startHeartbeat(sessionId: string): void {
    this.stopHeartbeat(); // Clean up existing

    this.heartbeatInterval = setInterval(async () => {
      try {
        const now = new Date();

        // Update session's last active timestamp
        await sessionDBService.update(sessionId, { lastModified: now });

        // Update localStorage backup
        const backup = this.getBackupState();
        if (backup) {
          backup.lastHeartbeat = now.toISOString();
          localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
        }

        // Check for cross-tab session conflicts
        await this.checkForSessionConflicts(sessionId);

        logger.debug("Heartbeat sent", { sessionId });
      } catch (error) {
        logger.error("Heartbeat failed", { error: error as Error, sessionId });
        // Continue heartbeat despite errors
      }
    }, this.HEARTBEAT_INTERVAL_MS);

    logger.info("Heartbeat started", {
      sessionId,
      intervalMs: this.HEARTBEAT_INTERVAL_MS,
    });
  }

  /**
   * Stop heartbeat system
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.debug("Heartbeat stopped");
    }
  }

  /**
   * Detect potential interruption and recover
   */
  async detectAndRecover(userId: string): Promise<SessionRestorationResult> {
    const backup = this.getBackupState();

    if (!backup || !backup.activeSessionId || !backup.lastHeartbeat) {
      return { success: true, wasRestored: false };
    }

    const lastHeartbeat = new Date(backup.lastHeartbeat);
    const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();

    // If more than max interruption time since last heartbeat, session may have been interrupted
    if (timeSinceHeartbeat > this.MAX_INTERRUPTION_TIME_MS) {
      logger.warn("Potential session interruption detected", {
        sessionId: backup.activeSessionId,
        timeSinceHeartbeat,
        maxInterruptionTime: this.MAX_INTERRUPTION_TIME_MS,
      });

      return await this.handlePotentialInterruption(
        userId,
        backup,
        timeSinceHeartbeat,
      );
    }

    return { success: true, wasRestored: false };
  }

  /**
   * Validate session integrity
   */
  private async validateSessionIntegrity(session: DBSession): Promise<boolean> {
    const errors: string[] = [];

    // Check required fields
    if (!session.id || !session.userId || !session.startTime) {
      errors.push("Missing required session fields");
    }

    // Check time logic
    if (session.endTime && session.endTime < session.startTime) {
      errors.push("End time before start time");
    }

    // Check pause time logic
    if (session.accumulatedPauseTime < 0) {
      errors.push("Negative pause time");
    }

    // Validate session age
    const now = new Date();
    const sessionAge = now.getTime() - session.startTime.getTime();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year

    if (sessionAge > maxAge) {
      errors.push("Session older than 1 year - likely corrupted");
    }

    if (errors.length > 0) {
      logger.warn("Session integrity validation failed", {
        sessionId: session.id,
        errors,
      });
      return false;
    }

    return true;
  }

  /**
   * Restore active session state
   */
  private async restoreActiveSession(session: DBSession): Promise<void> {
    // Update backup state
    const backupState: SessionPersistenceState = {
      activeSessionId: session.id,
      sessionStartTime: session.startTime.toISOString(),
      lastHeartbeat: new Date().toISOString(),
      pauseState: {
        isPaused: session.isPaused,
        pauseStartTime: session.pauseStartTime?.toISOString(),
        accumulatedPauseTime: session.accumulatedPauseTime,
      },
    };

    localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupState));

    // Broadcast session restoration to other tabs
    this.broadcastSessionEvent("SESSION_RESTORED", {
      sessionId: session.id,
      userId: session.userId,
      timestamp: Date.now(),
    });

    logger.info("Active session restored", { sessionId: session.id });
  }

  /**
   * Check backup sources for session recovery
   */
  private async checkBackupSources(
    userId: string,
  ): Promise<SessionRestorationResult> {
    const backup = this.getBackupState();

    if (!backup || !backup.activeSessionId) {
      return { success: true, wasRestored: false };
    }

    try {
      // Try to find the session in Dexie by ID
      const session = await sessionDBService.findById(backup.activeSessionId);

      if (session && session.userId === userId && !session.endTime) {
        logger.info("Session recovered from backup", { sessionId: session.id });
        await this.restoreActiveSession(session);
        this.startHeartbeat(session.id);

        return {
          success: true,
          session,
          wasRestored: true,
        };
      }
    } catch (error) {
      logger.error("Failed to recover from backup", { error: error as Error });
    }

    // Clear invalid backup
    localStorage.removeItem(this.BACKUP_KEY);
    return { success: true, wasRestored: false };
  }

  /**
   * Attempt session recovery after validation failure
   */
  private async attemptSessionRecovery(
    userId: string,
    corruptedSession: DBSession,
  ): Promise<SessionRestorationResult> {
    try {
      // Attempt to fix common corruption issues
      const recovered = { ...corruptedSession };

      // Fix negative pause times
      if (recovered.accumulatedPauseTime < 0) {
        recovered.accumulatedPauseTime = 0;
      }

      // Fix future end times
      if (recovered.endTime && recovered.endTime > new Date()) {
        delete recovered.endTime;
        delete recovered.endReason;
      }

      // Update the session with fixes
      await sessionDBService.update(recovered.id, recovered);

      logger.info("Session recovered successfully", {
        sessionId: recovered.id,
      });

      await this.restoreActiveSession(recovered);
      this.startHeartbeat(recovered.id);

      return {
        success: true,
        session: recovered,
        wasRestored: true,
      };
    } catch (error) {
      logger.error("Session recovery failed", {
        error: error as Error,
        sessionId: corruptedSession.id,
      });

      return {
        success: false,
        error: (error as Error).message,
        wasRestored: false,
      };
    }
  }

  /**
   * Handle potential interruption
   */
  private async handlePotentialInterruption(
    userId: string,
    backup: SessionPersistenceState,
    timeSinceHeartbeat: number,
  ): Promise<SessionRestorationResult> {
    try {
      const session = await sessionDBService.findById(backup.activeSessionId!);

      if (!session || session.userId !== userId || session.endTime) {
        // Session no longer exists or is ended
        localStorage.removeItem(this.BACKUP_KEY);
        return { success: true, wasRestored: false };
      }

      // If session was paused during interruption, adjust pause time
      if (backup.pauseState?.isPaused && backup.pauseState.pauseStartTime) {
        const _pauseStart = new Date(backup.pauseState.pauseStartTime);
        const _interruptionStart = new Date(backup.lastHeartbeat!);

        // Only count the time from interruption as additional pause time
        const additionalPauseTime = Math.max(
          0,
          Math.floor(timeSinceHeartbeat / 1000),
        );

        await sessionDBService.update(session.id, {
          accumulatedPauseTime:
            session.accumulatedPauseTime + additionalPauseTime,
        });

        logger.info("Adjusted pause time for interrupted session", {
          sessionId: session.id,
          additionalPauseTime,
        });
      }

      await this.restoreActiveSession(session);
      this.startHeartbeat(session.id);

      return {
        success: true,
        session,
        wasRestored: true,
      };
    } catch (error) {
      logger.error("Failed to handle interruption", { error: error as Error });
      return {
        success: false,
        error: (error as Error).message,
        wasRestored: false,
      };
    }
  }

  /**
   * Setup cross-tab synchronization
   */
  private setupCrossTabSync(): void {
    this.broadcastChannel.addEventListener("message", (event) => {
      const { type, data } = event.data;

      switch (type) {
        case "SESSION_STARTED":
          this.handleRemoteSessionStart(data);
          break;
        case "SESSION_ENDED":
          this.handleRemoteSessionEnd(data);
          break;
        case "SESSION_PAUSED":
          this.handleRemoteSessionPause(data);
          break;
        case "SESSION_RESUMED":
          this.handleRemoteSessionResume(data);
          break;
        case "SESSION_UPDATED":
          this.handleRemoteSessionUpdate(data);
          break;
        case "HEARTBEAT":
          this.handleRemoteHeartbeat(data);
          break;
      }
    });

    logger.debug("Cross-tab sync initialized");
  }

  /**
   * Broadcast session event to other tabs
   */
  private broadcastSessionEvent(
    type: string,
    data: SessionBroadcastData,
  ): void {
    try {
      this.broadcastChannel.postMessage({
        type,
        data,
        timestamp: Date.now(),
        tabId: this.getTabId(),
      });
      logger.debug("Broadcasted session event", {
        type,
        tabId: this.getTabId(),
      });
    } catch (error) {
      logger.error("Failed to broadcast session event", {
        error: error as Error,
        type,
      });
    }
  }

  /**
   * Check for session conflicts across tabs
   */
  private async checkForSessionConflicts(sessionId: string): Promise<void> {
    // This is a placeholder for conflict detection
    // In a real implementation, we'd check if multiple tabs are managing the same session
    logger.debug("Checking for session conflicts", { sessionId });
  }

  /**
   * Get current backup state from localStorage
   * Public method to allow hooks to access backup state through service layer
   */
  getBackupState(): SessionPersistenceState | null {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      return backup ? JSON.parse(backup) : null;
    } catch (error) {
      logger.error("Failed to parse backup state", { error: error as Error });
      return null;
    }
  }

  /**
   * Get unique tab identifier
   */
  private getTabId(): string {
    if (!window.sessionStorage.getItem("tabId")) {
      window.sessionStorage.setItem(
        "tabId",
        Math.random().toString(36).substr(2, 9),
      );
    }
    return window.sessionStorage.getItem("tabId")!;
  }

  // Cross-tab event handlers
  private handleRemoteSessionStart(data: SessionBroadcastData): void {
    logger.debug("Remote session started", { data });
    // Handle conflicts if this tab also has an active session
  }

  private handleRemoteSessionEnd(data: SessionBroadcastData): void {
    logger.debug("Remote session ended", { data });
    // Clean up if this was our session
    if (this.getBackupState()?.activeSessionId === data.sessionId) {
      localStorage.removeItem(this.BACKUP_KEY);
      this.stopHeartbeat();
    }
  }

  private handleRemoteSessionPause(data: SessionBroadcastData): void {
    logger.debug("Remote session paused", { data });
    // Update local backup if needed
  }

  private handleRemoteSessionResume(data: SessionBroadcastData): void {
    logger.debug("Remote session resumed", { data });
    // Update local backup if needed
  }

  private handleRemoteSessionUpdate(data: SessionBroadcastData): void {
    logger.debug("Remote session updated", { data });
    // Sync local state if this is our session
  }

  private handleRemoteHeartbeat(data: SessionBroadcastData): void {
    logger.debug("Remote heartbeat received", { data });
    // Handle heartbeat from other tabs
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopHeartbeat();
    this.broadcastChannel.close();
    logger.info("SessionPersistenceService destroyed");
  }
}

// Export singleton instance
export const sessionPersistenceService =
  SessionPersistenceService.getInstance();
