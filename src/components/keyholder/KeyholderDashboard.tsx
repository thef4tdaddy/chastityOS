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
  FaPrayingHands,
} from "../../utils/iconImport";
import { useAccountLinking } from "../../hooks/account-linking/useAccountLinking";
import { usePendingReleaseRequests } from "../../hooks/api/useReleaseRequests";
import { ReleaseRequestCard } from "./ReleaseRequestCard";
import { AdminRelationship } from "../../types/account-linking";
import { Select, SelectOption, Button } from "@/components/ui";
import { FeatureErrorBoundary } from "../errors/FeatureErrorBoundary";

// Loading Component - memoized to prevent re-renders
const AdminLoadingDisplay = React.memo(() => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6" role="status" aria-live="polite">
    <div className="flex items-center justify-center py-8">
      <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine" aria-hidden="true" />
      <span className="ml-3 text-nightly-celadon">
        Loading admin dashboard...
      </span>
    </div>
  </div>
));
AdminLoadingDisplay.displayName = "AdminLoadingDisplay";

// Wearer Selection Component - memoized to prevent re-renders
const WearerSelection = React.memo<{
  keyholderRelationships: AdminRelationship[];
  selectedWearerId: string | null;
  onSetSelectedWearer: (id: string | null) => void;
}>(({ keyholderRelationships, selectedWearerId, onSetSelectedWearer }) => {
  if (keyholderRelationships.length <= 1) return null;

  const wearerOptions: SelectOption[] = keyholderRelationships.map(
    (relationship) => ({
      value: relationship.wearerId,
      label: `Wearer: ${relationship.wearerId}`,
    }),
  );

  return (
    <div className="mb-6" role="group" aria-label="Wearer selection">
      <Select
        label="Select Wearer to Manage:"
        value={selectedWearerId || ""}
        onChange={(value) => onSetSelectedWearer((value as string) || null)}
        options={wearerOptions}
        fullWidth={false}
        aria-describedby="wearer-selection-help"
      />
      <span id="wearer-selection-help" className="sr-only">
        Select which submissive wearer's account you want to manage
      </span>
    </div>
  );
});
WearerSelection.displayName = "WearerSelection";

// Pending Release Requests Component - memoized for performance
const PendingReleaseRequests = React.memo<{ keyholderUserId: string }>(
  ({ keyholderUserId }) => {
    const { data: pendingRequests, isLoading } =
      usePendingReleaseRequests(keyholderUserId);

    if (isLoading) {
      return (
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-nightly-celadon text-sm sm:text-base">
            <FaSpinner className="animate-spin flex-shrink-0" />
            <span>Loading requests...</span>
          </div>
        </div>
      );
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FaPrayingHands className="text-purple-400 flex-shrink-0" />
          <h3 className="text-sm sm:text-base font-semibold text-nightly-honeydew">
            Pending Release Requests ({pendingRequests.length})
          </h3>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {pendingRequests.map((request) => (
            <FeatureErrorBoundary key={request.id} feature="release-request">
              <ReleaseRequestCard request={request} />
            </FeatureErrorBoundary>
          ))}
        </div>
      </div>
    );
  },
);
PendingReleaseRequests.displayName = "PendingReleaseRequests";

// Admin Session Status Component - memoized for performance
const AdminSessionStatus = React.memo<{
  selectedRelationship: AdminRelationship;
  isAdminSessionActive: boolean;
  onStartAdminSession: () => void;
}>(({ selectedRelationship, isAdminSessionActive, onStartAdminSession }) => (
  <div 
    className="bg-white/5 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
    role="region"
    aria-label="Admin session status"
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="w-full sm:w-auto">
        <h3 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-1">
          Admin Session
        </h3>
        <p className="text-xs sm:text-sm text-nightly-celadon break-words" role="status" aria-live="polite">
          {isAdminSessionActive
            ? `Active session for ${selectedRelationship.wearerId}`
            : "No active admin session"}
        </p>
      </div>
      <div className="w-full sm:w-auto">
        {!isAdminSessionActive ? (
          <Button
            onClick={onStartAdminSession}
            aria-label={`Start admin session for ${selectedRelationship.wearerId}`}
            className="w-full sm:w-auto bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-3 sm:py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            <FaShieldAlt className="flex-shrink-0" aria-hidden="true" />
            <span>Start Admin Session</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-400" role="status">
            <FaShieldAlt className="flex-shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Session Active</span>
          </div>
        )}
      </div>
    </div>
  </div>
));
AdminSessionStatus.displayName = "AdminSessionStatus";

// Navigation Tabs Component - memoized for performance
const NavigationTabs = React.memo<{
  selectedTab: string;
  onSetSelectedTab: (
    tab: "overview" | "sessions" | "tasks" | "settings",
  ) => void;
}>(({ selectedTab, onSetSelectedTab }) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: FaEye },
    { id: "sessions", label: "Sessions", icon: FaLock },
    { id: "tasks", label: "Tasks", icon: FaTasks },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  return (
    <nav 
      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 bg-black/20 rounded-lg p-2 sm:p-1 mb-4 sm:mb-6"
      role="tablist"
      aria-label="Dashboard sections"
    >
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() =>
            onSetSelectedTab(
              tab.id as "overview" | "sessions" | "tasks" | "settings",
            )
          }
          role="tab"
          aria-selected={selectedTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          tabIndex={selectedTab === tab.id ? 0 : -1}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 touch-manipulation ${
            selectedTab === tab.id
              ? "bg-nightly-lavender-floral text-white"
              : "text-nightly-celadon hover:text-nightly-honeydew hover:bg-white/5"
          }`}
        >
          <tab.icon className="flex-shrink-0" aria-hidden="true" />
          <span>{tab.label}</span>
        </Button>
      ))}
    </nav>
  );
});
NavigationTabs.displayName = "NavigationTabs";

// Tab Content Renderer - memoized for performance
const TabContentRenderer = React.memo<{
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

export const KeyholderDashboard: React.FC<{ keyholderUserId?: string }> = ({
  keyholderUserId,
}) => {
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

  // Memoize keyholder check to prevent unnecessary re-computation
  const isKeyholder = React.useMemo(
    () => keyholderRelationships.length > 0,
    [keyholderRelationships.length],
  );

  // Memoize selected relationship to prevent unnecessary re-computation
  const selectedRelationship = React.useMemo(
    () =>
      selectedWearerId
        ? relationships.find((r) => r.wearerId === selectedWearerId)
        : keyholderRelationships[0],
    [selectedWearerId, relationships, keyholderRelationships],
  );

  // Memoize callback to prevent re-creation on every render
  const handleStartAdminSession = React.useCallback(() => {
    if (selectedRelationship) {
      startAdminSession(selectedRelationship.id);
    }
  }, [selectedRelationship, startAdminSession]);

  if (!isKeyholder) {
    return null;
  }

  if (isLoadingRelationships) {
    return <AdminLoadingDisplay />;
  }

  return (
    <section 
      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-4 sm:mb-6"
      role="region"
      aria-label="Keyholder Dashboard"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <FaUserShield className="text-nightly-lavender-floral text-lg sm:text-base flex-shrink-0" aria-hidden="true" />
        <h2 className="text-lg sm:text-xl font-semibold text-nightly-honeydew">
          Keyholder Dashboard
        </h2>
        <span className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded flex-shrink-0" role="status" aria-label="Current role">
          KEYHOLDER
        </span>
      </div>

      {/* Wearer Selection */}
      <WearerSelection
        keyholderRelationships={keyholderRelationships}
        selectedWearerId={selectedWearerId}
        onSetSelectedWearer={setSelectedWearer}
      />

      {selectedRelationship && (
        <>
          {/* Pending Release Requests */}
          {keyholderUserId && (
            <PendingReleaseRequests keyholderUserId={keyholderUserId} />
          )}

          {/* Admin Session Status */}
          <AdminSessionStatus
            selectedRelationship={selectedRelationship}
            isAdminSessionActive={isAdminSessionActive}
            onStartAdminSession={handleStartAdminSession}
          />

          {/* Navigation Tabs */}
          <NavigationTabs
            selectedTab={selectedTab}
            onSetSelectedTab={setSelectedTab}
          />

          {/* Tab Content */}
          <TabContentRenderer
            selectedTab={selectedTab}
            selectedRelationship={selectedRelationship}
            isAdminSessionActive={isAdminSessionActive}
          />
        </>
      )}
    </section>
  );
};

// Sub-components for each tab (moved to separate functions to reduce main component size)
// Memoized for performance optimization
const AdminOverview = React.memo<{ relationship: AdminRelationship }>(
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

const AdminSessions = React.memo<{
  relationship: AdminRelationship;
  isSessionActive: boolean;
}>(({ relationship, isSessionActive }) => (
  <div className="space-y-3 sm:space-y-4">
    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
      <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-3">
        Session Control
      </h4>
      {isSessionActive ? (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-nightly-celadon break-words">
            You have active admin access to manage {relationship.wearerId}'s
            chastity sessions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              View Current Session
            </Button>
            <Button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Start New Session
            </Button>
            <Button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Pause Session
            </Button>
            <Button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              End Session
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-nightly-celadon break-words">
          Start an admin session to control {relationship.wearerId}'s chastity
          sessions.
        </p>
      )}
    </div>
  </div>
));
AdminSessions.displayName = "AdminSessions";

const AdminTasks = React.memo<{
  relationship: AdminRelationship;
  isSessionActive: boolean;
}>(({ relationship, isSessionActive }) => (
  <div className="space-y-3 sm:space-y-4">
    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
      <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-3">
        Task Management
      </h4>
      {isSessionActive ? (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-nightly-celadon break-words">
            Manage tasks for {relationship.wearerId}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              View All Tasks
            </Button>
            <Button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Create New Task
            </Button>
            <Button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Review Submissions
            </Button>
            <Button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] sm:min-h-0 text-sm touch-manipulation">
              Set Rewards/Punishments
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-nightly-celadon">
          Start an admin session to manage tasks.
        </p>
      )}
    </div>
  </div>
));
AdminTasks.displayName = "AdminTasks";

const AdminSettings = React.memo<{
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
