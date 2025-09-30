/**
 * Relationships Page
 * Main page for managing keyholder relationships
 */
import React from "react";
import RelationshipManager from "@/components/relationships/RelationshipManager";
import { RelationshipsHelp } from "@/components/relationships/RelationshipsHelp";
import { useRelationships } from "@/hooks/useRelationships";

const RelationshipsPage: React.FC = () => {
  const { needsMigration } = useRelationships();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Keyholder Relationships
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage your connections with keyholders and submissives. Create
            relationships to share chastity tracking, tasks, and oversight.
          </p>
        </div>

        {/* Relationship manager */}
        <RelationshipManager />

        {/* Help section */}
        <RelationshipsHelp needsMigration={needsMigration} />
      </div>
    </div>
  );
};

export default RelationshipsPage;
