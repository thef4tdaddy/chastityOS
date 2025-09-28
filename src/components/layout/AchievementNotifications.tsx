import React from "react";
import { AchievementNotification } from "../achievements";
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
          <AchievementNotification
            key={notification.id}
            achievement={achievement}
            onClose={() => markNotificationRead(notification.id)}
          />
        ) : null;
      })}
    </>
  );
};
