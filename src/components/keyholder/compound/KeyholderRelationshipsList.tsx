/**
 * KeyholderRelationshipsList - Sub-component for selecting and viewing relationships
 */

import React from "react";
import { useKeyholderContext } from "./KeyholderContext";
import { FaUsers } from "react-icons/fa";
import { Select, SelectOption } from "@/components/ui";

export const KeyholderRelationshipsList: React.FC = () => {
  const { keyholderRelationships, selectedWearerId, setSelectedWearer } =
    useKeyholderContext();

  // Don't show selector if only one relationship
  if (keyholderRelationships.length <= 1) return null;

  const wearerOptions: SelectOption[] = keyholderRelationships.map(
    (relationship) => ({
      value: relationship.wearerId,
      label: `Wearer: ${relationship.wearerId}`,
    }),
  );

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaUsers className="text-nightly-spring-green" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Select Wearer to Manage
        </h3>
      </div>

      <Select
        value={selectedWearerId || ""}
        onChange={(value) => setSelectedWearer((value as string) || null)}
        options={wearerOptions}
      />
    </div>
  );
};
