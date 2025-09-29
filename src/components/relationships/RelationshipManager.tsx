/**
 * Relationship Manager Component
 * Main interface for managing keyholder relationships
 */
import React, { useState } from "react";
import { useRelationships } from "@/hooks/useRelationships";
import { Relationship } from "@/types/relationships";
import { KeyholderRelationship, KeyholderPermissions } from "@/types/core";
import { FaUserPlus } from "react-icons/fa";
import { MigrationBanner } from "./MigrationBanner";
import { PendingRequestsList } from "./PendingRequestsList";
import { RelationshipRequestForm } from "./RelationshipRequestForm";
import { RelationshipsList } from "./RelationshipsList";
import { ErrorDisplay } from "./ErrorDisplay";

interface RelationshipManagerProps {
  className?: string;
}

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
  const [requestForm, setRequestForm] = useState({
    email: "",
    role: "submissive" as "submissive" | "keyholder",
    message: "",
  });

  // Create a wrapper to handle the type conversion between Relationship and KeyholderRelationship
  const handleSetActiveRelationship = (relationship: Relationship) => {
    // Convert Relationship to KeyholderRelationship format
    const keyholderRelationship: KeyholderRelationship = {
      id: relationship.id,
      submissiveUserId: relationship.submissiveId,
      keyholderUserId: relationship.keyholderId,
      status: relationship.status === "active" ? "active" : "ended",
      permissions: {} as KeyholderPermissions, // Would be populated from relationship data
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt
    };
    setActiveRelationship(keyholderRelationship);
  };

  // Handle sending relationship request
  const handleSendRequest = async (data: {
    email: string;
    role: "submissive" | "keyholder";
    message: string;
  }) => {
    try {
      await sendRelationshipRequest(data.email, data.role, data.message);
      setShowRequestForm(false);
      setRequestForm({ email: "", role: "submissive", message: "" });
    } catch {
      // Handle error silently or with proper error handling
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
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

        <button
          onClick={() => setShowRequestForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-flex items-center"
        >
          <FaUserPlus className="mr-2" />
          New Request
        </button>
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
    </div>
  );
};

export default RelationshipManager;
