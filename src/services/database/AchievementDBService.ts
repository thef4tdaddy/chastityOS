/**
 * Achievement Database Service
 * Backward compatibility wrapper for the new modular achievement services
 * @deprecated Use individual services from './achievements/' for new code
 */

import { AchievementDBService } from "./achievements";

// Re-export the backward-compatible service

export { AchievementDBService };

// Export singleton instance
export const achievementDBService = new AchievementDBService();
