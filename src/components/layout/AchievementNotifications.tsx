import React from "react";
import { AchievementToast } from "../achievements/AchievementNotification";
import type { DBAchievement } from "@/types/database";

interface NotificationData {
  id: string;
  achievementId: string;
}

interface AchievementNotificationsProps {
  unreadNotifications: NotificationData[];
  allAchievements: DBAchievement[];
  markNotificationRead: (id: string) => void;
}

export const AchievementNotifications: React.FC<
  AchievementNotificationsProps
> = ({ unreadNotifications, allAchievements, markNotificationRead }) => {
  return (
    <>
      {unreadNotifications.map((notification) => {
        const achievement = allAchievements.find(
          (a) => a.id === notification.achievementId,
        );
        return achievement ? (
          <AchievementToast
            key={notification.id}
            achievement={achievement}
            onClose={() => markNotificationRead(notification.id)}
          />
        ) : null;
      })}
    </>
  );
};
