/**
 * NotificationFilterBar Component
 * Filter tabs for notification types
 */
import React from "react";
import { Tabs, TabsContent } from "@/components/ui";

type NotificationType = "all" | "session" | "task" | "keyholder" | "system";

interface NotificationFilterBarProps {
  activeFilter: NotificationType;
  onFilterChange: (filter: NotificationType) => void;
  totalCount: number;
  children: React.ReactNode;
}

export const NotificationFilterBar: React.FC<NotificationFilterBarProps> = ({
  activeFilter,
  onFilterChange,
  totalCount,
  children,
}) => {
  return (
    <Tabs
      value={activeFilter}
      onValueChange={(value) => onFilterChange(value as NotificationType)}
      tabs={[
        { value: "all", label: `All (${totalCount})` },
        { value: "task", label: "Tasks" },
        { value: "session", label: "Sessions" },
        { value: "keyholder", label: "Keyholder" },
        { value: "system", label: "System" },
      ]}
    >
      <TabsContent
        value={activeFilter}
        activeValue={activeFilter}
        className="mt-4"
      >
        {children}
      </TabsContent>
    </Tabs>
  );
};

export type { NotificationType };
