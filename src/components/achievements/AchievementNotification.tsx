/**
 * Achievement Notification Component
 * Shows toast notifications when achievements are unlocked
 */

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { useToast } from "@/contexts";
import { FaTrophy, FaTimes } from "@/utils/iconImport";
import { DBAchievement, DBAchievementNotification } from "@/types";
import {
  achievementUnlockVariants,
  trophyBounceVariants,
  shineContinuousVariants,
  getAccessibleVariants,
} from "@/utils/animations";

interface AchievementToastProps {
  achievement: DBAchievement;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
}) => (
  <motion.div
    className="flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 max-w-full relative overflow-hidden"
    variants={getAccessibleVariants(achievementUnlockVariants)}
    initial="initial"
    animate="animate"
    exit="exit"
    role="status"
    aria-live="assertive"
    aria-atomic="true"
  >
    {/* Shine effect */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
      variants={getAccessibleVariants(shineContinuousVariants)}
      initial="initial"
      animate="animate"
      aria-hidden="true"
    />

    <motion.div
      className="text-xl sm:text-2xl flex-shrink-0"
      variants={getAccessibleVariants(trophyBounceVariants)}
      initial="initial"
      animate="animate"
      aria-hidden="true"
    >
      {achievement.icon}
    </motion.div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <motion.div
          variants={getAccessibleVariants(trophyBounceVariants)}
          initial="initial"
          animate="animate"
        >
          <FaTrophy
            className="text-yellow-500 text-sm sm:text-base flex-shrink-0"
            aria-hidden="true"
          />
        </motion.div>
        <span className="font-semibold text-white text-xs sm:text-sm">
          Achievement Unlocked!
        </span>
      </div>
      <motion.h3
        className="font-bold text-yellow-300 text-sm sm:text-base truncate"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {achievement.name}
      </motion.h3>
      <motion.p
        className="text-xs sm:text-sm text-gray-300 line-clamp-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        {achievement.description}
      </motion.p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <motion.span
          className="text-xs bg-blue-600 px-2 py-1 rounded whitespace-nowrap"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          aria-label={`${achievement.points} points earned`}
        >
          +{achievement.points} points
        </motion.span>
        <motion.span
          className="text-xs text-gray-400 capitalize"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          aria-label={`Difficulty: ${achievement.difficulty}`}
        >
          {achievement.difficulty}
        </motion.span>
      </div>
    </div>
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors touch-manipulation p-2 flex-shrink-0"
        aria-label="Close achievement notification"
      >
        <FaTimes aria-hidden="true" />
      </Button>
    </motion.div>
  </motion.div>
);

interface AchievementNotificationProps {
  notifications: DBAchievementNotification[];
  achievements: DBAchievement[];
  onMarkRead: (notificationId: string) => void;
  autoShow?: boolean;
}

export const AchievementNotification: React.FC<
  AchievementNotificationProps
> = ({ notifications, achievements, onMarkRead, autoShow = true }) => {
  const { showSuccess } = useToast();

  useEffect(() => {
    if (!autoShow) return;

    // Show toasts for unread "earned" notifications
    const earnedNotifications = notifications.filter(
      (n: DBAchievementNotification) => n.type === "earned" && !n.isRead,
    );

    earnedNotifications.forEach((notification: DBAchievementNotification) => {
      const achievement = achievements.find(
        (a: DBAchievement) => a.id === notification.achievementId,
      );

      if (achievement) {
        showSuccess(
          `🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}`,
          {
            title: "Achievement Unlocked!",
            duration: 8000,
            action: {
              label: "Mark Read",
              onClick: () => onMarkRead(notification.id),
            },
          },
        );
      }
    });
  }, [notifications, achievements, onMarkRead, autoShow, showSuccess]);

  return null; // This component only manages toast notifications
};

export default AchievementNotification;
