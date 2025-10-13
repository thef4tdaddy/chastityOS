import React from "react";
import { AdminRelationship } from "@/types/account-linking";
import { Select, SelectOption } from "@/components/ui";

// Wearer Selection Component - memoized to prevent re-renders
export const WearerSelection = React.memo<{
  keyholderRelationships: AdminRelationship[];
  selectedWearerId: string | null;
  onSetSelectedWearer: (id: string | null) => void;
}>(({ keyholderRelationships, selectedWearerId, onSetSelectedWearer }) => {
  if (keyholderRelationships.length <= 1) return null;

  const wearerOptions: SelectOption[] = keyholderRelationships.map(
    (relationship) => ({
      value: relationship.wearerId,
      label: `Wearer: ${relationship.wearerId}`,
    }),
  );

  return (
    <div className="mb-6" role="group" aria-label="Wearer selection">
      <Select
        label="Select Wearer to Manage:"
        value={selectedWearerId || ""}
        onChange={(value) => onSetSelectedWearer((value as string) || null)}
        options={wearerOptions}
        fullWidth={false}
        aria-describedby="wearer-selection-help"
      />
      <span id="wearer-selection-help" className="sr-only">
        Select which submissive wearer's account you want to manage
      </span>
    </div>
  );
});
WearerSelection.displayName = "WearerSelection";
