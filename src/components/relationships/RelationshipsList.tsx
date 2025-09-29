import React from "react";
import { FaEye, FaCog, FaTrash } from "react-icons/fa";
import { RelationshipStatus, type Relationship } from "@/types/relationships";

interface RelationshipsListProps {
  relationships: Relationship[];
  activeRelationship: Relationship | null;
  onSetActive: (relationship: Relationship) => void;
  onEndRelationship: (relationshipId: string) => void;
}

export const RelationshipsList: React.FC<RelationshipsListProps> = ({
  relationships,
  activeRelationship,
  onSetActive,
  onEndRelationship,
}) => {
  if (relationships.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">🤝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No relationships yet
        </h3>
        <p className="text-gray-600">
          Send a relationship request to get started with collaborative chastity
          management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Your Relationships ({relationships.length})
      </h2>

      <div className="grid gap-4">
        {relationships.map((relationship) => (
          <div
            key={relationship.id}
            className={`border rounded-lg p-4 ${
              activeRelationship?.id === relationship.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Relationship with{" "}
                    {relationship.submissiveId === relationship.keyholderId
                      ? "Yourself (Self-managed)"
                      : relationship.keyholderId}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      relationship.status === RelationshipStatus.ACTIVE
                        ? "bg-green-100 text-green-800"
                        : relationship.status === RelationshipStatus.PAUSED
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {relationship.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Your role:{" "}
                  {relationship.submissiveId === relationship.keyholderId
                    ? "Both"
                    : relationship.submissiveId === "current-user-id"
                      ? "Submissive"
                      : "Keyholder"}
                </p>
                {relationship.notes && (
                  <p className="text-sm text-gray-700 mt-1 italic">
                    "{relationship.notes}"
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Established:{" "}
                  {relationship.establishedAt.toDate().toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onSetActive(relationship)}
                  className={`p-2 rounded ${
                    activeRelationship?.id === relationship.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Set as active"
                >
                  <FaEye />
                </button>

                <button
                  className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                  title="Relationship settings"
                >
                  <FaCog />
                </button>

                <button
                  onClick={() => onEndRelationship(relationship.id)}
                  className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                  title="End relationship"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
