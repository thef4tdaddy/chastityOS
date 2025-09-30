/**
 * Type Definitions for usePauseResume
 * Extracted for better code organization
 */

export interface PauseStatus {
  isPaused: boolean;
  pauseStartTime?: Date;
  pauseDuration: number; // Current pause duration in seconds
  pauseReason?: string;
  canResume: boolean;
  pauseCount: number; // Number of pauses in current session
}

export interface CooldownState {
  isInCooldown: boolean;
  cooldownRemaining: number; // Seconds remaining
  nextPauseAvailable: Date | null;
  cooldownReason: CooldownReason;
  canOverride: boolean;
  adaptiveDuration: number; // Adaptive cooldown based on usage patterns
}

export interface KeyholderOverrideCapabilities {
  canOverrideCooldown: boolean;
  canForcePause: boolean;
  canForceResume: boolean;
  canModifyCooldownDuration: boolean;
  requiresReason: boolean;
}

export interface PauseHistoryEntry {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  reason: string;
  initiatedBy: "submissive" | "keyholder" | "system";
  wasEmergency: boolean;
}

export interface PauseAnalytics {
  totalPauses: number;
  averagePauseDuration: number;
  pauseFrequency: number; // Pauses per session
  emergencyPauseCount: number;
  keyholderInitiatedCount: number;
  cooldownViolations: number;
  patterns: PausePattern[];
}

export interface PausePattern {
  type: "time_based" | "duration_based" | "frequency_based";
  description: string;
  frequency: number;
  severity: "low" | "medium" | "high";
}

export interface CooldownAnalytics {
  effectiveness: number; // 0-100% how well cooldowns prevent excessive pausing
  averageCooldownDuration: number;
  overrideFrequency: number;
  adaptiveAdjustments: number;
}

export interface EnhancedPauseState {
  pauseStatus: PauseStatus;
  cooldownState: CooldownState;
  keyholderOverrides: KeyholderOverrideCapabilities;
  pauseHistory: PauseHistoryEntry[];
  pauseAnalytics: PauseAnalytics;
}

export type PauseReason =
  | "bathroom"
  | "meal"
  | "emergency"
  | "hygiene"
  | "medical"
  | "technical"
  | "keyholder_request"
  | "other";

export type CooldownReason =
  | "frequent_pausing"
  | "short_intervals"
  | "session_abuse"
  | "keyholder_restriction"
  | "adaptive_learning";

export interface PauseRequestStatus {
  approved: boolean;
  reason?: string;
  requestId: string;
  approvedBy?: "keyholder" | "system" | "emergency_protocol";
  approvedAt?: Date;
}

export interface OverrideRequestStatus {
  approved: boolean;
  reason?: string;
  requestId: string;
  overrideType: "cooldown" | "force_pause" | "force_resume";
  approvedAt?: Date;
}

// ==================== HOOK IMPLEMENTATION ====================
