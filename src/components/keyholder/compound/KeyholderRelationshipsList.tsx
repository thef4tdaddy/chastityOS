/**
 * KeyholderRelationshipsList - Sub-component for selecting and viewing relationships
 */

import React from "react";
import { useKeyholderContext } from "./KeyholderContext";
import { FaUsers } from "../../../utils/iconImport";

export const KeyholderRelationshipsList: React.FC = () => {
  const { keyholderRelationships, selectedWearerId, setSelectedWearer } =
    useKeyholderContext();

  // Don't show selector if only one relationship
  if (keyholderRelationships.length <= 1) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaUsers className="text-nightly-spring-green" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Select Wearer to Manage
        </h3>
      </div>

      <select
        value={selectedWearerId || ""}
        onChange={(e) => setSelectedWearer(e.target.value || null)}
        className="bg-black/20 text-nightly-honeydew px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
      >
        {keyholderRelationships.map((relationship) => (
          <option key={relationship.id} value={relationship.wearerId}>
            Wearer: {relationship.wearerId}
          </option>
        ))}
      </select>
    </div>
  );
};
