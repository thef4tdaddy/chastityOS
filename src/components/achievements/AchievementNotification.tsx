/**
 * Achievement Notification Component
 * Shows toast notifications when achievements are unlocked
 */

import React, { useEffect } from "react";
import { useToast } from "../../contexts";
import { FaTrophy, FaTimes } from "../../utils/iconImport";
import { DBAchievement, DBAchievementNotification } from "../../types";

interface AchievementToastProps {
  achievement: DBAchievement;
  notification: DBAchievementNotification;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
}) => (
  <div className="flex items-center space-x-3 p-2">
    <div className="text-2xl">{achievement.icon}</div>
    <div className="flex-1">
      <div className="flex items-center space-x-2">
        <FaTrophy className="text-yellow-500" />
        <span className="font-semibold text-white">Achievement Unlocked!</span>
      </div>
      <h3 className="font-bold text-yellow-300">{achievement.name}</h3>
      <p className="text-sm text-gray-300">{achievement.description}</p>
      <div className="flex items-center space-x-2 mt-1">
        <span className="text-xs bg-blue-600 px-2 py-1 rounded">
          +{achievement.points} points
        </span>
        <span className="text-xs text-gray-400 capitalize">
          {achievement.difficulty}
        </span>
      </div>
    </div>
    <Button
      onClick={onClose}
      className="text-gray-400 hover:text-white transition-colors"
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
