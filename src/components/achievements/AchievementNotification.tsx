/**
 * Achievement Notification Component
 * Shows toast notifications when achievements are unlocked
 */

import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { FaTrophy, FaTimes } from "../../utils/iconImport";
import { DBAchievement, DBAchievementNotification } from "../../types";

interface AchievementToastProps {
  achievement: DBAchievement;
  notification: DBAchievementNotification;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  notification,
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
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-white transition-colors"
    >
      <FaTimes />
    </button>
  </div>
);

interface AchievementNotificationProps {
  notifications: DBAchievementNotification[];
  achievements: DBAchievement[];
  onMarkRead: (notificationId: string) => void;
  autoShow?: boolean;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  notifications,
  achievements,
  onMarkRead,
  autoShow = true,
}) => {
  useEffect(() => {
    if (!autoShow) return;

    // Show toasts for unread "earned" notifications
    const earnedNotifications = notifications.filter(
      (n) => n.type === "earned" && !n.isRead
    );

    earnedNotifications.forEach((notification) => {
      const achievement = achievements.find(
        (a) => a.id === notification.achievementId
      );

      if (achievement) {
        toast.success(
          <AchievementToast
            achievement={achievement}
            notification={notification}
            onClose={() => onMarkRead(notification.id)}
          />,
          {
            toastId: notification.id,
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            className: "achievement-toast",
            bodyClassName: "achievement-toast-body",
            onClose: () => onMarkRead(notification.id),
          }
        );
      }
    });
  }, [notifications, achievements, onMarkRead, autoShow]);

  return null; // This component only manages toast notifications
};

export default AchievementNotification;