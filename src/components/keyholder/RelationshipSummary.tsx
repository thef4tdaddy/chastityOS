import React from "react";
import { FaUser, FaUserShield } from "../../utils/iconImport";

interface RelationshipSummaryProps {
  relationshipSummary: {
    hasActiveKeyholder: boolean;
    submissiveCount: number;
  } | null;
}

export const RelationshipSummary: React.FC<RelationshipSummaryProps> = ({
  relationshipSummary,
}) => {
  if (!relationshipSummary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* As Submissive */}
      <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
        <div className="flex items-center mb-2">
          <FaUser className="text-purple-400 mr-2" />
          <h3 className="font-semibold text-purple-300">As Submissive</h3>
        </div>
        {relationshipSummary.hasActiveKeyholder ? (
          <div className="text-green-400 text-sm">✓ Linked with keyholder</div>
        ) : (
          <div className="text-gray-400 text-sm">No active keyholder</div>
        )}
      </div>

      {/* As Keyholder */}
      <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
        <div className="flex items-center mb-2">
          <FaUserShield className="text-purple-400 mr-2" />
          <h3 className="font-semibold text-purple-300">As Keyholder</h3>
        </div>
        <div className="text-sm text-gray-300">
          {relationshipSummary.submissiveCount} submissive(s)
        </div>
      </div>
    </div>
  );
};

export default RelationshipSummary;
