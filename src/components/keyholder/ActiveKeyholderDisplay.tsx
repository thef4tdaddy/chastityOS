import React, { useState } from "react";
import { Button } from "@/components/ui";
import { FaKey } from "../../utils/iconImport";
import { formatDistanceToNow } from "date-fns";
import { ErrorMessage } from "../errors/fallbacks/ErrorMessage";

interface ActiveKeyholderDisplayProps {
  activeKeyholder: {
    id: string;
    acceptedAt?: Date;
    createdAt: Date;
    permissions: Record<string, boolean>;
  };
  onEndRelationship: (id: string) => void;
}

export const ActiveKeyholderDisplay: React.FC<ActiveKeyholderDisplayProps> = ({
  activeKeyholder,
  onEndRelationship,
}) => {
  const [showPermissions, setShowPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEndRelationship = (id: string) => {
    try {
      setError(null);
      onEndRelationship(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to end relationship";
      setError(errorMessage);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500 relationship-card-interactive relationship-active-glow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-purple-300 flex items-center">
          <FaKey className="mr-2" />
          Your Keyholder
        </h3>
        <Button
          onClick={() => setShowPermissions(!showPermissions)}
          className="text-purple-400 hover:text-purple-300 text-sm relationship-transition-fast"
        >
          {showPermissions ? "Hide" : "View"} Permissions
        </Button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          variant="error"
        />
      )}

      <div className="text-sm text-gray-300 mb-3">
        <p>
          Connected:{" "}
          {formatDistanceToNow(
            activeKeyholder.acceptedAt || activeKeyholder.createdAt,
          )}{" "}
          ago
        </p>
        <p>
          Status: <span className="text-green-400">Active</span>
        </p>
      </div>

      {showPermissions && (
        <div className="mt-3 p-3 bg-gray-700 rounded border invitation-form-expand">
          <h4 className="font-medium text-purple-300 mb-2">
            Keyholder Permissions
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(activeKeyholder.permissions).map(
              ([key, value], index) => (
                <div
                  key={key}
                  className="flex items-center relationship-card-enter"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className={value ? "text-green-400" : "text-red-400"}>
                    {value ? "✓" : "✗"}
                  </span>
                  <span className="ml-2 text-gray-300">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          onClick={() => handleEndRelationship(activeKeyholder.id)}
          className="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-500 rounded hover:bg-red-900/30 relationship-transition icon-button"
        >
          End Relationship
        </Button>
      </div>
    </div>
  );
};

export default ActiveKeyholderDisplay;
