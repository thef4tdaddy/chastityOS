import React, { useState } from "react";
import {
  FaUserShield,
  FaEye,
  FaCog,
  FaUsers,
  FaTasks,
  FaLock,
  FaHistory,
  FaShieldAlt,
  FaSpinner,
} from "react-icons/fa";
import { useAccountLinking } from "../../hooks/account-linking/useAccountLinking";
import { AdminRelationship } from "../../types/account-linking";

export const AdminDashboard: React.FC = () => {
  const {
    relationships,
    keyholderRelationships,
    selectedWearerId,
    setSelectedWearer,
    startAdminSession,
    isAdminSessionActive,
    isLoadingRelationships,
  } = useAccountLinking();

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "sessions" | "tasks" | "settings"
  >("overview");

  // Only show admin dashboard if user is a keyholder
  const isKeyholder = keyholderRelationships.length > 0;

  if (!isKeyholder) {
    return null;
  }

  const selectedRelationship = selectedWearerId
    ? relationships.find((r) => r.wearerId === selectedWearerId)
    : keyholderRelationships[0];

  const handleStartAdminSession = () => {
    if (selectedRelationship) {
      startAdminSession(selectedRelationship.id);
    }
  };

  if (isLoadingRelationships) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine" />
          <span className="ml-3 text-nightly-celadon">
            Loading admin dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaUserShield className="text-nightly-lavender-floral" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Keyholder Admin Dashboard
        </h2>
        <span className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded">
          KEYHOLDER
        </span>
      </div>

      {/* Wearer Selection */}
      {keyholderRelationships.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-nightly-honeydew mb-2">
            Select Wearer to Manage:
          </label>
          <select
            value={selectedWearerId || ""}
            onChange={(e) => setSelectedWearer(e.target.value || null)}
            className="bg-black/20 text-nightly-honeydew px-3 py-2 rounded w-full max-w-md"
          >
            {keyholderRelationships.map((relationship) => (
              <option key={relationship.id} value={relationship.wearerId}>
                Wearer: {relationship.wearerId}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedRelationship && (
        <>
          {/* Admin Session Status */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-nightly-honeydew mb-1">
                  Admin Session
                </h3>
                <p className="text-sm text-nightly-celadon">
                  {isAdminSessionActive
                    ? `Active session for ${selectedRelationship.wearerId}`
                    : "No active admin session"}
                </p>
              </div>
              <div>
                {!isAdminSessionActive ? (
                  <button
                    onClick={handleStartAdminSession}
                    className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                  >
                    <FaShieldAlt />
                    Start Admin Session
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-green-400">
                    <FaShieldAlt />
                    <span className="text-sm">Session Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-black/20 rounded-lg p-1 mb-6">
            {[
              { id: "overview", label: "Overview", icon: FaEye },
              { id: "sessions", label: "Sessions", icon: FaLock },
              { id: "tasks", label: "Tasks", icon: FaTasks },
              { id: "settings", label: "Settings", icon: FaCog },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? "bg-nightly-lavender-floral text-white"
                    : "text-nightly-celadon hover:text-nightly-honeydew hover:bg-white/5"
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {selectedTab === "overview" && (
              <AdminOverview relationship={selectedRelationship} />
            )}

            {selectedTab === "sessions" && (
              <AdminSessions
                relationship={selectedRelationship}
                isSessionActive={isAdminSessionActive}
              />
            )}

            {selectedTab === "tasks" && (
              <AdminTasks
                relationship={selectedRelationship}
                isSessionActive={isAdminSessionActive}
              />
            )}

            {selectedTab === "settings" && (
              <AdminSettings
                relationship={selectedRelationship}
                isSessionActive={isAdminSessionActive}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Sub-components for each tab
const AdminOverview: React.FC<{ relationship: AdminRelationship }> = ({
  relationship,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <FaUsers className="text-nightly-aquamarine" />
        <h4 className="font-medium text-nightly-honeydew">Relationship</h4>
      </div>
      <div className="text-sm text-nightly-celadon space-y-1">
        <p>
          Status: <span className="text-green-400">{relationship.status}</span>
        </p>
        <p>
          Established:{" "}
          {relationship.establishedAt.toDate().toLocaleDateString()}
        </p>
        <p>Method: {relationship.linkMethod}</p>
      </div>
    </div>

    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <FaShieldAlt className="text-nightly-lavender-floral" />
        <h4 className="font-medium text-nightly-honeydew">Permissions</h4>
      </div>
      <div className="text-sm text-nightly-celadon space-y-1">
        <p>Sessions: {relationship.permissions.controlSessions ? "✓" : "✗"}</p>
        <p>Tasks: {relationship.permissions.manageTasks ? "✓" : "✗"}</p>
        <p>Settings: {relationship.permissions.editSettings ? "✓" : "✗"}</p>
      </div>
    </div>

    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <FaHistory className="text-nightly-spring-green" />
        <h4 className="font-medium text-nightly-honeydew">Activity</h4>
      </div>
      <div className="text-sm text-nightly-celadon">
        <p>
          Last Access:{" "}
          {relationship.lastAdminAccess
            ? relationship.lastAdminAccess.toDate().toLocaleDateString()
            : "Never"}
        </p>
        <p>Session Timeout: {relationship.security.sessionTimeout}m</p>
      </div>
    </div>
  </div>
);

const AdminSessions: React.FC<{
  relationship: AdminRelationship;
  isSessionActive: boolean;
}> = ({ relationship, isSessionActive }) => (
  <div className="space-y-4">
    <div className="bg-white/5 rounded-lg p-4">
      <h4 className="font-medium text-nightly-honeydew mb-3">
        Session Control
      </h4>
      {isSessionActive ? (
        <div className="space-y-4">
          <p className="text-nightly-celadon">
            You have active admin access to manage {relationship.wearerId}'s
            chastity sessions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded font-medium transition-colors">
              View Current Session
            </button>
            <button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded font-medium transition-colors">
              Start New Session
            </button>
            <button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded font-medium transition-colors">
              Pause Session
            </button>
            <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded font-medium transition-colors">
              End Session
            </button>
          </div>
        </div>
      ) : (
        <p className="text-nightly-celadon">
          Start an admin session to control {relationship.wearerId}'s chastity
          sessions.
        </p>
      )}
    </div>
  </div>
);

const AdminTasks: React.FC<{
  relationship: AdminRelationship;
  isSessionActive: boolean;
}> = ({ relationship, isSessionActive }) => (
  <div className="space-y-4">
    <div className="bg-white/5 rounded-lg p-4">
      <h4 className="font-medium text-nightly-honeydew mb-3">
        Task Management
      </h4>
      {isSessionActive ? (
        <div className="space-y-4">
          <p className="text-nightly-celadon">
            Manage tasks for {relationship.wearerId}.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded font-medium transition-colors">
              View All Tasks
            </button>
            <button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded font-medium transition-colors">
              Create New Task
            </button>
            <button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded font-medium transition-colors">
              Review Submissions
            </button>
            <button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded font-medium transition-colors">
              Set Rewards/Punishments
            </button>
          </div>
        </div>
      ) : (
        <p className="text-nightly-celadon">
          Start an admin session to manage tasks.
        </p>
      )}
    </div>
  </div>
);

const AdminSettings: React.FC<{
  relationship: AdminRelationship;
  isSessionActive: boolean;
}> = ({ relationship, isSessionActive }) => (
  <div className="space-y-4">
    <div className="bg-white/5 rounded-lg p-4">
      <h4 className="font-medium text-nightly-honeydew mb-3">Admin Settings</h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Session Timeout</span>
          <span className="text-nightly-honeydew">
            {relationship.security.sessionTimeout} minutes
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Audit Logging</span>
          <span className="text-nightly-honeydew">
            {relationship.security.auditLog ? "Enabled" : "Disabled"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Wearer Notifications</span>
          <span className="text-nightly-honeydew">
            {relationship.privacy.wearerCanSeeAdminActions
              ? "Enabled"
              : "Disabled"}
          </span>
        </div>
      </div>
    </div>
  </div>
);
