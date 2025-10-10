import React from "react";
import { Button } from "@/components/ui";
import { FaTimes } from "../../utils/iconImport";

interface ErrorDisplayProps {
  error: string | null;
  onClear: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onClear,
}) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <p className="text-red-800">{error}</p>
        <Button onClick={onClear} className="text-red-600 hover:text-red-800">
          <FaTimes />
        </Button>
      </div>
    </div>
  );
};
