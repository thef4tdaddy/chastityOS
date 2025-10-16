import React from "react";
import { AdminRelationship } from "@/types/account-linking";

export const AdminSettings = React.memo<{
  relationship: AdminRelationship;
  isSessionActive: boolean;
}>(({ relationship, isSessionActive: _isSessionActive }) => (
  <div className="space-y-3 sm:space-y-4">
    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
      <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-3">
        Admin Settings
      </h4>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-nightly-celadon">
            Session Timeout
          </span>
          <span className="text-xs sm:text-sm text-nightly-honeydew font-medium">
            {relationship.security.sessionTimeout} minutes
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-nightly-celadon">
            Audit Logging
          </span>
          <span className="text-xs sm:text-sm text-nightly-honeydew font-medium">
            {relationship.security.auditLog ? "Enabled" : "Disabled"}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-nightly-celadon">
            Wearer Notifications
          </span>
          <span className="text-xs sm:text-sm text-nightly-honeydew font-medium">
            {relationship.privacy.wearerCanSeeAdminActions
              ? "Enabled"
              : "Disabled"}
          </span>
        </div>
      </div>
    </div>
  </div>
));
AdminSettings.displayName = "AdminSettings";
