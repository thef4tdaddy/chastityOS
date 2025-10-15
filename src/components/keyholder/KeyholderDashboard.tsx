import React, { useState } from "react";
import { FaUserShield } from "@/utils/iconImport";
import { useAccountLinking } from "@/hooks/account-linking/useAccountLinking";
import { AdminLoadingDisplay } from "@/components/keyholder/dashboard/AdminLoadingDisplay";
import { WearerSelection } from "@/components/keyholder/dashboard/WearerSelection";
import { PendingReleaseRequests } from "@/components/keyholder/dashboard/PendingReleaseRequests";
import { AdminSessionStatus } from "@/components/keyholder/dashboard/AdminSessionStatus";
import { NavigationTabs } from "@/components/keyholder/dashboard/NavigationTabs";
import { TabContentRenderer } from "@/components/keyholder/dashboard/TabContentRenderer";

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
        <FaUserShield
          className="text-nightly-lavender-floral text-lg sm:text-base flex-shrink-0"
          aria-hidden="true"
        />
        <h2 className="text-lg sm:text-xl font-semibold text-nightly-honeydew">
          Keyholder Dashboard
        </h2>
        <span
          className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded flex-shrink-0"
          role="status"
          aria-label="Current role"
        >
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
