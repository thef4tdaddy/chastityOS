/**
 * Achievement Notification Component
 * Shows toast notifications when achievements are unlocked
 */

import React, { useEffect } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/contexts";
import { FaTrophy, FaTimes } from "@/utils/iconImport";
import { DBAchievement, DBAchievementNotification } from "@/types";

interface AchievementToastProps {
  achievement: DBAchievement;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
}) => (
  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 max-w-full">
    <div className="text-xl sm:text-2xl flex-shrink-0">{achievement.icon}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <FaTrophy className="text-yellow-500 text-sm sm:text-base flex-shrink-0" />
        <span className="font-semibold text-white text-xs sm:text-sm">
          Achievement Unlocked!
        </span>
      </div>
      <h3 className="font-bold text-yellow-300 text-sm sm:text-base truncate">
        {achievement.name}
      </h3>
      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">
        {achievement.description}
      </p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-xs bg-blue-600 px-2 py-1 rounded whitespace-nowrap">
          +{achievement.points} points
        </span>
        <span className="text-xs text-gray-400 capitalize">
          {achievement.difficulty}
        </span>
      </div>
    </div>
    <Button
      onClick={onClose}
      className="text-gray-400 hover:text-white transition-colors touch-manipulation p-2 flex-shrink-0"
    >
      <FaTimes />
    </Button>
  </div>
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
