import React from "react";
import { AdminRelationship } from "@/types/account-linking";
import { AdminOverview } from "./AdminOverview";
import { AdminSessions } from "./AdminSessions";
import { AdminTasks } from "./AdminTasks";
import { AdminSettings } from "./AdminSettings";

// Tab Content Renderer - memoized for performance
export const TabContentRenderer = React.memo<{
  selectedTab: string;
  selectedRelationship: AdminRelationship;
  isAdminSessionActive: boolean;
}>(({ selectedTab, selectedRelationship, isAdminSessionActive }) => (
  <div className="space-y-6">
    {selectedTab === "overview" && (
      <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
        <AdminOverview relationship={selectedRelationship} />
      </div>
    )}

    {selectedTab === "sessions" && (
      <div role="tabpanel" id="sessions-panel" aria-labelledby="sessions-tab">
        <AdminSessions
          relationship={selectedRelationship}
          isSessionActive={isAdminSessionActive}
        />
      </div>
    )}

    {selectedTab === "tasks" && (
      <div role="tabpanel" id="tasks-panel" aria-labelledby="tasks-tab">
        <AdminTasks
          relationship={selectedRelationship}
          isSessionActive={isAdminSessionActive}
        />
      </div>
    )}

    {selectedTab === "settings" && (
      <div role="tabpanel" id="settings-panel" aria-labelledby="settings-tab">
        <AdminSettings
          relationship={selectedRelationship}
          isSessionActive={isAdminSessionActive}
        />
      </div>
    )}
  </div>
));
TabContentRenderer.displayName = "TabContentRenderer";
