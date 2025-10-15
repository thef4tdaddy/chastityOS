import React from "react";
import { FaUsers, FaShieldAlt, FaHistory } from "@/utils/iconImport";
import { AdminRelationship } from "@/types/account-linking";

// Memoized for performance optimization
export const AdminOverview = React.memo<{ relationship: AdminRelationship }>(
  ({ relationship }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div className="bg-white/5 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <FaUsers className="text-nightly-aquamarine flex-shrink-0" />
          <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew">
            Relationship
          </h4>
        </div>
        <div className="text-xs sm:text-sm text-nightly-celadon space-y-1">
          <p>
            Status:{" "}
            <span className="text-green-400">{relationship.status}</span>
          </p>
          <p className="break-words">
            Established:{" "}
            {relationship.establishedAt.toDate().toLocaleDateString()}
          </p>
          <p>Method: {relationship.linkMethod}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <FaShieldAlt className="text-nightly-lavender-floral flex-shrink-0" />
          <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew">
            Permissions
          </h4>
        </div>
        <div className="text-xs sm:text-sm text-nightly-celadon space-y-1">
          <p>
            Sessions: {relationship.permissions.controlSessions ? "✓" : "✗"}
          </p>
          <p>Tasks: {relationship.permissions.manageTasks ? "✓" : "✗"}</p>
          <p>Settings: {relationship.permissions.editSettings ? "✓" : "✗"}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <FaHistory className="text-nightly-spring-green flex-shrink-0" />
          <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew">
            Activity
          </h4>
        </div>
        <div className="text-xs sm:text-sm text-nightly-celadon space-y-1">
          <p className="break-words">
            Last Access:{" "}
            {relationship.lastAdminAccess
              ? relationship.lastAdminAccess.toDate().toLocaleDateString()
              : "Never"}
          </p>
          <p>Session Timeout: {relationship.security.sessionTimeout}m</p>
        </div>
      </div>
    </div>
  ),
);
AdminOverview.displayName = "AdminOverview";
