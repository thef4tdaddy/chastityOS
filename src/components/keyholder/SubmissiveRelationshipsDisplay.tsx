import React from "react";
import { Button } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

interface Relationship {
  id: string;
  acceptedAt?: Date;
  createdAt: Date;
  permissions: Record<string, boolean>;
}

interface SubmissiveRelationshipsDisplayProps {
  relationships: Relationship[];
  onEndRelationship: (id: string) => void;
}

export const SubmissiveRelationshipsDisplay: React.FC<
  SubmissiveRelationshipsDisplayProps
> = ({ relationships, onEndRelationship }) => {
  if (relationships.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30 relationship-card-interactive">
      <h3 className="font-semibold text-purple-300 mb-3">Your Submissives</h3>
      <div className="space-y-2">
        {relationships.map((relationship, index) => (
          <div
            key={relationship.id}
            className="p-3 bg-gray-700 rounded border relationship-card-enter relationship-transition"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm">
                <div className="text-green-400">Active Submissive</div>
                <div className="text-xs text-gray-400">
                  Connected:{" "}
                  {formatDistanceToNow(
                    relationship.acceptedAt || relationship.createdAt,
                  )}{" "}
                  ago
                </div>
              </div>
              <Button
                onClick={() => onEndRelationship(relationship.id)}
                className="text-red-400 hover:text-red-300 text-sm px-2 py-1 border border-red-500 rounded hover:bg-red-900/30 icon-button"
              >
                End
              </Button>
            </div>
            <div className="text-xs text-gray-400">
              Permissions:{" "}
              {Object.values(relationship.permissions).filter(Boolean).length}{" "}
              of {Object.keys(relationship.permissions).length} granted
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissiveRelationshipsDisplay;
