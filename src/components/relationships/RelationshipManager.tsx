/**
 * Relationship Manager Component
 * Main interface for managing keyholder relationships
 */
import React, { useState } from "react";
import { Button } from "@/components/ui";
import { useRelationships } from "@/hooks/useRelationships";
import { Relationship } from "@/types/relationships";
import {
  KeyholderRelationship,
  KeyholderPermissions,
  UserRole,
} from "@/types/core";
import { FaUserPlus } from "@/utils/iconImport";
import { MigrationBanner } from "./MigrationBanner";
import { PendingRequestsList } from "./PendingRequestsList";
import { RelationshipRequestForm } from "./RelationshipRequestForm";
import { RelationshipsList } from "./RelationshipsList";
import { ErrorDisplay } from "./ErrorDisplay";

interface RelationshipManagerProps {
  className?: string;
}

// Helper to convert Relationship to KeyholderRelationship format
const convertToKeyholderRelationship = (
  relationship: Relationship,
): KeyholderRelationship => ({
  id: relationship.id,
  submissiveUserId: relationship.submissiveId,
  keyholderUserId: relationship.keyholderId,
  status: relationship.status === "active" ? "active" : "ended",
  permissions: {} as KeyholderPermissions,
  createdAt: new Date(relationship.createdAt.toDate()),
});

const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  className = "",
}) => {
  const {
    relationships,
    pendingRequests,
    activeRelationship,
    isLoading,
    error,
    needsMigration,
    sendRelationshipRequest,
    acceptRelationshipRequest,
    rejectRelationshipRequest,
    endRelationship,
    setActiveRelationship,
    migrateSingleUserData,
    clearError,
  } = useRelationships();

  const [showRequestForm, setShowRequestForm] = useState(false);

  // Create a wrapper to handle the type conversion
  const handleSetActiveRelationship = (relationship: Relationship) => {
    setActiveRelationship(convertToKeyholderRelationship(relationship));
  };

  // Handle sending relationship request
  const handleSendRequest = async (data: {
    email: string;
    role: "submissive" | "keyholder";
    message: string;
  }) => {
    try {
      const userRole =
        data.role === "submissive" ? UserRole.SUBMISSIVE : UserRole.KEYHOLDER;
      await sendRelationshipRequest(data.email, userRole, data.message);
      setShowRequestForm(false);
    } catch (error) {
      // Handle error silently or with proper error handling
      console.error("Failed to send relationship request:", error);
    }
  };

  return (
    <main className={`max-w-4xl mx-auto p-6 ${className}`}>
      <ErrorDisplay error={error ?? null} onClear={clearError} />

      <MigrationBanner
        needsMigration={needsMigration}
        isLoading={isLoading}
        onMigrate={migrateSingleUserData}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Relationship Manager
        </h1>

        <Button
          onClick={() => setShowRequestForm(true)}
          aria-label="Create new relationship request"
          aria-expanded={showRequestForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-flex items-center"
        >
          <FaUserPlus className="mr-2" aria-hidden="true" />
          New Request
        </Button>
      </div>

      <PendingRequestsList
        pendingRequests={pendingRequests}
        isLoading={isLoading}
        onAccept={acceptRelationshipRequest}
        onReject={rejectRelationshipRequest}
      />

      <RelationshipRequestForm
        isVisible={showRequestForm}
        isLoading={isLoading}
        onSubmit={handleSendRequest}
        onCancel={() => setShowRequestForm(false)}
      />

      <RelationshipsList
        relationships={relationships}
        activeRelationship={activeRelationship}
        onSetActive={handleSetActiveRelationship}
        onEndRelationship={endRelationship}
      />
    </main>
  );
};

export default RelationshipManager;
