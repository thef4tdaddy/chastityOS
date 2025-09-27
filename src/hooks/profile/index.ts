/**
 * Profile hooks exports
 */

export { usePublicProfile } from "./usePublicProfile";
export { useProfileStats } from "./useProfileStats";
export {
  useProfileAchievements,
  getTypeStyles,
} from "./useProfileAchievements";
export { useProfilePrivacy } from "./useProfilePrivacy";
export { useProfileSharing } from "./useProfileSharing";

export type { PublicProfile } from "./usePublicProfile";
export type { StatItem } from "./useProfileStats";
export type {
  ProfileBadge,
  ProfileAchievement,
} from "./useProfileAchievements";
