/**
 * Relationship Manager Component
 * Main interface for managing keyholder relationships
 */
import React, { useState } from "react";
import { useRelationships } from "@/hooks/useRelationships";
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

  const handleSendRequest = async (requestData: {
    email: string;
    role: "submissive" | "keyholder";
    message: string;
  }) => {
    await sendRelationshipRequest(
      requestData.email,
      requestData.role,
      requestData.message,
    );
    setShowRequestForm(false);
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
        onSetActive={setActiveRelationship}
        onEndRelationship={endRelationship}
      />
    </div>
  );
};

export default RelationshipManager;
