/**
 * Pause Analytics Utility Functions
 * Helper functions for pause/resume analytics and calculations
 */
import type {
  PauseHistoryEntry,
  PauseAnalytics,
  PausePattern,
  CooldownState,
} from "../types/pauseResume";

export function calculatePauseFrequency(history: PauseHistoryEntry[]): number {
  if (history.length === 0) return 0;

  // Calculate pauses per day over the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPauses = history.filter(
    (pause) => pause.startTime >= sevenDaysAgo,
  );

  return recentPauses.length / 7;
}

export function calculateAdaptiveCooldown(
  history: PauseHistoryEntry[],
  analytics: PauseAnalytics,
): number {
  // Base cooldown of 5 minutes
  let cooldown = 300;

  // Increase based on pause frequency
  if (analytics.pauseFrequency > 3) cooldown *= 1.5;
  if (analytics.pauseFrequency > 5) cooldown *= 2;

  // Decrease for good behavior
  if (analytics.pauseFrequency < 1) cooldown *= 0.8;

  return Math.min(3600, Math.max(60, cooldown)); // Between 1 minute and 1 hour
}

export function calculateCooldownDuration(
  analytics: PauseAnalytics,
  lastPauseDuration: number,
): number {
  // TODO: Re-enable cooldowns after testing
  // For development/testing, use minimal cooldowns
  return 0; // No cooldown during development

  // Production cooldown logic (currently disabled):
  // Short pauses get longer cooldowns to prevent abuse
  // if (lastPauseDuration < 60) return 600; // 10 minutes for pauses under 1 minute
  // if (lastPauseDuration < 300) return 300; // 5 minutes for pauses under 5 minutes
  // Reasonable pauses get standard cooldown
  // return 180; // 3 minutes
}

export function calculatePauseAnalytics(
  history: PauseHistoryEntry[],
): PauseAnalytics {
  if (history.length === 0) {
    return {
      totalPauses: 0,
      averagePauseDuration: 0,
      pauseFrequency: 0,
      emergencyPauseCount: 0,
      keyholderInitiatedCount: 0,
      cooldownViolations: 0,
      patterns: [],
    };
  }

  const totalDuration = history.reduce((sum, pause) => sum + pause.duration, 0);
  const emergencyPauses = history.filter((pause) => pause.wasEmergency).length;
  const keyholderPauses = history.filter(
    (pause) => pause.initiatedBy === "keyholder",
  ).length;

  return {
    totalPauses: history.length,
    averagePauseDuration: totalDuration / history.length,
    pauseFrequency: calculatePauseFrequency(history),
    emergencyPauseCount: emergencyPauses,
    keyholderInitiatedCount: keyholderPauses,
    cooldownViolations: 0, // Would need to track this separately
    patterns: analyzePausePatterns(history),
  };
}

export function analyzePausePatterns(
  history: PauseHistoryEntry[],
): PausePattern[] {
  const patterns: PausePattern[] = [];

  // Analyze time-based patterns
  const hourCounts = new Array(24).fill(0);
  history.forEach((pause) => {
    const hour = pause.startTime.getHours();
    hourCounts[hour]++;
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  if (hourCounts[peakHour] > history.length * 0.3) {
    patterns.push({
      type: "time_based",
      description: `High pause frequency at ${peakHour}:00`,
      frequency: hourCounts[peakHour] / history.length,
      severity: hourCounts[peakHour] > history.length * 0.5 ? "high" : "medium",
    });
  }

  return patterns;
}

export function calculateCooldownEffectiveness(
  _history: PauseHistoryEntry[],
  _cooldownState: CooldownState,
): number {
  // Simple effectiveness calculation based on pause spacing
  // More sophisticated analysis would consider cooldown violations
  return 75; // Placeholder - would calculate actual effectiveness
}
